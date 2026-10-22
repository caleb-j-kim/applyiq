package com.applyiq.email;

/**
 * OAuth endpoints and the narrowest scopes for each inbox: read (status sync) + send (follow-ups).
 * Gmail only (Outlook was removed); still an enum so the stored provider column and the
 * /api/email/{provider} routes don't change if another provider is added later.
 */
public enum EmailProvider {
    GMAIL("https://accounts.google.com/o/oauth2/v2/auth",
            "https://oauth2.googleapis.com/token",
            "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send");

    final String authUrl;
    final String tokenUrl;
    final String scope;

    EmailProvider(String authUrl, String tokenUrl, String scope) {
        this.authUrl = authUrl;
        this.tokenUrl = tokenUrl;
        this.scope = scope;
    }
}
