package com.applyiq.email;

import com.applyiq.common.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/** Reads recent messages from, and sends follow-ups through, the Gmail REST API. */
@Component
public class InboxClient {

    // ponytail: cap per sync (newest first); anything past it in one window is skipped. Only the
    // first sync after connecting (14-day lookback) gets near it once the search pre-filter applies.
    private static final int MAX_MESSAGES = 300;

    public record EmailMessage(String fromName, String fromAddress, String subject, String body, Instant receivedAt) {
    }

    private final RestClient http = RestClient.create();
    private final ObjectMapper json = new ObjectMapper();

    public String emailAddress(String accessToken) {
        return get(accessToken, "https://gmail.googleapis.com/gmail/v1/users/me/profile").path("emailAddress").asText(null);
    }

    public List<EmailMessage> fetchSince(String token, Instant since) {
        // Gmail's own search narrows to mail that could be recruiting-related ({a b} = a OR b), so a
        // busy inbox doesn't cost one API call per newsletter. Every phrase EmailClassifier acts on
        // contains one of these words.
        String q = "after:" + since.getEpochSecond() + " -in:sent -in:chats"
                + " {application applying applied interview candidacy candidate position}";
        List<String> ids = new ArrayList<>();
        String pageToken = null;
        do {
            JsonNode page = get(token, "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q={q}"
                    + (pageToken != null ? "&pageToken={p}" : ""), q, pageToken);
            page.path("messages").forEach(ref -> ids.add(ref.get("id").asText()));
            pageToken = page.path("nextPageToken").asText(null);
        } while (pageToken != null && ids.size() < MAX_MESSAGES);

        List<EmailMessage> messages = new ArrayList<>();
        for (String id : ids.subList(0, Math.min(ids.size(), MAX_MESSAGES))) {
            JsonNode m = get(token, "https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}?format=full", id);
            String from = "", subject = "";
            for (JsonNode h : m.path("payload").path("headers")) {
                if (h.path("name").asText().equalsIgnoreCase("From")) from = h.path("value").asText();
                if (h.path("name").asText().equalsIgnoreCase("Subject")) subject = h.path("value").asText();
            }
            String body = gmailBody(m.path("payload"), "text/plain");
            if (body == null) body = stripHtml(gmailBody(m.path("payload"), "text/html"));
            if (body == null) body = m.path("snippet").asText("");
            messages.add(new EmailMessage(displayName(from), address(from), subject, body,
                    Instant.ofEpochMilli(m.path("internalDate").asLong())));
        }
        return messages;
    }

    private String gmailBody(JsonNode part, String mimeType) {
        if (part.path("mimeType").asText().equals(mimeType) && part.path("body").hasNonNull("data")) {
            return new String(Base64.getUrlDecoder().decode(part.path("body").get("data").asText()), StandardCharsets.UTF_8);
        }
        for (JsonNode child : part.path("parts")) {
            String found = gmailBody(child, mimeType);
            if (found != null) return found;
        }
        return null;
    }

    /** Sends a plain-text email from the connected inbox (it lands in the user's Sent folder). */
    public void send(String token, String to, String subject, String body) {
        String recipient = to.replaceAll("[\\r\\n]", "");
        try {
            // Subject and body are base64-encoded, so user text can't inject extra MIME headers.
            String mime = "To: " + recipient + "\r\n"
                    + "Subject: =?UTF-8?B?" + b64(subject) + "?=\r\n"
                    + "MIME-Version: 1.0\r\n"
                    + "Content-Type: text/plain; charset=UTF-8\r\n"
                    + "Content-Transfer-Encoding: base64\r\n\r\n"
                    + b64(body);
            String payload = json.writeValueAsString(Map.of("raw",
                    Base64.getUrlEncoder().encodeToString(mime.getBytes(StandardCharsets.UTF_8))));
            http.post().uri("https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload).retrieve().toBodilessEntity();
        } catch (Exception e) {
            throw new BadRequestException("Couldn't send the email: " + e.getMessage()
                    + " — if you connected this inbox before sending was added, disconnect and reconnect it.");
        }
    }

    private static String b64(String s) {
        return Base64.getEncoder().encodeToString(s.getBytes(StandardCharsets.UTF_8));
    }

    private JsonNode get(String token, String uri, Object... vars) {
        try {
            return json.readTree(http.get().uri(uri, vars).header("Authorization", "Bearer " + token)
                    .retrieve().body(String.class));
        } catch (Exception e) {
            throw new BadRequestException("Couldn't read the inbox: " + e.getMessage());
        }
    }

    // "Acme Careers <jobs@acme.com>" -> "Acme Careers" / "jobs@acme.com"
    static String displayName(String from) {
        int lt = from.indexOf('<');
        return (lt > 0 ? from.substring(0, lt) : "").replace("\"", "").trim();
    }

    static String address(String from) {
        int lt = from.indexOf('<'), gt = from.indexOf('>');
        return (lt >= 0 && gt > lt ? from.substring(lt + 1, gt) : from).trim().toLowerCase();
    }

    private static String stripHtml(String html) {
        return html == null ? null : html.replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", " ")
                .replaceAll("<[^>]+>", " ").replace("&nbsp;", " ").replace("&amp;", "&").replaceAll("\\s+", " ");
    }
}
