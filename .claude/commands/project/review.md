Perform a comprehensive code review of the current changes.

1. Run `git diff --name-only main...HEAD` to identify changed files
2. Delegate to `reviewer` agent for pattern compliance and build verification
3. If any auth, secrets, media handling, or security-sensitive files changed, also delegate to `security-auditor`
4. If new code lacks tests, delegate to `test-engineer` to assess coverage gaps
5. Compile a final review summary with all findings
