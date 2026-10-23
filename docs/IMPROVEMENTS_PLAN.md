# Improvements plan / roadmap

A living backlog of concrete, scoped improvements beyond the immediate bug
audit (see git history around the "Audit fixes, graphify skill, and
multi-agent repo organization" commit for that pass). Grouped by area,
each item has a rough priority. This feeds `docs/CODEX_HANDOFF.md` — pull
items from here into that task list as they're picked up, and check them
off / remove them here once done so the two docs don't drift.

Out of scope for all of the below: the `ai` module (resume match scoring,
interview prep, follow-up drafting, skill extraction). It's designed but
on hold pending a model/provider decision — don't start implementing it
without checking with the user first.

## High priority

- **Wire the frontend to the real backend API.** The frontend currently
  runs entirely on `frontend/src/data/mock-data.ts`; the backend already
  implements auth, application CRUD, resumes, dashboard, and
  notifications. This is the single highest-value next milestone — it's
  explicitly called out in `CLAUDE.md` as "a deliberate, separate
  integration effort," meaning it's expected to be done as its own
  focused piece of work, not a side effect of something else. Touches
  `frontend/src/lib/api-client.ts`, `frontend/src/lib/mappers.ts`, and
  every page currently reading from `mock-data.ts`.
- **Add test coverage.** Frontend has zero tests; backend has exactly one
  smoke test (`ApplyiqBackendApplicationTests.contextLoads`). Highest-value
  first targets: backend auth flow (register/login/JWT validation),
  `DashboardService` aggregation logic (pure functions, easy to unit
  test, and already had one near-miss bug caught by manual review — see
  audit notes), and resume upload validation. On the frontend, once it's
  wired to the real API, component/integration tests for the auth flow
  and application CRUD forms are the highest-value starting point.
- **Frontend bundle size / code-splitting.** `npm run build` currently
  emits a single ~2.57MB JS chunk (728KB gzipped) with a Vite warning
  about it. The three.js/WebGPU hero effect
  (`components/ui/hero-futuristic.tsx`) is almost certainly the largest
  contributor and is only needed on the marketing homepage — a prime
  candidate for `React.lazy`/dynamic `import()` so app-shell routes
  (`pages/dashboard-page.tsx` etc.) don't pay for it.

## Medium priority

- **Backend password policy.** Registration only requires 8+ characters
  (`RegisterRequest`), no complexity check. Fine for now but worth
  revisiting before any real user base — likely just a stronger
  `@Pattern`/custom validator, not a big change.
- **Dashboard aggregation performance.** `DashboardService.getSummary`
  loads every application for a user and recomputes all stats via Java
  streams on every request — fine at current scale, but there's no
  caching layer and no pagination on the underlying list call. Worth a
  look once there's real usage data; likely a non-issue until then.
- **API documentation.** Only a Postman collection
  (`ApplyIQ.postman_collection.json`) documents the API today. Adding
  springdoc-openapi (Swagger UI) to the backend would give an
  always-in-sync, browsable API doc and make backend work easier to hand
  off to another agent/developer without them reading controller code.
- **`App.tsx` routing.** Uses a `location.hash === '#features'` check
  inside render to conditionally show `FeaturesPage`, alongside normal
  `react-router` routes. Works today but is unconventional — worth
  migrating to a real route (`/features`) or a documented reason it can't
  be, next time someone is in that file for an unrelated reason.
- **Formatter / pre-commit hooks.** Neither the frontend (no Prettier
  config) nor backend (no Spotless/Checkstyle in `pom.xml`) enforce a
  consistent format automatically. Low effort, meaningfully reduces
  review noise once more agents/contributors are touching the code
  regularly (see the multi-agent workflow docs).

## Low priority / longer-term

- **Database migrations.** The project intentionally has no migration
  files — Hibernate's `ddl-auto: update` generates schema from entities
  (documented, working as intended for the current stage). Worth
  reconsidering (Flyway/Liquibase) once the schema is closer to stable
  and multiple environments need controlled, reviewable migrations
  rather than auto-generated ones.
- **Settings/profile persistence.** `SettingsPage` and `ProfilePage` edits
  are local-only (no backend call) — expected right now since the app
  isn't wired to the backend yet (see "Wire the frontend" above), but
  once that lands, these two pages need real persistence too. Tracked
  separately here since they're easy to miss (they don't look broken,
  they just don't save anywhere real).
- **CI cache tuning / matrix.** Current `.github/workflows/ci.yml` is a
  minimal two-job (frontend, backend) gate. Fine for now; revisit if
  build times become a problem as the codebase grows.

## How to use this doc

- Pick an item, move/copy it into `docs/CODEX_HANDOFF.md`'s task list (or
  wherever active work is being tracked) when someone starts it.
- Add new items here as they're discovered — during audits, code review,
  or just working in the codebase. Keep entries concrete (file paths,
  specific symptoms) rather than generic ("improve performance").
- Re-prioritize freely; these priorities are a starting point, not a
  contract.
