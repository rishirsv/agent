# Session Capture

Read this when the user activates Skill Writer during a Codex session, or points
to a prior Codex thread/session, and wants the observed workflow turned into a
durable skill.

## Aim

Mine the thread as evidence for a reusable workflow, then return to the normal
Skill Writer flow. The output is an ordinary portable skill, not a transcript
summary.

Stay narrow: use the current thread or the specific thread/session the user
identified. Do not scan unrelated sessions to hunt for patterns unless the user
explicitly asks.

Treat session capture as one context source for ordinary skill authoring. It
feeds Skill Writer's main workflow answer-set, but it does not
replace the skill-or-not gate, trigger design, payload rules, or final
validation. Draft the extracted decisions into `SKILL.md` itself rather than a
separate planning document.

## Capture Modes

Choose the capture mode before reading deeply:

- **Session distillation**: use when the user points to a prior thread or
  observed workflow and wants a reusable skill. Mine enough evidence to design
  the recurring job, trigger boundary, runtime guidance, and resources.
- **Recent success capture**: use when the user asks to make the work they just
  completed permanent or reusable. Promote only the bounded workflow that
  recently succeeded; do not turn the whole conversation into runtime guidance.

If the session also includes source packs, example input/output pairs,
transcripts plus notes, writing samples, or prior artifacts, read
[source-distillation.md](source-distillation.md) after locating the session
evidence. Session capture recovers the observed workflow; source distillation
extracts reusable rules from the source material.

Recent success capture is stricter than ordinary session distillation. It needs
evidence that the workflow actually worked, such as accepted output, a
successful artifact, a passing validation step, or a tool/script/browser flow
that reached the stated result. If that proof is absent, do not invent the
workflow from intent alone; return to ordinary interview and scaffold from the
best available requirements.

## Lesson Gate

A thread can contain many durable lessons. Do not turn all of them into skills.

- One-off result: no durable artifact.
- Simple preference or fact: memory or operating rule.
- Project-specific behavior: repo doc or local instruction.
- Lightweight repeated wording: prompt or snippet.
- Portable, recurring, multi-step capability: skill.

Create a skill only for the last case. If the captured workflow appears once and
the user has not said it should recur, treat it as provisional and confirm the
recurring job in the draft outline.

## Locate Thread Evidence

Prefer the highest-level thread surface available:

- If thread tools are available, use the current thread context or read the
  user-identified thread by title, id, or URL.
- If local session files are the only source, inspect only the matching
  `~/.codex/sessions/**/rollout-*.jsonl` or archived session file. Use
  `session_meta.payload.id`, `turn_context`, `event_msg`, and `response_item` to
  orient the read.
- If the target thread is ambiguous, ask one question for the thread identifier
  or title before reading broadly.

Pull enough evidence to recover the repeatable workflow. Do not load the whole
session when a bounded turn range, user story, or file/tool cluster gives the
answer.

For recent success capture, walk back only far enough to identify the successful
workflow and its immediate setup. If no recent successful workflow is visible,
stop with a concise refusal and next step:

```text
No recent successful workflow found. Run or identify the workflow first, then
ask to make it reusable.
```

## Extract

Capture the parts that change skill behavior:

- **Trigger language**: user phrases, symptoms, file types, and handoff moments
  that should activate the new skill.
- **Non-trigger boundary**: nearby requests that appeared in the thread but
  should route elsewhere.
- **Workflow spine**: the useful sequence of decisions, reads, commands, tool
  calls, edits, checks, and finalization. Separate the recommended path from
  one-off detours.
- **Final successful slice**: for recent success capture, use only the final
  attempt that produced the accepted result. Keep failed attempts out of the
  runtime path; use them only as gotchas, failure shields, or evidence for why a
  deterministic resource may be useful.
- **Invariants**: steps or checks that held across turns, files, attempts, or
  examples. These are stronger skill material than isolated actions.
- **Tool surface**: tools, CLIs, scripts, MCP/thread/browser/computer tools,
  package managers, auth assumptions, network needs, sandbox constraints, and
  commands that were essential.
- **Files and sources**: source-of-truth files, generated files, references,
  assets, local-only scratch, and paths that must not be copied into runtime.
