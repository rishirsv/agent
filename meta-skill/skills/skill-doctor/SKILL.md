---
name: skill-doctor
description: "The improve specialist within meta-skill: make an existing agent skill better. Run a Judge Review against best practices (default, produces a scored Quality page) or diagnose a specific reported failure, then propose edits for human approval and verify the fix. Reached through meta-skill's routing; invoke directly only when explicitly named. Not for authoring a new skill (skill-writer) or formal performance measurement (skill-evaluator)."
---

# Skill Doctor

Improve an existing agent skill. Two modes — **Judge Review** (default) and
**Diagnose** — feed a shared **propose → approve → Edit → Verify** back half.

For the central Meta Skill CLI surface, read
[cli.md](../../references/cli.md). Do not invent doctor-specific command
interfaces when a plugin-level command exists.

**Human feedback is evidence, not edit authorization.** Never edit the target
skill, generated packages, docs, or source unless the user asks to *make /
apply / update / patch / fix*. Writing workbench artifacts (`review.md`,
`spec.md`) is always allowed — they are evidence, not payload edits.

## Mode Selection

Pick the starting mode from what the user brought; it is a starting point, not a
cage — solve the user's problem whichever way works.

- **Judge Review** (default) — proactive audit / prompt-optimization: "make my
  skill better," "is my triggering solid?" No specific failure in hand.
- **Diagnose** — a reproducible failure walked in: "my skill keeps failing on
  prompt X." A specific case you can re-run.

Tiebreaker: a specific, reproducible failing case → **Diagnose**; otherwise →
**Judge Review** (including static complaints like an over-long description).

## Judge Review (default)

Produce a **scored Quality page** (`review.md`) — see
[references/rubric.md](references/rubric.md).

1. Score **Discovery** (4 dims) and **Implementation** (5 dims), each 0–3 — every
   dimension's reasoning must cite the skill's own text; see
   [references/rubric.md](references/rubric.md) for calibration and a worked example.
2. Run the **Verify tests** (deterministic): `scripts/meta-skill validate <skill-dir>`.
3. **Overall Quality Score** = rounded average of Discovery %, Implementation %,
   and Verify-tests %.
4. Write `review.md` with scores + prioritized findings, then **stop** —
   it proposes; it does not edit.

## Diagnose

Reproduce the reported failure before changing anything — see
[references/diagnose.md](references/diagnose.md): one narrow in-loop run,
localize the cause, propose the smallest fix.

## Edit

Route, evidence, the Prompt Doctor Loop, and surgical update rules live in
[references/edit.md](references/edit.md). Apply only the
edits the user approved; smallest correct change; edit the **source** skill,
never a generated package copy.

For one-off improvement testing, use the shared skill trial run workflow in
[skill-trial-runs.md](../../references/skill-trial-runs.md). Prefer a child
worktree for candidate edits; the child demonstrates or revises in isolation,
while the parent applies only approved source edits.

## Verify

Re-run the **Verify tests** through `scripts/meta-skill validate <skill-dir>`. Confirm
the approved fix held and refresh the Verify-tests third of the score, plus a
quick regression scan — see [references/verify.md](references/verify.md).
Escalate to `skill-evaluator` when the decision needs task/condition evidence:
for example, whether the fix improves outcomes over the current skill or a
no-skill baseline.

## Workbench

Iteration artifacts live in a gitignored, plugin-wide workbench at the target
skill's project root: `<project>/.meta-skill/` — `review.md` (Quality page) and
`spec.md` (durable notes). The project root already names the skill and contains
the portable skill payload at `<project>/skill/`; do not add another skill-name
namespace. Never write workbench files into `meta-skill/` itself.

## Guardrails

- **Feedback ≠ authorization** — both modes propose first; edit only on an
  explicit make/apply/update/patch/fix.
- Reproduce *one* case; don't measure many tasks/conditions — that's `skill-evaluator`.
- Smallest correct change; edit source, never generated packages.
- Child worktree edits are evidence, not promotion; parent-side source edits
  still require authorization.
- A `description` change alters triggering/routing — call it out explicitly.
