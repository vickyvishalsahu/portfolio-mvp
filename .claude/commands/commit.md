---
description: Commit staged and unstaged changes with a conventional commit message
disable-model-invocation: true
---

# /commit - Smart Conventional Commit

Analyze all current changes and create a well-crafted conventional commit.

## Instructions

When this command is run:

### Phase 0: Branch Guard

1. Run `git branch --show-current` to check the current branch
2. If the current branch is `main`:
   - **STOP** — do not commit
   - Warn the user: "You're on `main`. All work should be committed to `dev`. Switch with `git checkout dev` first."
   - Do not proceed to Phase 1

### Phase 1: Analyze Changes

1. **Gather context** (run in parallel):
   - `git status` to see all changed, staged, and untracked files
   - `git diff` to see unstaged changes
   - `git diff --cached` to see staged changes
   - `git log --oneline -10` to see recent commit style

2. **Identify relevant files**:
   - Determine which changed files should be committed
   - Exclude files that likely contain secrets (`.env`, `credentials.json`, etc.)
   - Flag any suspicious files and ask the user before including them

### Phase 2: Determine Commit Type

Analyze the nature of the changes to pick the correct type:

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability added |
| `fix` | Bug fix |
| `ref` | Code restructuring with no behavior change |
| `test` | Adding or updating tests only |
| `docs` | Documentation changes only |
| `chore` | Maintenance, dependencies, config |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |

Rules:
- If changes span multiple types, use the **primary** type (the most impactful change)
- If tests accompany a feature, use `feat` (not `test`)
- If tests accompany a fix, use `fix` (not `test`)
- Use `ref` instead of `refactor` (project convention)

### Phase 3: Craft Commit Message

Write a concise, descriptive message:
- **Subject line**: `<type>: <imperative description>` (max 72 chars)
- **Body** (optional, for complex changes): explain *why*, not *what*
- Use imperative mood: "add sorting" not "added sorting"
- Be specific: "add sort by date to property list" not "update code"
- **NEVER mention Claude, AI, Anthropic, or any AI assistant**
- **NEVER add Co-Authored-By or any trailer referencing Claude/Anthropic**

### Phase 4: Stage and Commit

1. Stage the relevant files by name (prefer specific files over `git add .`)
2. Create the commit using a HEREDOC for proper formatting:
   ```bash
   git commit -m "$(cat <<'EOF'
   <type>: <description>

   <optional body>
   EOF
   )"
   ```
3. Run `git status` after commit to verify success
4. Show the commit hash and message to the user

### Phase 5: Handle Failures

- If pre-commit hook fails (lint errors), fix the issues and create a **new** commit (never amend)
- If there are no changes to commit, inform the user
- If hook modifies files, re-stage and commit again

## Examples

Single-type change:
```
feat: add energy efficiency badge to property card
```

Multi-file change with body:
```
feat: add bulk selection to property list

Add checkbox column and bulk action toolbar with
delete and export actions to the property table.
```

Refactor:
```
ref: extract validation logic into shared utils
```

## Related Commands

- `/verify` - Run checks before committing
- `/submit-pr` - After committing, submit a PR

## Arguments

- `/commit` - Analyze changes and commit with auto-generated message
- `/commit <message>` - Use the provided message directly (still validates type prefix)
