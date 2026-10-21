package com.applyiq.ai;

import com.applyiq.common.exception.AiServiceException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Thin wrapper around a single Anthropic Messages API call. This is where
 * every token-saving decision for the "predicted keywords" half of match
 * analysis lives:
 *
 * <ul>
 *   <li><b>Input</b>: never the raw resume text. By the time a call reaches
 *   here, {@link SkillExtractionService} has already reduced both the JD and
 *   the resume to compact explicit-skill lists (a few dozen short strings,
 *   not hundreds of words of prose) — only the JD's own text is sent in full
 *   (trimmed of boilerplate by {@link JdTextCleaner}), because inferring
 *   *implied* skills genuinely needs real sentence context the dictionary
 *   pass throws away. The resume doesn't need that same context for a yes/no
 *   "does the candidate have X" check, so it never leaves Java as prose.</li>
 *   <li><b>System prompt caching</b>: the instructions + canonical skill
 *   vocabulary are identical on every call (see {@link #SYSTEM_PROMPT}) and
 *   marked with an ephemeral cache breakpoint, so repeat calls within the
 *   cache TTL pay the ~90%-cheaper cached-read rate on that block instead of
 *   paying full price every time. Anthropic's minimum cacheable block is
 *   model-dependent (1024+ tokens) — if the system prompt below ever drops under
 *   that (e.g. after trimming it), caching silently stops applying; keep it
 *   padded past that floor or check actual cache-hit usage in the response.</li>
 *   <li><b>Output</b>: structured outputs (a strict JSON schema) asking only for
 *   the delta Java doesn't already know — predicted keywords, a short
 *   rationale, optional bullets. Claude is never asked to re-emit the
 *   explicit keyword lists it was given; echoing back known data is pure
 *   output-token waste.</li>
 * </ul>
 */
@Component
public class ClaudeClient {

    private static final Logger log = LoggerFactory.getLogger(ClaudeClient.class);

    private static final String SYSTEM_PROMPT = """
            You are the skill-matching engine for ApplyIQ, a job application tracker. Given a job \
            description and two lists of skills already found by exact text matching (one from the \
            job description, one from a candidate's resume), identify skills this specific role \
            likely expects that are implied by the posting but never stated outright, and judge \
            whether the candidate's resume already covers each one.

            Known skill vocabulary — reuse one of these exact names whenever a predicted skill \
            matches it, so results stay consistent with the rest of the system; invent a new, \
            concise, title-cased name only when nothing here genuinely fits:
            Java, Spring Boot, Spring Security, Hibernate, Python, JavaScript, TypeScript, React, \
            Redux, Node.js, Express, REST APIs, GraphQL, API Design, SQL, PostgreSQL, MySQL, \
            MongoDB, NoSQL, Database Design, Query Optimization, Docker, Kubernetes, \
            Containerization, Microservices, Distributed Systems, API Gateway, CI/CD, Jenkins, \
            GitHub Actions, Automated Testing, AWS, Azure, GCP, Cloud Infrastructure, Terraform, \
            Infrastructure as Code, Kafka, Event-Driven Architecture, Git, Agile, Scrum, \
            Sprint Planning, Unit Testing, System Design, Scalability, Communication, Leadership, \
            Mentoring, Problem Solving, Cross-functional Collaboration.

            Rules:
            - Never repeat a skill already present in the "explicit job description skills" list \
            you're given — only name skills the posting implies but never states outright.
            - Weight each predicted skill 1-100 for how central it is to THIS specific role, using \
            the same scale as the explicit lists you were given (not a generic average for the skill).
            - Set foundInResume to true only if the "explicit resume skills" list already covers \
            that skill directly or as a clear, unambiguous synonym — when genuinely unsure, false.
            - Keep scoreRationale to 1-2 sentences, specific to this posting and this resume's gaps, \
            never generic boilerplate.
            - Only populate suggestedResumeBullets if the user turn explicitly asks for them; \
            otherwise return an empty array — do not generate them unprompted.
            """;

    // Deliberately NOT a Spring-managed/injected ObjectMapper: Spring Boot 4 auto-configures
    // Jackson 3 (tools.jackson.*) for its own HTTP message conversion, a different class
    // entirely from classic Jackson 2's com.fasterxml.jackson.databind.ObjectMapper used here.
    // Owning a plain instance - and talking to RestClient in raw strings below, never handing
    // it a JsonNode/ObjectNode to convert - keeps this class's JSON handling fully independent
    // of whatever Jackson version Spring's web layer is wired to.
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Structured outputs: the response text is guaranteed to match this schema. Strict mode
    // needs additionalProperties=false and every property required, and doesn't allow
    // numeric bounds - weights are clamped to 1-100 in Java instead.
    private static final String MATCH_SCHEMA_JSON = """
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["predictedKeywords", "scoreRationale", "suggestedResumeBullets"],
              "properties": {
                "predictedKeywords": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["name", "weight", "foundInResume"],
                    "properties": {
                      "name": {"type": "string"},
                      "weight": {"type": "integer"},
                      "foundInResume": {"type": "boolean"}
                    }
                  }
                },
                "scoreRationale": {"type": "string"},
                "suggestedResumeBullets": {"type": "array", "items": {"type": "string"}}
              }
            }
            """;

    private final RestClient anthropicRestClient;
    private final String model;
    private final int maxTokens;
    private final JsonNode matchSchema;

    public ClaudeClient(RestClient anthropicRestClient,
                         @Value("${app.anthropic.model}") String model,
                         @Value("${app.anthropic.max-tokens:1024}") int maxTokens) throws JsonProcessingException {
        this.anthropicRestClient = anthropicRestClient;
        this.model = model;
        this.maxTokens = maxTokens;
        this.matchSchema = objectMapper.readTree(MATCH_SCHEMA_JSON);
    }

    public record PredictedKeyword(String name, int weight, boolean foundInResume) {
    }

    public record AnalysisResult(List<PredictedKeyword> predictedKeywords,
                                  String scoreRationale,
                                  List<String> suggestedResumeBullets) {
    }

    public AnalysisResult analyzeMatch(String jobDescription,
                                        List<ScoredKeyword> explicitJobDescriptionSkills,
                                        List<ScoredKeyword> explicitResumeSkills,
                                        boolean includeBulletSuggestions) {
        String userTurn = buildUserTurn(JdTextCleaner.clean(jobDescription), explicitJobDescriptionSkills,
                explicitResumeSkills, includeBulletSuggestions);
        // A lookup-style task: no extended thinking ("between_tools" is Sonnet 5.5's off switch), low effort.
        JsonNode input = generateJson(SYSTEM_PROMPT, userTurn, matchSchema, "between_tools", "low", maxTokens,
                "Resume match analysis");

        List<PredictedKeyword> predicted = new ArrayList<>();
        for (JsonNode kw : input.path("predictedKeywords")) {
            predicted.add(new PredictedKeyword(
                    kw.path("name").asText(""),
                    Math.clamp(kw.path("weight").asInt(50), 1, 100),
                    kw.path("foundInResume").asBoolean(false)
            ));
        }
        List<String> bullets = new ArrayList<>();
        for (JsonNode bullet : input.path("suggestedResumeBullets")) {
            bullets.add(bullet.asText());
        }
        return new AnalysisResult(predicted, input.path("scoreRationale").asText(""), bullets);
    }

    /**
     * One Messages API call whose answer must match {@code schema}. Shared by every AI feature:
     * the system prompt gets a cache breakpoint, refusals fall back server-side to another
     * model, and anything other than a complete, schema-valid answer becomes an
     * {@link AiServiceException} named after {@code feature}.
     */
    public JsonNode generateJson(String systemPrompt, String userTurn, JsonNode schema, String thinkingType,
                                 String effort, int maxTokens, String feature) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", maxTokens);
        root.put("fallbacks", "default");
        root.putObject("thinking").put("type", thinkingType);

        ObjectNode systemBlock = root.putArray("system").addObject();
        systemBlock.put("type", "text");
        systemBlock.put("text", systemPrompt);
        systemBlock.putObject("cache_control").put("type", "ephemeral");

        ObjectNode userMessage = root.putArray("messages").addObject();
        userMessage.put("role", "user");
        userMessage.put("content", userTurn);

        ObjectNode outputConfig = root.putObject("output_config");
        outputConfig.put("effort", effort);
        ObjectNode format = outputConfig.putObject("format");
        format.put("type", "json_schema");
        format.set("schema", schema);

        String responseBody;
        try {
            responseBody = anthropicRestClient.post()
                    .uri("/v1/messages")
                    .header("anthropic-beta", "server-side-fallback-2026-07-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.writeValueAsString(root))
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Anthropic API call failed ({})", feature, e);
            throw new AiServiceException(feature + " is temporarily unavailable. Please try again.", e);
        }

        try {
            JsonNode response = objectMapper.readTree(responseBody);
            String stopReason = response.path("stop_reason").asText();
            if ("refusal".equals(stopReason)) {
                log.warn("{} declined: {}", feature, response.path("stop_details"));
                throw new AiServiceException(feature + " was declined for this input.");
            }
            if ("max_tokens".equals(stopReason)) {
                throw new AiServiceException(feature + " ran out of room before finishing. Try a lower effort level.");
            }
            for (JsonNode block : response.path("content")) {
                if ("text".equals(block.path("type").asText())) {
                    return objectMapper.readTree(block.path("text").asText());
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse Anthropic API response ({}): {}", feature, responseBody, e);
        }
        throw new AiServiceException(feature + " returned an unreadable response.");
    }

    private String buildUserTurn(String cleanedJobDescription,
                                  List<ScoredKeyword> jdSkills,
                                  List<ScoredKeyword> resumeSkills,
                                  boolean includeBulletSuggestions) {
        String jdSkillList = formatSkillList(jdSkills);
        String resumeSkillList = formatSkillList(resumeSkills);
        String bulletsInstruction = includeBulletSuggestions
                ? "Also include 2-3 suggestedResumeBullets the candidate could add to better target this role."
                : "Do not include suggestedResumeBullets — leave that array empty.";

        return """
                Job description:
                %s

                Explicit job description skills (already found by exact text match — do not repeat these):
                %s

                Explicit resume skills (already found by exact text match in the candidate's resume):
                %s

                %s
                """.formatted(cleanedJobDescription, jdSkillList, resumeSkillList, bulletsInstruction);
    }

    private static String formatSkillList(List<ScoredKeyword> skills) {
        if (skills.isEmpty()) {
            return "(none found)";
        }
        return skills.stream()
                .map(k -> k.name() + " (" + k.weight() + ")")
                .collect(Collectors.joining(", "));
    }
}
