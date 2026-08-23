# Multi-agent / multi-session workflow

How to run several Claude Code sessions (or other agents) against this repo
at the same time without them stepping on each other.

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
# one worktree per parallel task, each on its own branch
git worktree add ../applyiq-frontend-x   -b agent/frontend-x
git worktree add ../applyiq-backend-y    -b agent/backend-y
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
   `agent/<area>-<short-task>` (e.g. `agent/backend-jwt-refresh`,
   `agent/frontend-dashboard-cards`).
3. If two tasks genuinely need to touch the same file (e.g. both need a
   change to `frontend/src/types/index.ts`), don't run them in parallel
   worktrees — do them sequentially in one worktree, or have one agent
   finish and merge first.

## Landing the work

- Each agent commits on its own branch inside its own worktree as normal.
- Merge/rebase onto the shared base (`main`, or whatever branch the task
  was forked from) the same way you would with any feature branch — via PR,
  or a local merge if working solo. Do this from the *original* checkout or
  any worktree; worktrees share the same underlying repo so all branches
  are visible from any of them.
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
