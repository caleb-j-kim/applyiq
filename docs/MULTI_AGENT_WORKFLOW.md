# Multi-agent / multi-session workflow

How to run several Claude Code sessions (or other agents) against this repo
at the same time without them stepping on each other.

## Branch strategy

- **`main`** — GitHub's default branch. PRs target this. Always
  deployable/working.
- **`master`** — kept in sync with `main`; exists as an explicit "this is
  the stable branch" pointer for tooling/agents that expect that name.
  Don't develop directly on it — it moves when `main` moves.
- **`develop`** — the integration branch. All in-progress multi-agent /
  multi-session work branches from here, not from `main`/`master`
  directly. Periodically merge `develop` into `main` (via PR, CI green)
  once it's in a good state.
- **Work branches** — cut from `develop`, named `<area>/develop-<slug>`
  (e.g. `backend/develop-jwt-refresh`, `frontend/develop-dashboard-cards`,
  `infra/develop-ci-cache`). The `/develop-` segment makes any
  in-progress branch identifiable at a glance, and groups it with the
  branch it's meant to merge back into.
- **Exception:** branches a hosting platform assigns automatically (e.g.
  Claude Code on the web's `claude/new-session-*` sessions) keep their
  platform-assigned name — don't rename those, just treat them as
  work branches conceptually.

```
main / master (stable)
  ^
  |  PR, CI green
  |
develop (integration)
  ^
  |  PR, CI green
  |
backend/develop-jwt-refresh, frontend/develop-dashboard-cards, ... (work branches)
```

## Why worktrees

A single git checkout has one working directory — two agents editing files
in it simultaneously will clobber each other's uncommitted changes, even if
they're touching different files, because things like `git status`,
`git add`, and the checked-out branch are shared state. `git worktree` gives
each agent its own working directory and its own branch, backed by the same
`.git` object store, so they can run fully in parallel with no shared
mutable state and no need to `git clone` the repo N times.

## Setting up a worktree per agent

From the main checkout:

```bash
# one worktree per parallel task, each on its own branch off develop
git fetch origin develop
git worktree add ../applyiq-frontend-x   -b frontend/develop-x origin/develop
git worktree add ../applyiq-backend-y    -b backend/develop-y  origin/develop
```

Each directory is a full, independent working copy. Point each agent/session
at its own worktree directory as its working directory. Delete a worktree
when its task is done and merged:

```bash
git worktree remove ../applyiq-frontend-x
```

(`git worktree list` shows what's currently checked out.)

## Splitting the work

1. Before creating worktrees, split the task along the boundaries in
   `docs/AGENT_OWNERSHIP.md` — each worktree/agent should own a
   non-overlapping set of files for the duration of its task.
2. Name branches so their ownership is obvious at a glance:
   `<area>/develop-<short-task>` (e.g. `backend/develop-jwt-refresh`,
   `frontend/develop-dashboard-cards`) — see "Branch strategy" above.
3. If two tasks genuinely need to touch the same file (e.g. both need a
   change to `frontend/src/types/index.ts`), don't run them in parallel
   worktrees — do them sequentially in one worktree, or have one agent
   finish and merge first.

## Landing the work

- Each agent commits on its own branch inside its own worktree as normal.
- Merge/rebase onto `develop` (not `main`/`master` directly) the same way
  you would with any feature branch — via PR, or a local merge if working
  solo. Do this from the *original* checkout or any worktree; worktrees
  share the same underlying repo so all branches are visible from any of
  them. `develop` itself gets merged into `main`/`master` separately, once
  it's in a stable, working state.
- Resolve conflicts the normal git way. If ownership boundaries were
  respected, conflicts should be rare and limited to shared files called
  out in `docs/AGENT_OWNERSHIP.md` (e.g. `types/index.ts`,
  `components/ui/*`).
- CI (`.github/workflows/ci.yml`) runs on every PR — don't merge a branch
  with red CI regardless of how the work was split.

## What this doesn't cover

This is a manual convention for coordinating git state across parallel
agents, not a locking system — nothing stops two agents from editing the
same file if the split above isn't followed. For fully autonomous
multi-agent orchestration (spawning/monitoring sub-agents from within a
single session, rather than separate human-launched sessions), use the
Agent tool's background-agent mechanism instead of worktrees — that's for
parallel *tasks* within one session, this doc is for parallel *sessions*.
