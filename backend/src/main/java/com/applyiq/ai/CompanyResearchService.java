package com.applyiq.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.BreakIterator;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Builds the "Company Research" section of an interview prep from public sources, with no AI:
 * Wikipedia's intro paragraphs (found by search), the official website from Wikidata, and that
 * site's own meta description. Every lookup is best-effort; anything that fails is skipped.
 */
@Service
public class CompanyResearchService {

    private static final Logger log = LoggerFactory.getLogger(CompanyResearchService.class);

    // Wikimedia asks API clients to identify themselves.
    private static final String USER_AGENT = "ApplyIQ/1.0 (job application tracker; interview prep research)";
    private static final int MAX_WIKIPEDIA_BULLETS = 6;
    private static final Duration TIMEOUT = Duration.ofSeconds(6);

    // A jobUrl on one of these is the job board's site, not the company's.
    private static final Set<String> JOB_BOARD_HOSTS = Set.of(
            "greenhouse.io", "lever.co", "myworkdayjobs.com", "workday.com", "ashbyhq.com", "smartrecruiters.com",
            "linkedin.com", "indeed.com", "icims.com", "jobvite.com", "joinhandshake.com", "glassdoor.com",
            "wellfound.com", "ziprecruiter.com", "simplify.jobs", "builtin.com");

    private static final Pattern META_TAG = Pattern.compile(
            "<meta\\s[^>]*(?:name|property)\\s*=\\s*[\"'](?:og:)?description[\"'][^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern CONTENT_ATTR = Pattern.compile(
            "content\\s*=\\s*(\"([^\"]*)\"|'([^']*)')", Pattern.CASE_INSENSITIVE);

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final ObjectMapper json = new ObjectMapper();

    public List<String> research(String companyName, String jobUrl) {
        List<String> bullets = new ArrayList<>();
        List<String> sources = new ArrayList<>();
        String website = null;

        try {
            JsonNode page = findWikipediaPage(companyName);
            if (page != null) {
                bullets.addAll(sentences(page.path("extract").asText(""), MAX_WIKIPEDIA_BULLETS));
                sources.add("https://en.wikipedia.org/wiki/" + page.path("title").asText().replace(' ', '_'));
                String wikidataId = page.path("pageprops").path("wikibase_item").asText("");
                if (!wikidataId.isEmpty()) {
                    website = officialWebsite(wikidataId);
                }
            }
        } catch (Exception e) {
            log.warn("Wikipedia lookup failed for {}: {}", companyName, e.toString());
        }

        if (website == null) {
            website = companySiteFromJobUrl(jobUrl);
        }
        if (website != null) {
            try {
                String description = metaDescription(getText(website));
                if (description != null) {
                    bullets.add("In their own words: \"" + description + "\"");
                }
            } catch (Exception e) {
                log.warn("Website lookup failed for {}: {}", website, e.toString());
            }
            sources.add(website);
        }

        if (bullets.isEmpty()) {
            bullets.add("No public company information was found automatically. Read the company's About page "
                    + "and recent news before the interview.");
        }
        if (!sources.isEmpty()) {
            bullets.add("Sources: " + String.join(" · ", sources));
        }
        return bullets;
    }

    /** Top search hit for "{name} company" that isn't a disambiguation page, with its intro and Wikidata id. */
    private JsonNode findWikipediaPage(String companyName) throws Exception {
        String url = "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2"
                + "&generator=search&gsrlimit=3&gsrsearch=" + encode(companyName + " company")
                + "&prop=extracts%7Cpageprops&exintro=1&explaintext=1&redirects=1";
        JsonNode best = null;
        for (JsonNode page : json.readTree(getText(url)).path("query").path("pages")) {
            if (page.path("pageprops").has("disambiguation")) {
                continue;
            }
            if (best == null || page.path("index").asInt() < best.path("index").asInt()) {
                best = page;
            }
        }
        return best;
    }

    /** Wikidata property P856, "official website". */
    private String officialWebsite(String wikidataId) throws Exception {
        String url = "https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P856&entity="
                + encode(wikidataId);
        String website = pickWebsite(json.readTree(getText(url)).path("claims").path("P856"));
        return website.startsWith("http") ? website : null;
    }

    // English-language Wikidata items: English, American English, British English.
    private static final Set<String> ENGLISH = Set.of("Q1860", "Q7976", "Q7979");

    /** Big companies list one site per country (Amazon: amazon.it, amazon.de...). Prefer the preferred-rank one, then English, then the first. */
    static String pickWebsite(JsonNode claims) {
        JsonNode english = null;
        for (JsonNode claim : claims) {
            if ("preferred".equals(claim.path("rank").asText())) {
                return claim.path("mainsnak").path("datavalue").path("value").asText("");
            }
            for (JsonNode language : claim.path("qualifiers").path("P407")) {
                if (english == null && ENGLISH.contains(language.path("datavalue").path("value").path("id").asText())) {
                    english = claim;
                }
            }
        }
        JsonNode chosen = english != null ? english : claims.path(0);
        return chosen.path("mainsnak").path("datavalue").path("value").asText("");
    }

    private String getText(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(TIMEOUT)
                .header("User-Agent", USER_AGENT)
                .GET()
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("HTTP " + response.statusCode() + " from " + url);
        }
        return response.body();
    }

    /** The jobUrl's site root, unless it's a job board. "careers.acme.com/jobs/1" -> "https://acme.com". */
    static String companySiteFromJobUrl(String jobUrl) {
        if (jobUrl == null || jobUrl.isBlank()) {
            return null;
        }
        try {
            String host = URI.create(jobUrl.trim()).getHost();
            if (host == null) {
                return null;
            }
            host = host.toLowerCase(Locale.ROOT).replaceFirst("^(www|careers|jobs)\\.", "");
            for (String board : JOB_BOARD_HOSTS) {
                if (host.equals(board) || host.endsWith("." + board)) {
                    return null;
                }
            }
            return "https://" + host;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** The page's {@code <meta name="description">}, falling back to og:description. */
    static String metaDescription(String html) {
        String found = null;
        Matcher tags = META_TAG.matcher(html);
        while (tags.find()) {
            Matcher content = CONTENT_ATTR.matcher(tags.group());
            if (!content.find()) {
                continue;
            }
            String value = decodeEntities(content.group(2) != null ? content.group(2) : content.group(3)).trim();
            if (value.isEmpty()) {
                continue;
            }
            if (!tags.group().toLowerCase(Locale.ROOT).contains("og:")) {
                return value;
            }
            if (found == null) {
                found = value;
            }
        }
        return found;
    }

    /** The first {@code max} sentences of {@code text}, one per bullet. */
    static List<String> sentences(String text, int max) {
        List<String> result = new ArrayList<>();
        BreakIterator iterator = BreakIterator.getSentenceInstance(Locale.US);
        iterator.setText(text);
        int start = iterator.first();
        for (int end = iterator.next(); end != BreakIterator.DONE && result.size() < max; start = end, end = iterator.next()) {
            String sentence = text.substring(start, end).trim();
            // Skip fragments like a lone "Inc." split off by the sentence breaker.
            if (sentence.length() > 25) {
                result.add(sentence);
            }
        }
        return result;
    }

    private static String decodeEntities(String s) {
        return s.replace("&quot;", "\"").replace("&#39;", "'").replace("&#x27;", "'").replace("&apos;", "'")
                .replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ").replace("&amp;", "&");
    }

    private static String encode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
