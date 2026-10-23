# CLAUDE.md

Instructions for Claude Code (and other agents) working in this repo. Read
this before making changes — it's the fastest way to get oriented, and it's
kept short on purpose. Deeper detail lives in the linked docs.

## What this is

ApplyIQ — an AI-powered job application assistant.

```
frontend/   React 19 + TypeScript + Vite app        (see frontend/README.md)
backend/    Java 21 + Spring Boot 4 REST API         (see backend/README.md)
database/   Schema documentation (Hibernate-generated, no migration files)
docs/       Cross-cutting docs (ownership boundaries, multi-agent workflow)
```

Current state: the frontend runs entirely on mock data
(`frontend/src/data/mock-data.ts`) and is **not wired up to the backend
yet**. The backend implements auth, application CRUD, resumes, dashboard
aggregation, and notifications. The `ai` module (resume match scoring,
interview prep, follow-up drafting, skill extraction) is designed but on
hold pending a model/provider decision — don't build against it as if it's
live.

There is also a top-level `src/` directory (outside `frontend/`) that is
**not** part of the active app — leave it alone unless a task specifically
calls it out.

## Commands

**Frontend** (from `frontend/`):
```
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # oxlint
```
No test suite exists yet for the frontend.

**Backend** (from `backend/`):
```
./mvnw spring-boot:run   # http://localhost:8080
./mvnw test               # runs backend/src/test
./mvnw verify
```

**Everything via Docker** (from repo root): `docker-compose up -d --build`.
See the root `README.md` for the full local setup walkthrough — it's
written for a fresh machine and is the source of truth for setup steps.

## Conventions

- Frontend: functional components, hooks, Tailwind for styling, shadcn-style
  UI primitives under `frontend/src/components/ui/`. Keep page components in
  `frontend/src/pages/`, cross-page layout in `frontend/src/components/layout/`.
- Backend: one package per domain module under `com.applyiq`
  (`auth`, `users`, `applications`, `resumes`, `dashboard`, `notifications`,
  `demo`, `common`). Keep new code inside the matching module rather than in
  `common` unless it's genuinely shared.
- Don't wire the frontend to real backend calls as a side effect of an
  unrelated task — that's a deliberate, separate integration effort.
- The demo account seeding (`DEMO_SEED_ENABLED`) must stay opt-out-able via
  env var; never hardcode it on for a change that could ship.

## Multi-agent / multi-session work

Multiple Claude sessions (or agents in parallel worktrees) may work on this
repo at once. Before starting a task:

1. Read `docs/AGENT_OWNERSHIP.md` for which module/directory you're expected
   to stay inside, so parallel sessions don't collide on the same files.
2. If you're running as a separate parallel agent (not just a single
   session doing sequential work), read `docs/MULTI_AGENT_WORKFLOW.md` for
   the git worktree + branching pattern to use, including the branch
   strategy (`main`/`master` stable, `develop` integration, work branches
   named `<area>/develop-<slug>`).
3. CI (`.github/workflows/ci.yml`) runs frontend lint+build and backend
   test+build on every PR — keep changes green before handing off.
4. `docs/CODEX_HANDOFF.md` and `docs/IMPROVEMENTS_PLAN.md` track
   in-progress and planned work — check there before starting something
   new so you don't duplicate another agent's task.
