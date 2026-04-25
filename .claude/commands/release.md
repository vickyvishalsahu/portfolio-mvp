---
description: Run the release script to merge dev into main with tagging
---

# /release - Release to main

Run the project's release script to merge `dev` into `main`, create a tag, and optionally create a GitHub release.

## Instructions

When this command is run:

### Phase 1: Pre-flight checks

1. Run `git status` to check for uncommitted changes
2. If there are uncommitted changes, **stop** and tell the user to commit first
3. Check the current branch is `dev` — if not, warn the user

### Phase 2: Push local commits

1. Check if `dev` is ahead of `origin/dev`
2. If yes, ask the user: "You have unpushed commits on dev. Push now before releasing?"
3. If confirmed, run `git push origin dev`

### Phase 3: Run the release

This is an **interactive script** — it will prompt for confirmations. Tell the user to run it themselves:

> Run `! ./release` in the prompt to start the release process.
> For a dry run first: `! ./release --dry-run`

### Options reminder

| Flag | What it does |
|------|-------------|
| `--dry-run` | Simulate without making changes |
| `--force` | Allow releasing when local is ahead of origin |
| `--help` | Show all options |

## Arguments

- `/release` — Start the release flow
- `/release --dry-run` — Suggest a dry run
