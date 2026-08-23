# Module ownership boundaries

Purpose: when multiple agents (or humans) work on this repo at the same
time, each should be able to tell at a glance which files are "theirs" for
a given task, to avoid two agents editing the same file in parallel and
producing merge conflicts or contradictory changes.

This is a convention, not an enforcement mechanism — there's no tooling
that blocks a cross-boundary edit. Treat it as the default assignment when
splitting work across sessions/worktrees, and call out explicitly (in the
task description or a commit message) any time a change has to cross a
boundary.

## Top-level boundaries

| Area | Path | Owns |
|---|---|---|
| Frontend | `frontend/` | React app, UI components, client-side routing, mock data |
| Backend | `backend/` | Spring Boot API, all Java code, persistence |
| Database | `database/` | Schema docs only (schema itself is generated from backend entities — see below) |
| Infra | `docker-compose.yml`, `backend/Dockerfile`, `.env.example`, `backend/.env.example` | Local dev environment wiring |
| Cross-cutting docs | `docs/`, root `README.md`, `CLAUDE.md` | Repo-wide conventions and workflow |

**Note:** there's no separate migration-file directory — Hibernate
generates the schema from backend entity classes. A change to a JPA entity
in `backend/src/main/java/com/applyiq/**` *is* a database schema change.
An agent editing entities should update `database/README.md` if the schema
documentation goes stale as a result, even though that crosses the
frontend/backend/database split above.

## Backend sub-module boundaries

Inside `backend/src/main/java/com/applyiq/`, each domain has its own
package and should be treated as its own ownership unit for parallel work:

- `auth/` — login, JWT issuance/validation, security config
- `users/` — user accounts/profile
- `applications/` — job application CRUD
- `resumes/` — resume upload/download/active-resume tracking
- `dashboard/` — aggregation endpoint(s) that read across other modules
- `notifications/` — notification CRUD
- `demo/` — demo account seeding
- `common/` — genuinely shared code (exceptions, base config). Adding to
  `common/` should be rare — prefer keeping logic in its owning module.

`dashboard/` is the one module that legitimately reads across others
(it aggregates data from `applications`, `resumes`, `notifications`); if
two agents are touching `dashboard/` and one of the modules it reads from
in the same work session, coordinate rather than assuming isolation.

## Frontend sub-module boundaries

Inside `frontend/src/`:

- `pages/` — one file per route/screen. Naturally parallelizable: two
  agents working on two different pages rarely conflict.
- `components/ui/` — low-level shadcn-style primitives (button, dialog,
  etc.). Changes here ripple across many pages — treat as higher-risk,
  coordinate before editing.
- `components/app/`, `components/layout/`, `components/sections/` —
  mid-level shared components. Same caution as `ui/`, smaller blast radius.
- `context/` — React context providers (e.g. auth). Cross-cutting, same
  caution as `ui/`.
- `lib/` — client-side utilities, API client, mappers. Shared; check for
  conflicts before large edits.
- `data/mock-data.ts` — the shared mock dataset. Since the app currently
  runs entirely on this file, treat additive changes (new mock records) as
  low-risk and structural changes (shape/type changes) as needing
  coordination, since they can break every page at once.
- `types/` — shared TypeScript types. Same caution as `ui/`.

## The AI module

`backend`'s `ai` package (resume match scoring, interview prep,
follow-up drafting, skill extraction) is designed but on hold pending a
model/provider decision. Don't start implementing it without checking with
the user first — it's explicitly not "pick up and build" work.

## What to do when a task doesn't fit one box

If a task genuinely spans boundaries (e.g. "wire the frontend to the real
backend API" touches both `frontend/src/lib/api-client.ts` and multiple
backend controllers), that's fine for a single agent doing sequential work
in one session. For *parallel* multi-agent work, split it: one agent
finishes and stabilizes the backend contract first, then hand off (or run
sequentially in the same worktree) rather than having two agents edit both
sides simultaneously.
