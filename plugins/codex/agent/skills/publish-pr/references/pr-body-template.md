# PR Body Template

Read this before drafting the PR title or body.

## Writing Posture

Write for reviewers who need to understand the change quickly. Start with a direct summary of what changed and why it matters, then give enough implementation and validation detail to make review easier. Use prose where it clarifies intent; use bullets only for scan-friendly lists such as validation.

Avoid raw terminal transcripts, giant changelogs, and commit-by-commit summaries.

## Title

Use a concise outcome title that describes the full PR:

```text
Add scoped PR publication skill
Fix retry loop for cloud sync failures
Document PR filing workflow
```

## Body Shape

Use this shape unless the repo has a PR template:

```markdown
## Summary

<One or two short paragraphs that describe what changed, why it matters, and who it affects.>

## What Changed

<A focused description of the implementation, grouped by behavior or module rather than commit order.>

## Validation

- <command or check>: <result>
- <command or check>: <result>

## Notes

<Known limits, skipped checks, follow-up, or "None" when the section would otherwise be empty.>
```

If the repo has `.github/pull_request_template.md`, use it as the base shape and preserve its required headings. Still keep the writing concrete and reviewer-friendly.

## Validation Evidence

Include commands already run in this session when they still apply. If validation was not run, say exactly what was skipped and why.
