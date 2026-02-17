---
description: Explain a topic in plain, non-technical language so I can make a decision.
argument-hint: [TOPIC="<optional: what to explain>"]
---

# Explain

Explain a topic (or the current discussion) in plain, non-technical language so I can make a decision quickly.

## Inputs (optional)

```text
[TOPIC / QUESTION]
```

```text
[CONTEXT: snippet, code, error, constraints, goal]
```

```text
[CHANGED FILES + WHAT CHANGED]
```

## Operating rules

- Assume I am smart but new to this topic. Avoid jargon. If needed, define a term in one short sentence.
- If no topic is given, infer it from context and confirm in one line.
- If ambiguous, ask up to **1** clarifying question before explaining.
- Keep the default response short (roughly one screen).
- Focus on decision support: what it is, why it matters, and trade-offs.
- After a large change (or many changed files), **always** include:
  - A plain-language summary of what changed and why.
  - A file-by-file section covering each modified file and why it matters.
- State assumptions and uncertainty clearly.
- In code review or planning discussions, present each potential option simply and explain 2-3 options each with their benefits and tradeoffs.

## Output format (Markdown)

## In plain words

[2-4 short sentences. No jargon.]

## What changed (large change default)

[Simple summary of the change and impact.]

## File-by-file changes

- `path/to/file` - [What changed in simple terms, and why it matters]
- `path/to/file` - [What changed in simple terms, and why it matters]

## Trade-offs (if choosing between options)

- **Option A:** gain / give up / best when
- **Option B:** gain / give up / best when

## Recommendation

[Short conditional recommendation: "If X matters most, choose Y. If A matters most, choose B."]

## Quick questions (condensed)

1. What do you want next? `simpler` / `deeper` / `example` / `recommendation`
2. What matters most? `speed` / `reliability` / `simplicity` / `cost`
