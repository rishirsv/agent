# Common Understanding

Load this file when you need to write the final `Common Understanding` section well.

## Purpose

Capture the minimum shared understanding needed for the next real step without turning the summary into a plan.

Use this structure:

```md
# Common Understanding

## Agreed
- ...

## Open
- ...

## Next
- ...
```

## Agreed

Include:

- settled product, design, naming, routing, ownership, or scope decisions
- newly defined canonical terms that should be used consistently going forward
- resolved ambiguities or contradictions that should not be reopened casually
- durable constraints, non-goals, or boundaries that shape the next artifact
- explicit "this, not that" calls that clarify the contract

Guidance:

- prefer repo-facing language over raw code symbols unless the code symbol itself is the decision
- if a new term matters, define it briefly in place so later docs can reuse it consistently
- if a decision should become canonical repo language, say so clearly enough that a later spec, context doc, or architecture doc can adopt it directly

## Open

Include:

- only the unresolved questions that still affect the next real artifact or decision

Avoid:

- backlog-style nice-to-haves
- speculative future concerns that do not block the next step

## Next

Include:

- the exact next artifact to create, update, or request
- any doc propagation that should happen next, such as carrying new canonical terms into a context doc, product spec, project spec, routing doc, or architecture doc
- ADR creation when a decision is hard to reverse, surprising without context, and the result of a real tradeoff
- any follow-on clarification still needed before planning or implementation can begin

Guidance:

- name the concrete document or decision step, not a vague phase
- if terminology was newly defined, say where it should be recorded so the repo uses it consistently
- if no durable artifact should be written yet, say what must be resolved first
