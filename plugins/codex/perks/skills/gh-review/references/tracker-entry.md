# Tracker Entry Shape

Use this when the target tracker has no stronger local format.

```markdown
### <short title>

- Status: Queue
- Source: <PR title/number> - <comment URL>
- Classification: <bug follow-up | product follow-up | test gap | docs gap | architecture debt | cleanup | won't fix>
- Where: <file/module/area>
- Issue: <what the reviewer noticed>
- Why it matters: <risk, maintenance cost, or user impact>
- Simplest useful fix: <bounded change>
- Verification: <focused check or manual review>
```

Avoid dumping full review comments into the tracker. Preserve source links and summarize the actionable follow-up. Use "architecture debt" only when the comment is truly about duplication, owner drift, maintainability, or proof debt.
