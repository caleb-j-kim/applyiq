# Handoff for Codex

This is a standalone briefing for an OpenAI Codex session (or any other
agent) picking up implementation work on ApplyIQ. It assumes zero prior
context — read this before touching anything.

**Division of labor:** Claude (Claude Code sessions on this repo) does
repo audits, project management, and final review of incoming work.
Codex does implementation. Practically: Codex opens PRs against `develop`
per the workflow below; a Claude session reviews them (correctness,
security, adherence to `docs/AGENT_OWNERSHIP.md`), requests changes or
approves/merges. Don't merge your own PRs into `develop` without that
review having happened, and never merge directly into `main`/`master`.

## What ApplyIQ is

An AI-powered job application assistant.

```
frontend/   React 19 + TypeScript + Vite app        (see frontend/README.md)
backend/    Java 21 + Spring Boot 4 REST API         (see backend/README.md)
database/   Schema documentation (Hibernate-generated, no migration files)
docs/       Cross-cutting docs (this file, ownership, workflow, roadmap)
```

**Current state:** the frontend runs entirely on mock data
(`frontend/src/data/mock-data.ts`) — it is **not** wired up to the
backend yet. The backend implements auth, application CRUD, resumes,
dashboard aggregation, and notifications, and is otherwise working
(tested against a real Postgres instance as of this handoff). The `ai`
module (resume match scoring, interview prep, follow-up drafting, skill
extraction) is designed but **on hold pending a model/provider decision
— do not start implementing it.**

Read `CLAUDE.md` at the repo root next — it has the full command
reference (build/test/lint for both frontend and backend) and coding
conventions. Then `docs/AGENT_OWNERSHIP.md` for which files/modules a
given task should stay inside.

## Branch & PR workflow

- **Base your work off `develop`**, not `main`/`master`. `main`/`master`
  are the stable branches; `develop` is the integration branch for
  in-progress work. Full detail: `docs/MULTI_AGENT_WORKFLOW.md`.
- **Branch naming:** `<area>/develop-<short-slug>`, e.g.
  `frontend/develop-api-wiring`, `backend/develop-openapi-docs`. The
  `/develop-` segment is required — it's how work-in-progress branches
  are identified across this repo.
- **Before starting:** check `docs/IMPROVEMENTS_PLAN.md` and this file's
  task list for what's already planned/claimed, so two agents don't
  duplicate work. If you start something not listed here, add it to
  `docs/IMPROVEMENTS_PLAN.md` so it's tracked.
- **CI must be green** (`.github/workflows/ci.yml` — frontend lint+build,
  backend test+build against a real Postgres service) before a PR is
  considered done. Run the equivalent commands locally first:
  ```
  cd frontend && npm run lint && npm run build
  cd backend && ./mvnw verify
  ```
- **Open the PR against `develop`**, with a description of what changed
  and why. A Claude session will review it — expect review comments,
  respond to them on the PR rather than force-pushing over the
  conversation.
- **Never** commit secrets, hardcode credentials, or widen
  `DEMO_SEED_ENABLED`'s default to `true` in a way that could ship (see
  `CLAUDE.md` conventions) — these were exactly the class of issue the
  last audit pass fixed; don't reintroduce them.

## Master task list

Prioritized, pulled from `docs/IMPROVEMENTS_PLAN.md` — that doc is the
source of truth if the two drift; update both when a task's status
changes.

### 1. Wire the frontend to the real backend API (flagship task)

The biggest, highest-value piece of work available right now. The
backend already has working endpoints for auth, applications, resumes,
dashboard, and notifications (see `backend/README.md` for the full list).
The frontend has a typed API client stub (`frontend/src/lib/api-client.ts`)
and mapper utilities (`frontend/src/lib/mappers.ts`) already scaffolded,
but every page currently reads from `frontend/src/data/mock-data.ts`
instead.

Suggested approach:
- Do this as its own branch/PR, not mixed with unrelated changes — it
  touches many files and is easiest to review as one coherent change.
  It's fine to split into a few sequential PRs by feature area (e.g. auth
  first, then applications CRUD, then dashboard, then resumes,
  notifications) if that's easier to review — just say so in each PR
  description so the reviewer knows more is coming.
  - Confirm auth flow end-to-end first (login/register/JWT storage) since
    everything else depends on it.
  - Then applications CRUD (`pages/applications-page.tsx`), dashboard
    (`pages/dashboard-page.tsx`), resumes
    (`pages/uploaded-resumes-page.tsx`), notifications.
  - `pages/profile-page.tsx` and `pages/settings-page.tsx` currently only
    update local state (no persistence) — wire these up too as part of
    this effort; see `docs/IMPROVEMENTS_PLAN.md`'s "Settings/profile
    persistence" note.
- Keep `mock-data.ts` in place until the wiring is confirmed working
  end-to-end (useful for local dev fallback / diffing behavior); remove
  or clearly mark it dead once real data flows are verified.
- Test against the Docker Compose stack (`docker-compose up -d --build`
  from repo root) — see root `README.md` for the full local setup.

### 2. Test coverage

- Backend: unit tests for `DashboardService` (pure aggregation logic,
  easy to test in isolation) and auth flow integration tests
  (register/login/JWT validation, using the CI's Postgres service).
- Frontend: once task 1 is underway, integration tests for the auth flow
  and the applications CRUD forms are the highest-value starting point.

### 3. Frontend bundle size / code-splitting

`npm run build` emits a single ~2.57MB JS chunk (Vite warns about this).
`frontend/src/components/ui/hero-futuristic.tsx` (the three.js/WebGPU
homepage hero) is the likely largest contributor and is only needed on
the marketing homepage — split it out with `React.lazy`/dynamic
`import()` so app-shell routes don't load it.

### 4. Smaller/medium items

See `docs/IMPROVEMENTS_PLAN.md`'s "Medium priority" and "Low
priority" sections for: backend password policy, API documentation
(springdoc-openapi), the `App.tsx` hash-routing cleanup, and formatter/
pre-commit hook setup. Pick these up opportunistically between the
larger tasks above, each as its own small PR.

## Explicitly out of scope

- The `ai` module — on hold, don't implement.
- Renaming/removing `main` vs `master` — that distinction is intentional,
  see `docs/MULTI_AGENT_WORKFLOW.md`.
- Anything touching the top-level `/src` directory (outside `frontend/`)
  — it's not part of the active app, leave it alone.
