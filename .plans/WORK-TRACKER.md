# Meta Skill Work Tracker

Use this file to choose and sequence Meta Skill work. Use `Active`, `Later`,
and one-line `Done`; keep implementation detail in linked Plans.

## Active

No active Meta Skill implementation plan.

## Later

### lane-hygiene-pass

- Outcome: Remove shipped draft markers, stale maintainer docs, TODOs, and CLI/doc drift that mislead agents.
- Plan: `meta-skill/lane-hygiene-pass.md`
- Trigger: Promote when the active baseline-impact work is not in flight, or when stale shipped guidance blocks nearby edits.

### seed-lane-evals

- Outcome: Add dogfood eval suites for Meta Skill routing and skill-writer interview behavior.
- Plan: `meta-skill/seed-lane-evals.md`
- Trigger: Promote after baseline reporting can explain run evidence clearly.

### eval-generate-draft-scaffolds

- Outcome: Generate deterministic, clearly labeled starter eval cases for new skill projects.
- Plan: `meta-skill/eval-generate-draft-scaffolds.md`
- Trigger: Promote after seed evals clarify the minimum useful suite shape.

### package-readiness-check

- Outcome: Add read-only package readiness gates over validation, review, eval, and package evidence.
- Plan: `meta-skill/package-readiness-check.md`
- Trigger: Promote after report and baseline evidence are stable enough to gate on.

### skill-autoresearch-v1-lane

- Outcome: Add a guidance-only lane that proposes gated skill-improvement attempts without applying them.
- Plan: `meta-skill/skill-autoresearch-v1-lane.md`
- Trigger: Promote after baseline impact, seed evals, and readiness checks exist.

### deepen-skill-doctor-review

- Outcome: Improve skill-doctor's scored Quality page and findings without fabricating judge evidence.
- Plan: needed
- Trigger: Promote when review quality blocks downstream improve/readiness decisions.

### connect-review-to-evidence-backed-improve

- Outcome: Chain review findings to scoped edit proposals, relevant validation, and human approval.
- Plan: needed
- Trigger: Promote after review artifacts are reliable enough to drive edits.

### skillify-session-mining

- Outcome: Read Codex session JSONL and produce deterministic Skillify Briefs or seed evals.
- Plan: needed
- Trigger: Promote only after draft eval generation and reporting are stable.

## Done

- `baseline-impact-comparison` - no-skill candidate staging, explicit grader declarations, expectation-aware model grading, gate failures, and per-case impact categories shipped.
- `eval-report-command` - read-only `eval list` / `eval report` rendering shipped.
- `evaluator-methodology-references` - baseline/current/candidate methodology and evaluation guidance landed.
