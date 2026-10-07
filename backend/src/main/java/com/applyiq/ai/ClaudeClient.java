package com.applyiq.ai;

import com.applyiq.common.exception.AiServiceException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
 *   1024 tokens for Sonnet — if the system prompt below ever drops under
 *   that (e.g. after trimming it), caching silently stops applying; keep it
 *   padded past that floor or check actual cache-hit usage in the response.</li>
 *   <li><b>Output</b>: forced tool-use with a strict schema asking only for
 *   the delta Java doesn't already know — predicted keywords, a short
 *   rationale, optional bullets. Claude is never asked to re-emit the
 *   explicit keyword lists it was given; echoing back known data is pure
 *   output-token waste.</li>
 * </ul>
 */
@Component
public class ClaudeClient {

    private static final Logger log = LoggerFactory.getLogger(ClaudeClient.class);

    private static final String TOOL_NAME = "submit_match_analysis";

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
            - Call the submit_match_analysis tool exactly once with your answer. Do not add prose \
            outside the tool call.
            """;

    // Deliberately NOT a Spring-managed/injected ObjectMapper: Spring Boot 4 auto-configures
    // Jackson 3 (tools.jackson.*) for its own HTTP message conversion, a different class
    // entirely from classic Jackson 2's com.fasterxml.jackson.databind.ObjectMapper used here.
    // Owning a plain instance - and talking to RestClient in raw strings below, never handing
    // it a JsonNode/ObjectNode to convert - keeps this class's JSON handling fully independent
    // of whatever Jackson version Spring's web layer is wired to.
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final RestClient anthropicRestClient;
    private final String model;
    private final int maxTokens;

    public ClaudeClient(RestClient anthropicRestClient,
                         @Value("${app.anthropic.model}") String model,
                         @Value("${app.anthropic.max-tokens:1024}") int maxTokens) {
        this.anthropicRestClient = anthropicRestClient;
        this.model = model;
        this.maxTokens = maxTokens;
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
        String cleanedJobDescription = JdTextCleaner.clean(jobDescription);
        ObjectNode requestBody = buildRequestBody(cleanedJobDescription, explicitJobDescriptionSkills,
                explicitResumeSkills, includeBulletSuggestions);

        String responseBody;
        try {
            responseBody = anthropicRestClient.post()
                    .uri("/v1/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.writeValueAsString(requestBody))
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Anthropic API call failed", e);
            throw new AiServiceException("Resume match analysis is temporarily unavailable. Please try again.", e);
        }

        JsonNode response;
        try {
            response = objectMapper.readTree(responseBody);
        } catch (Exception e) {
            log.error("Failed to parse Anthropic API response: {}", responseBody, e);
            throw new AiServiceException("Resume match analysis returned an unreadable response.", e);
        }

        return parseToolUseResponse(response);
    }

    private ObjectNode buildRequestBody(String cleanedJobDescription,
                                         List<ScoredKeyword> jdSkills,
                                         List<ScoredKeyword> resumeSkills,
                                         boolean includeBulletSuggestions) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", maxTokens);

        ArrayNode system = root.putArray("system");
        ObjectNode systemBlock = system.addObject();
        systemBlock.put("type", "text");
        systemBlock.put("text", SYSTEM_PROMPT);
        systemBlock.putObject("cache_control").put("type", "ephemeral");

        ArrayNode messages = root.putArray("messages");
        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        userMessage.put("content", buildUserTurn(cleanedJobDescription, jdSkills, resumeSkills, includeBulletSuggestions));

        ArrayNode tools = root.putArray("tools");
        tools.add(buildToolDefinition());

        ObjectNode toolChoice = root.putObject("tool_choice");
        toolChoice.put("type", "tool");
        toolChoice.put("name", TOOL_NAME);

        return root;
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

    private ObjectNode buildToolDefinition() {
        ObjectNode tool = objectMapper.createObjectNode();
        tool.put("name", TOOL_NAME);
        tool.put("description", "Submit the structured resume-to-job match analysis.");

        ObjectNode schema = tool.putObject("input_schema");
        schema.put("type", "object");

        ObjectNode properties = schema.putObject("properties");

        ObjectNode predictedKeywords = properties.putObject("predictedKeywords");
        predictedKeywords.put("type", "array");
        ObjectNode predictedKeywordItems = predictedKeywords.putObject("items");
        predictedKeywordItems.put("type", "object");
        ObjectNode predictedKeywordProps = predictedKeywordItems.putObject("properties");
        predictedKeywordProps.putObject("name").put("type", "string");
        ObjectNode weightSchema = predictedKeywordProps.putObject("weight");
        weightSchema.put("type", "integer");
        weightSchema.put("minimum", 1);
        weightSchema.put("maximum", 100);
        predictedKeywordProps.putObject("foundInResume").put("type", "boolean");
        ArrayNode predictedKeywordRequired = predictedKeywordItems.putArray("required");
        predictedKeywordRequired.add("name").add("weight").add("foundInResume");

        properties.putObject("scoreRationale").put("type", "string");

        ObjectNode bullets = properties.putObject("suggestedResumeBullets");
        bullets.put("type", "array");
        bullets.putObject("items").put("type", "string");

        ArrayNode required = schema.putArray("required");
        required.add("predictedKeywords").add("scoreRationale");

        return tool;
    }

    private AnalysisResult parseToolUseResponse(JsonNode response) {
        if (response == null || !response.has("content")) {
            throw new AiServiceException("Resume match analysis returned an unexpected response.");
        }
        for (JsonNode block : response.get("content")) {
            if (!"tool_use".equals(block.path("type").asText())) {
                continue;
            }
            JsonNode input = block.get("input");
            if (input == null) {
                continue;
            }

            List<PredictedKeyword> predicted = new ArrayList<>();
            for (JsonNode kw : input.path("predictedKeywords")) {
                predicted.add(new PredictedKeyword(
                        kw.path("name").asText(""),
                        kw.path("weight").asInt(50),
                        kw.path("foundInResume").asBoolean(false)
                ));
            }

            List<String> bullets = new ArrayList<>();
            for (JsonNode bullet : input.path("suggestedResumeBullets")) {
                bullets.add(bullet.asText());
            }

            String rationale = input.path("scoreRationale").asText("");
            return new AnalysisResult(predicted, rationale, bullets);
        }
        throw new AiServiceException("Resume match analysis did not return a structured result.");
    }
}