- **Corrections and decisions**: user corrections, rejected directions,
  approval gates, naming decisions, hard cuts, and scope boundaries.
- **Validation proof**: tests, lint, build, screenshots, rendered checks,
  diffs, package syncs, or manual inspections that proved the workflow.
- **Failure modes**: mistakes, missing inputs, broken tools, ambiguous states,
  or misleading intermediate conclusions the skill should prevent.
- **Output contract**: final answer shape, created artifact shape, caveats,
  positive-null behavior, and stop condition.
- **Project mode signal**: whether the workflow needs `.meta-skill/` state,
  durable authoring notes, team reuse material, or should remain portable-only.

Keep provenance for reasoning while drafting, but keep it out of runtime unless
the skill directly depends on that exact source.

Map the extraction into the required interview answer-set:

| Answer-set field | Session evidence to use |
|---|---|
| Job | Recurring workflow spine, not the one-off result. |
| Trigger (+ not for) | User phrases, symptoms, file types, handoff moments, and adjacent non-trigger tasks. |
| Inputs and output | Files, tools, source material, created artifacts, final answer shape. |
| Invariants and failure shields | User corrections, repeated checks, source-vs-generated boundaries, failure modes. |
| Fragility | Whether success depended on judgment prose, fixed output shape, deterministic scripts, or strict command order. |
| Skill category | The primary skill type implied by the successful workflow; narrow or split if the session straddled categories. |
| Evaluation posture | Capability uplift, encoded preference, or hybrid; include realistic prompt seeds, near misses, objective checks, and the baseline when the session provides them. |
| Gates | Approval moments before external writes, package/sync/install, destructive edits, or final delivery. |
| Project mode | Whether durable `.meta-skill/` docs, team reuse material, or portable-only output is needed. |

## Clarify Budget

Ask at most one or two tight interview questions before building. Ask only for
required answer-set decisions the thread cannot answer:

1. The recurring job and nearest `not for` boundary.
2. Whether to preserve a tool/script/resource as runtime payload or leave it as
   prose guidance.
3. Project mode: portable-only, or `.meta-skill/` authoring docs/team reuse
   material.

If the thread evidence gives a defensible default, state the default in the
draft outline and build.

## Distill

Generalize the session before writing runtime:

- Turn commands and tools into reusable operating rules only when they were
  essential to the workflow.
- Keep exact commands when deterministic repetition matters; otherwise name the
  tool choice and the reason.
- Convert specific values, paths, filenames, users, repos, dates, and failures
  into roles or conditions.
- Drop one-off file paths, thread ids, raw prompts, provider/model names,
  transient errors, and local provenance from runtime.
- Preserve user corrections as guardrails when they prevent likely future
  mistakes.
- Preserve source-vs-generated boundaries when a future agent could edit the
  wrong surface.

## Handoff Back

Before editing files, produce promotion evidence when using recent success
capture:

```md
Promotion Evidence
- Recent success: <what proved the workflow worked>
- Final successful slice: <the commands/tools/files actually used>
- User acceptance: <explicit, inferred from completed delivery, or missing>
- Reusable job: <what should recur>
- Excluded detours: <failed or irrelevant attempts not copied into runtime>
```

Then produce a compact draft outline:

```md
Draft Skill Outline
- Job: <recurring workflow captured from the thread>
- Trigger (+ not for): <user phrase>; not for <nearest boundary>
- Inputs and output: <thread-derived input and output shape>
- Invariants and failure shields: <corrections, gates, failure modes>
- Fragility: <judgment prose | fixed shape | script-backed | strict sequence>
- Skill category: <primary type from design.md>
- Evaluation posture: <capability uplift | encoded preference | hybrid; baseline when available>
- Eval seeds: <positive prompts, near misses, and objective checks when available>
- Gates: <approval gates or none>
- Project mode: <portable-only | project mode with .meta-skill/...>
- Still open: <one or two questions, or none>
```

When `Still open` is `none`, create the skill. Use
[design.md](design.md) for the trigger/body design and
[cookbook.md](cookbook.md) only for the smallest useful runtime snippet.
Author the payload from the draft outline, not from the raw transcript.
