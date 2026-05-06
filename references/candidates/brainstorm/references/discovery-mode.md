# Discovery Mode

Use discovery mode when the user wants new ideas, opportunities, improvements, or surprising directions before they have chosen one idea to develop.

## Start

Identify the subject. If the subject is vague enough that reasonable agents would ideate on different things, ask one short scope question. Keep "surprise me" as a valid path when the user wants the agent to choose the focus from the available context.

Do not ask for solution direction, success criteria, audience, or tone before generating. Those belong to development mode unless the subject is otherwise impossible to identify.

## Ground

For repo/software topics, read `repo-grounding.md` first. For non-software topics, gather only the context needed to make the candidate set specific: a description, URL, draft, existing options, or constraints the user already named.

If the user requests current market or technical research, browse or use the relevant research tool. Otherwise, do not make external research a mandatory dependency.

## Choose Depth

- **Solo**: quick idea set; no subagents.
- **Light**: 1 subagent for repo/context grounding.
- **Standard**: 2-3 subagents for independent lenses.
- **Deep**: 4-5 subagents for cornerstone product work, broad repo scans, or "surprise me" requests.

Use `subagents.md` before delegating. Prefer strong current reasoning models for idea-generating agents. A cheaper model is acceptable only for bounded grounding.

## Generate Before Evaluating

Build a raw candidate list first. Use multiple lenses:

- Pain and friction: what is slow, confusing, brittle, or emotionally off?
- Product/UX: what would feel better, clearer, calmer, faster, or more inevitable?
- Removal and simplification: what could disappear?
- Architecture and ownership: what boundary would make future work easier?
- Leverage and compounding: what makes many later moves cheaper?
- Contrarian or constraint flip: what changes if the obvious constraint is inverted?
- Cross-domain analogy: how do other fields solve the same shape of problem?

Each serious candidate needs a warrant:

- `direct`: repo evidence, user-provided context, docs, code, tracker item, shipped behavior, or explicit quote
- `external`: named source, pattern, prior art, or research
- `reasoned`: a written-out first-principles argument

Do not surface candidates whose warrant does not actually support the move.

## Critique

After generation, merge, dedupe, and combine overlapping ideas. Then reject weak candidates before presenting survivors.

Reject ideas that are:

- vague
- not actionable
- duplicative of a stronger idea
- not grounded in context
- too expensive for likely value
- already covered by existing docs, plans, or workflows
- generic advice that ignores the repo or domain
- subject replacement rather than improvement
- unsupported by a real warrant

For repo/software topics, also reject ideas that:

- create duplicate truth or unclear ownership
- add fallback/compatibility layers without explicit need
- ignore current tracker or spec commitments
- overfit to generic framework defaults
- propose implementation detail before product/UX shape is clear

## Present Survivors

Show 3-7 ranked ideas. Keep it concise.

For each idea include:

- **What it is**
- **Why it fits**
- **Warrant**
- **UX implication**
- **Implementation implication**
- **Risks**
- **Recommended next step**

End by recommending which idea to develop next. Offer to switch into development mode for the selected idea.
