# Gmail OAuth setup

ApplyIQ's email features (Settings → Email accounts, and **Send email** on Follow-Ups) use
standard OAuth 2.0 authorization-code sign-in with Google. The code is in `backend/.../email/`;
what it needs from you is a (free) Google OAuth client. Gmail is the only supported inbox.

Redirect URI to register (local dev):

```
http://127.0.0.1:8080/api/email/oauth/callback
```

Use `127.0.0.1`, not `localhost`. On Windows with Docker Desktop, WSL2's localhost relay
(a `DllHost.exe` process) listens on `[::1]:8080` and drops connections, and browsers try `::1`
first for `localhost`. So a `localhost` callback never reaches the backend and the popup fails
with "connection terminated". The frontend's API base URL uses `127.0.0.1` for the same reason.

For production, also register `https://<your-backend-host>/api/email/oauth/callback` and set
`EMAIL_OAUTH_REDIRECT_URI` to it (on Render: the service's environment variables).

## Gmail (Google Cloud)

1. Go to <https://console.cloud.google.com/>, create a project (e.g. "ApplyIQ").
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.
3. **Google Auth Platform** (formerly "OAuth consent screen"):
   - **Branding**: app name "ApplyIQ", your support email.
   - **Audience**: User type **External**. Leave it in **Testing** and add every Gmail address
     that will connect under **Test users** (up to 100).
   - **Data access → Add or remove scopes**: add
     `https://www.googleapis.com/auth/gmail.readonly` and
     `https://www.googleapis.com/auth/gmail.send`.
4. **Clients → Create client** → type **Web application**. Under **Authorized redirect URIs**,
   add the redirect URI above. Create, then copy the **Client ID** and **Client secret**.

While the app is in Testing, Google expires refresh tokens after **7 days**, so a connected Gmail
stops syncing weekly and needs **Disconnect → Connect** again. Removing that limit means
publishing the app, and `gmail.readonly` is a restricted scope, so that requires Google's
verification (and a security assessment).

## Turn it on

Fill these in the repo-root `.env` (gitignored — never commit them):

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# Encrypts stored inbox tokens. Optional locally (falls back to JWT_SECRET); set it in production.
EMAIL_TOKEN_KEY=<openssl rand -base64 48>
```

Then rebuild the backend: `docker-compose up -d --build backend`. Without credentials the
Connect button stays disabled.

Test: log in with a normal (non-demo) account → Settings → Email accounts → **Connect** → approve
in the popup → it closes and shows your address. Follow-Ups → a "Send … follow-up" → pick a draft →
**Send email** sends it from that inbox, and a notification appears in the bell.
