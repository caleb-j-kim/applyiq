# ApplyIQ

AI-powered job application assistant.

## Repo structure

```
frontend/   React + TypeScript app (see frontend/README.md)
backend/    Java + Spring Boot REST API (see backend/README.md)
database/   schema documentation (see database/README.md) — no separate
            migration files; Hibernate generates the schema from the
            backend's entity classes
```

The frontend still runs on mock data (`frontend/src/data/mock-data.ts`) — it
hasn't been wired up to the backend yet. The backend itself implements auth,
job application CRUD, resumes (upload/download/active-resume tracking),
a dashboard aggregation endpoint, and notifications. The `ai` module (resume
match scoring, interview prep, follow-up drafting, skill extraction) is
designed but on hold pending a model/provider decision.

## Getting started (local setup, step by step)

This section assumes a completely fresh machine — pick your path below.

### What you need installed first

- **Git** — to clone the repo.
- **Node.js 20+** — for the frontend. Check with `node -v`.
- **Docker Desktop** — the easiest way to run the backend + database without
  installing Java or Postgres yourself. This is the recommended path below.
- *(Only needed if you skip Docker for the backend)* **JDK 21+** — e.g.
  [Eclipse Temurin](https://adoptium.net/) — and a local **PostgreSQL**
  install.

### 1. Clone the repo

```bash
git clone https://github.com/caleb-j-kim/applyiq.git
cd applyiq
```

### 2. Set up environment variables

There's a `.env.example` at the repo root — copy it to `.env` and adjust
values if you want (the defaults work out of the box for local dev):

```bash
cp .env.example .env
```

This one `.env` file supplies both the database credentials and the
backend's config (JWT secret, ports) when running via Docker Compose. If
you're running the backend directly with Maven instead (see Path B below),
it reads its own copy at `backend/.env.example`.

### 3A. Path A — Docker for backend + database (recommended)

This starts Postgres and the Spring Boot API together, in containers, with
no local Java or Postgres install required.

```bash
docker-compose up -d --build
```

> **Important:** use the standalone `docker-compose` command (with a
> hyphen), not `docker compose` — this project's Docker CLI setup doesn't
> have the `compose` subcommand plugin registered, only the separate
> `docker-compose` binary. If you get a "command not found" for
> `docker-compose`, make sure Docker Desktop is fully started first.

Wait a few seconds for both containers to report healthy/started, then check:

```bash
docker-compose ps            # should show db and backend both "running"/"healthy"
docker-compose logs -f backend   # tail logs; look for "Started ApplyiqBackendApplication"
```

The backend API is now live at `http://localhost:8080`. See
`backend/README.md` for the full endpoint list.

**If you change backend code**, re-run the build command to pick it up —
just `docker-compose up -d` (without `--build`) will **not** rebuild the
image:

```bash
docker-compose up -d --build backend
```

### 3B. Path B — run the backend directly (no Docker)

Only do this if you'd rather not use Docker. Requires JDK 21+ and a running
local Postgres matching the credentials in `backend/.env.example`.

```bash
cd backend
cp .env.example .env
./mvnw spring-boot:run
```

The API starts at `http://localhost:8080`, same as Path A.

### 4. Start the frontend (either path)

In a separate terminal, from the repo root:

```bash
cd frontend
npm install
npm run dev
```

This starts the Vite dev server, printing a local URL (typically
`http://localhost:5173`) — open that in your browser.

### 5. You're running locally

- Frontend: `http://localhost:5173` (or whatever port Vite printed)
- Backend API: `http://localhost:8080/api/...`
- Postgres (if you want to inspect it directly): `localhost:5432`, credentials
  from `.env` (default `applyiq` / `applyiq`)

Remember: the frontend isn't wired up to the backend yet, so the UI you see
is still driven by mock data — hitting the backend directly (via curl,
Postman, etc.) is currently the way to exercise the real API.

### Testing the API — demo account + Postman collection

A fixed demo account (`demo@applyiq.com` / `demo1234`) is seeded
automatically the first time the backend starts (controlled by
`DEMO_SEED_ENABLED` in `.env`, on by default — set it to `false` before any
real deployment). No manual registration needed.

Import `ApplyIQ.postman_collection.json` (repo root) into Postman or
Insomnia, then run the **Login (Demo)** request first — it saves the JWT
into a collection variable automatically, and every other request in the
collection (applications, resumes, dashboard, notifications) reuses it via
collection-level Bearer auth. No copying tokens by hand. A few requests
(create application, upload resume, create notification) also auto-save the
returned ID into a variable so the follow-up requests (get one, update,
delete, etc.) work without editing the URL.

### Stopping everything

```bash
docker-compose down       # stops db + backend containers, keeps your data
docker-compose down -v    # also deletes the Postgres data volume — start fresh
```
Stop the frontend dev server with `Ctrl+C` in its terminal.

### Common issues

| Problem | Fix |
|---|---|
| `docker-compose: command not found` | Docker Desktop isn't running, or isn't fully started yet — open it and wait for the whale icon to stop animating. |
| Backend container starts then immediately exits, or can't reach the DB | Check `docker-compose logs backend` — usually means Postgres wasn't healthy yet when the backend tried to connect, or `.env` values don't match. Re-run `docker-compose up -d --build`. |
| Backend code changes don't show up | You forgot `--build` — plain `docker-compose up -d` reuses the existing image. |
| Port `8080`, `5432`, or `5173` already in use | Something else on your machine is using it. Override via `.env` (`SERVER_PORT`, `DB_PORT`) for the backend/DB, or pass `--port` to `npm run dev` for the frontend. |
| `./mvnw` fails with a Java version error (Path B only) | You need JDK 21+ specifically — check `java -version` and update `JAVA_HOME` if an older JDK is active. |

See `frontend/README.md`, `backend/README.md`, and `database/README.md` for
stack details, full endpoint lists, and schema documentation.

## Note on Python

The app itself has no Python — it's all TypeScript/React. The `.windsurf/skills/`
directory contains Python scripts used by Windsurf's agent tooling (design/slide/
branding helper skills), which is why GitHub's language stats show Python usage.
