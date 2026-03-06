---
name: create-pr
description: |
  Create a GitHub pull request with auto-populated content. Use when user says:
  "create PR", "open pull request", "submit PR", "ship it", "open PR",
  "make a pull request", "send PR"
allowed-tools:
  - Bash
  - Read
  - Glob
---

# Create Pull Request

Create a well-formatted GitHub PR using the project's template.

## Prerequisites

- `gh` CLI must be installed and authenticated
- Changes must be committed and pushed to a branch

## Steps

1. Verify prerequisites:
   ```bash
   gh auth status
   git status  # should be clean
   ```

2. Gather context:
   ```bash
   BRANCH=$(git branch --show-current)
   git log --oneline main...HEAD
   git diff --stat main...HEAD
   ```

3. Read the PR template:
   ```bash
   cat .github/pull_request_template.md
   ```

4. Push if not already pushed:
   ```bash
   git push -u origin "$BRANCH"
   ```

5. Create the PR using the template structure:
   ```bash
   gh pr create --title "type(scope): concise description" --body "$(cat <<'EOF'
   ## Summary
   - What changed and why

   ## Test Plan
   - [ ] Tests pass: `pnpm test:fast`
   - [ ] Build passes: `pnpm build`
   - [ ] Lint passes: `pnpm check`
   EOF
   )"
   ```

6. Report the PR URL.

## Title Convention

Follow Conventional Commits: `fix(telegram): handle network retry`, `feat(gateway): add readiness probes`

## Notes

- Extract GitHub issue numbers from branch name or commits (e.g., `#38267`)
- Include `Closes #NNNNN` in the body if fixing an issue
- For AI-assisted PRs, mark as AI-assisted per CONTRIBUTING.md
