Create a complete implementation for: $ARGUMENTS

Read `.claude/workflow-config.yml` for workflow preferences.

Follow this workflow:
1. Delegate to `planner` agent to analyze the request and produce an implementation plan
2. Review the plan, then delegate to `implementer` agent (and specialists if needed) to write production code
3. Delegate to `test-engineer` agent to write tests for the new code
4. Delegate to `reviewer` agent for code review — reviewer will produce a structured verdict

5. **Post-review decision gate:**
   - If verdict is APPROVE → proceed to step 7
   - If verdict is REQUEST_CHANGES and `human_in_loop_at_handoff` is `true` → present findings and ask user whether to remediate
   - If verdict is REQUEST_CHANGES and `human_in_loop_at_handoff` is `false` → delegate the reviewer's critical findings (with fix instructions) back to `implementer` for remediation, then re-delegate to `reviewer`
   - Maximum remediation cycles: `max_review_remediate_cycles` from workflow-config.yml (default: 2). If critical issues persist after max cycles, stop and report: "Remediation attempted N times but these issues remain: [list]. Human review required."

6. If reviewer flagged security concerns, delegate to `security-auditor`
7. Summarize all changes, test results, review findings, and remediation history (if any cycles occurred)
