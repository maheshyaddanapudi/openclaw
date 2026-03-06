---
name: generate-changelog
description: |
  Generate structured changelog from git history. Use when user says:
  "changelog", "release notes", "what changed", "generate changelog",
  "update changelog", "write release notes", "what's new"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Generate Changelog

Generate or update CHANGELOG.md following project conventions.

## Steps

1. Determine the range:
   ```bash
   # From last tag to HEAD
   LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
   if [ -n "$LAST_TAG" ]; then
     RANGE="$LAST_TAG..HEAD"
   else
     RANGE="HEAD~20..HEAD"
   fi
   git log --oneline "$RANGE" --no-merges
   ```

2. Classify each commit:
   - `feat(*)` → `### Changes`
   - `fix(*)` → `### Fixes`
   - Skip: `chore`, `ci`, `docs` (internal), test-only changes

3. Read existing CHANGELOG.md format:
   ```bash
   head -30 CHANGELOG.md
   ```

4. Follow project conventions:
   - **User-facing changes only** — no internal/meta notes
   - Keep `### Changes` section first, then `### Fixes`
   - Within each section, rank by impact (user-facing fixes first)
   - **Append** new entries to the END of each section (not the top)
   - Deduplicate entries in `### Fixes`

5. Update CHANGELOG.md in the active version block.

## Do NOT Include

- Version alignment notes
- Appcast reminders
- Release process notes
- Pure test additions/fixes (unless they change user-facing behavior)
