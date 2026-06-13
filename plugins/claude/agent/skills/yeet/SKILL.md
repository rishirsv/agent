---
name: yeet
description: "Compatibility alias for the publish-pr workflow. Use when the user explicitly says yeet, $yeet, or yeet review; not for generic publish/open-PR requests unless they also use the word yeet, local-only commits, existing PR review-thread handling, or standalone CI repair."
---

# Yeet

Use this as the `$yeet` command alias for `publish-pr`.

When this skill triggers, load and follow `../publish-pr/SKILL.md` as the canonical workflow. Preserve invocation modifiers:

- `yeet` means publish the scoped local change as a pushed branch and draft PR.
- `yeet review` means publish the draft PR, post the exact Codex review comment `@codex review`, and follow `../publish-pr/references/babysit-pr.md`.

Use `@codex review` as the Codex review trigger.
