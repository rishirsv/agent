# Meta Skill Work Tracker

Use this tracker to keep the Meta Skill plugin roadmap centered on evaluation truth. The immediate goal is now to spend the simplified surface on App Server capabilities that a plain model API cannot provide: event trajectories, sandbox evidence, and forkable threads.

## Current State Summary

Meta Skill has one top-level TypeScript CLI surface: `create`, `project init`, `lint`, `run`, `judge`, `feedback import`, `report`, `decide`, and `package`. TypeScript runs directly from `plugins/meta-skill/src/` through `scripts/meta-skill.js`; validation is `npm test`, `npm run typecheck`, and repo-level `git diff --check`.

The workbench has one compact project-local shape:

- portable payload at the project root, with `SKILL.md` plus runtime support folders.
- authoring and evidence state under `.meta-skill/`.
- cases under `.meta-skill/cases/<ID-slug>/`.
- deterministic tests under `.meta-skill/tests/unit/` and `.meta-skill/tests/eval/`.
- run evidence under `.meta-skill/runs/<run-id>/`.

Case taxonomy is one executable axis. `meta-skill run --type` accepts `R`, `F`, and `G`, mapping to regression, failure mode, and gate cases.

A run evaluates one execution source at a time:

- working payload by default
- no skill / unassisted execution with `--no-skill`

Run evidence uses one append-only fact log and per-case files:

```text
.meta-skill/runs/<run-id>/
  facts.jsonl
  payload/
  cases/<case-folder>/
    case.md
    rpc.jsonl
    trajectory.json
    final.md
```

`payload/` exists for working-payload runs. No-skill runs omit it. Token metrics live on `case_trial_finished` facts as nullable numbers plus one `unavailable_reason`; reports derive token totals from those facts. Reports are deterministic projections over facts and referenced case evidence. They print Markdown or JSON and do not persist report files.

Execution facts and verdict evidence are separate. Successful App Server execution is `execution_status: completed`; pass/fail style evidence comes only from deterministic tests, judges, or human feedback. Completed execution without a check observation remains evidence, not proof of quality.

The App Server runner starts one read-only/no-approval/no-network thread per case, force-attaches the skill payload for working-payload runs, collects final answer text, saves raw RPC rows, writes normalized `trajectory.json`, captures final cumulative token telemetry when present, and records case completion facts. The current trajectory summary includes turns, items, command executions, file changes, tool calls, approval requests, and unknown methods. It feeds reports and optional judge context.

The next measurement gap is the assertion layer over trajectory evidence:

- App Server protocol drift is still handled mostly by unavailable token evidence; add a clearer canary/gate before building more event-stream features.
- trigger and writable-output concepts stay future-only until the runner can prove native routing or writable outputs.
- schema versions still appear only at external-ish package/RPC record boundaries; per-report or internal run schema ceremony should wait for a real consumer.
- bounded event retention needs a small hardening pass so overflow bookkeeping itself cannot grow without bound.
- final-answer extraction should avoid carrying forward a previous turn's final text when the current turn overflows before deltas are available.

Validation baseline from the current merged slice:

- `npm test` from `plugins/meta-skill/`
- `npm run typecheck` from `plugins/meta-skill/`
- `git diff --check` from the repo root

## To Do

### 1. Harden App Server Event Buffer Overflow Handling

Status: follow-up from bounded buffer review.

Context: The client stores raw App Server events in memory and case code asks for `eventsSince(mark)`. This is fine for tiny runs but becomes risky once trajectory parsing, sampling, or fuzzing is added.

Issue: An unbounded event buffer makes long or noisy cases a memory risk and can hide missing persistence boundaries.

Surface: `app-server/client.ts`, `app-server/runner.ts`, `rpc.jsonl` persistence, live-smoke tests, and future trajectory parsing.

Solution Shape: Keep `rpc.jsonl` as the durable event log, collapse overflow warning bookkeeping to constant state, and make final-answer extraction explicitly unavailable when the current turn overflows before deltas are available.

Mini Plan:

1. Replace per-overflow warning retention with aggregate constant-space overflow state.
2. Keep warning rows in `rpc.jsonl` and evidence warnings in case outputs.
3. Do not preserve a previous turn's final text when the current turn overflows before final deltas are available.
4. Add overflow regression tests for both warning memory and final-answer behavior.
5. Run `npm run typecheck`.

Implementation Prompt:

```text
Harden Meta Skill App Server overflow handling in /Users/rishi/Code/agent. Keep `rpc.jsonl` as the durable raw event log and keep the bounded client-side event buffer, but collapse overflow warning bookkeeping to constant-space state. If the current turn overflows before final assistant deltas are available, write an explicit unavailable final/evidence warning instead of carrying forward a previous turn's final text. Update `plugins/meta-skill/src/app-server/client.ts`, `src/app-server/runner.ts`, tests, docs. Run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 2. Settle Schema Version Policy

Status: mostly settled by `fb475536`; small policy cleanup remains.

Context: TypeScript source runs directly under `plugins/meta-skill/src/`. Current schema versions remain on package metadata, raw RPC rows, and trajectory files.

Issue: The repo still pays for migration ceremony before there are stable external consumers.

Surface: `package.ts`, `app-server/runner.ts`, `app-server/trajectory.ts`, persisted package/RPC/trajectory metadata, tests, and repo validation.

Solution Shape: Preserve schema versions only where they mark an external package, raw protocol record, or durable trajectory evidence boundary. Do not add schema versions to internal report projections or fact payloads without a real migration consumer.

Mini Plan:

1. Re-inventory the remaining `schema_version` fields.
2. Document why package metadata and raw RPC rows are versioned, or keep only the fields with a real consumer.
3. Keep reports and facts versionless until a real migration boundary exists.

Implementation Prompt:

```text
Settle Meta Skill schema-version policy in /Users/rishi/Code/agent. Re-inventory the remaining `schema_version` fields in package metadata, raw RPC rows, and trajectory evidence, preserve only fields that mark package/protocol/durable evidence boundaries, and keep internal fact/report projections versionless until a real migration consumer exists. Update tests/docs accordingly. Run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 3. Add Deterministic Trajectory Assertions And First-Failure Localization

Status: next capability on top of current trajectory evidence.

Context: The runner captures raw RPC in `rpc.jsonl`, writes normalized `trajectory.json`, and reports compact trajectory summaries. Gate, source-grounding, and failure cases often care less about the final text than about whether the agent read the right file, used the right tool, avoided a write, asked for approval, or stopped at the right point.

Issue: Current deterministic tests can inspect files/commands externally, but they do not have a first-class way to assert on saved App Server behavior.

Surface: `.meta-skill/cases/*/case.md`, executable tests under `.meta-skill/tests/`, `lint.ts`, `eval/run.ts`, `report.ts`, and trajectory evidence files.

Solution Shape: Add a tiny assertion layer over trajectory facts: expected tool called, forbidden tool not called, file read occurred, command count under N, approval requested, no writes, no network, final answer present, first failed step. Report the first failed assertion beside the final answer.

Mini Plan:

1. Define a small assertion manifest shape or extend deterministic test metadata.
2. Run assertions after case execution using `trajectory.json`.
3. Record assertion results as check observations in `facts.jsonl`.
4. Render failed trajectory assertions in Markdown and JSON reports.
5. Keep judges optional and separate.

Implementation Prompt:

```text
Add deterministic trajectory assertions to Meta Skill in /Users/rishi/Code/agent. Build on structured App Server trajectory evidence and support a small assertion set: expected tool/file/command event, forbidden event, approval requested, no write, no network, max tool calls, and final answer present. Record assertion results as check observations in `facts.jsonl`, show first-failure localization in Markdown and JSON reports, and keep judges separate. Update case docs, lint validation, tests, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 4. Add Cost / Latency / Tool-Budget Gates

Status: low-complexity measurement win.

Context: App Server events and token usage can support budgets that final-answer judging cannot: token totals, turn count, tool count, command count, and elapsed time.

Issue: Skills can become expensive or slow while still producing acceptable final answers. Without budget gates, regressions in tool behavior and latency are invisible.

Surface: token usage on `case_trial_finished` facts, trajectory facts, event timestamps, deterministic tests, report budget sections, and eval docs.

Solution Shape: Add optional deterministic budget assertions such as `max_total_tokens`, `max_turns`, `max_tool_calls`, `max_commands`, and `max_elapsed_ms`. Treat them as test failures, not readiness states.

Mini Plan:

1. Confirm timestamp availability and token totals in run evidence.
2. Add budget assertion types to the trajectory assertion layer.
3. Record budget failures as check observations in `facts.jsonl`.
4. Render compact budget pass/fail rows in Markdown and JSON reports.
5. Add examples to eval docs.

Implementation Prompt:

```text
Add deterministic cost, latency, and tool-budget gates to Meta Skill in /Users/rishi/Code/agent. Use canonical token usage facts, trajectory facts, and event timestamps to support optional assertions like max total tokens, max turns, max tool calls, max commands, and max elapsed time. Record failures as check observations in `facts.jsonl` and render compact budget evidence in Markdown and JSON reports. Update docs, tests, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 5. Golden-Trajectory Snapshot Tests

Status: high-value drift detector after trajectory assertions.

Context: A final answer can still look fine while behavior drifts: the agent stops reading source files, calls an extra tool, skips a gate, or takes a longer route.

Issue: Current snapshots capture payloads and final reports, not known-good agent behavior.

Surface: trajectory evidence files, case criteria, report diff rendering, and deterministic tests.

Solution Shape: Let authors bless a compact trajectory snapshot for a case, then compare later runs against that snapshot. Diff normalized behavior, not raw event IDs or timestamps.

Mini Plan:

1. Define a normalized trajectory snapshot format that excludes volatile IDs/timestamps.
2. Add a command or test mode to bless a snapshot from a run.
3. Compare new trajectory facts against the blessed snapshot.
4. Report additions/removals/reordered critical events.
5. Keep snapshot tests opt-in per case.

Implementation Prompt:

```text
Add golden-trajectory snapshot tests to Meta Skill in /Users/rishi/Code/agent. Use normalized trajectory facts, not raw RPC IDs or timestamps, to bless known-good behavior for selected cases and flag behavioral drift on later runs. Support opt-in case configuration, snapshot blessing from a run, deterministic diff output, report rendering, tests, docs, and validation with `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 6. Behavioral Trajectory Diff Between Separate Runs

Status: report power, not a comparison mode.

Context: The current run model is one execution source per run. Humans still need to inspect how two separate runs differ. App Server trajectory facts can align behavior turn-by-turn and show the first divergence.

Issue: Text diffs miss the important changes: one run read the source file and another skipped it; one called a tool; one hit a gate; one requested approval.

Surface: `report.ts`, Markdown/JSON report rendering, run index, trajectory evidence, and an explicit report/open command that accepts two run IDs.

Solution Shape: Add a separate investigation command or report view that compares two completed run reports by trajectory facts. Keep the output as manual inspection evidence, separate from automated uplift or pass/fail comparison.

Mini Plan:

1. Require two explicit run IDs; do not compare inside `eval run`.
2. Align cases by ID and turns by stable order.
3. Compute first behavioral divergence from normalized trajectory facts.
4. Render compact diffs: file/tool/command/approval/final-text deltas.
5. Keep summary language source-honest: manual behavioral diff, no verdict.

Implementation Prompt:

```text
Add a manual behavioral trajectory diff view to Meta Skill in /Users/rishi/Code/agent. The command should accept two explicit run IDs, read normalized trajectory facts, align cases/turns, and show the first behavioral divergence plus compact tool/file/command/approval deltas. Label it as manual inspection evidence, not an automated uplift or verdict. Update report code, docs, tests, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 7. Counterfactual Fork Trees

Status: App Server-native capability, gated on protocol proof.

Context: The App Server can potentially preserve thread state and fork from a decision point. That lets a run share the expensive prefix and branch only where behavior matters: a gate, ambiguity, refusal boundary, or trigger moment.

Issue: Re-running whole cases cannot efficiently answer "what happens if the user pushes back here?" or "does the gate hold under pressure?"

Surface: generated App Server thread/fork protocol, case turn definitions, trajectory evidence, report tree rendering, and run storage.

Solution Shape: Add explicit fork-point cases after confirming the protocol. A base thread runs to a marked turn, then child branches inject pressure prompts. Store a tree of branch trajectories with shared prefix metadata.

Mini Plan:

1. Verify exact App Server fork/resume/thread-state protocol.
2. Add a small case config for fork points and branch prompts.
3. Persist base prefix evidence once plus per-branch trajectory evidence.
4. Run branch trajectory assertions independently.
5. Render the decision tree and branch outcomes in Markdown and JSON reports.

Implementation Prompt:

```text
Prototype counterfactual fork-tree evals in Meta Skill in /Users/rishi/Code/agent after verifying the generated App Server fork/resume protocol. Add explicit case config for a fork point and branch prompts, run a shared prefix once, fork N branches with different user pressures, persist per-branch trajectory evidence, and render a decision tree in Markdown and JSON reports. Keep this single-source per run, with branches represented as forked evidence rather than comparison runs. Add tests/fixtures, docs, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 8. User-Simulator Branches For Follow-Up Pressure

Status: useful after fork trees.

Context: Many skill failures appear only after a user follow-up: the user asks for an unsafe shortcut, rejects a clarification, provides partial evidence, or tries to bypass a gate.

Issue: Hand-authoring every follow-up is slow, and single-turn cases miss interaction behavior.

Surface: fork-tree case config, branch prompt generation, evaluator docs, run evidence, and trajectory assertions.

Solution Shape: Add a constrained user-simulator branch generator that proposes follow-up prompts from named personas such as naive user, impatient user, adversarial user, distractor user, or missing-context user. Human-authored branches remain the default; generated branches are labeled generated pressure cases.

Mini Plan:

1. Define a small set of simulator profiles and output constraints.
2. Generate branch prompts only from case task text and visible fixture descriptions, not hidden criteria or answer keys.
3. Save generated branches before execution for reviewability.
4. Run branches through the same fork/trajectory assertion path.
5. Label generated-user evidence clearly in reports.

Implementation Prompt:

```text
Add constrained user-simulator branches to Meta Skill in /Users/rishi/Code/agent after fork-tree support exists. Generate labeled follow-up pressure prompts from case-visible context using profiles like naive, impatient, adversarial, distractor, and missing-context user. Save generated prompts before execution, avoid criteria leakage, run them as fork branches, and report them as generated pressure evidence. Update docs, tests/fixtures, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 9. Tool Chaos / Graceful-Degradation Evals

Status: App Server-native sandbox/tool capability.

Context: Skill quality often depends on how the agent behaves when a preferred tool, MCP server, network path, or filesystem permission is unavailable.

Issue: Final-answer evals cannot distinguish graceful degradation from tool dependency collapse.

Surface: App Server tool/MCP/sandbox configuration, trajectory assertions, failure classification, report evidence, and case config.

Solution Shape: Add explicit tool-availability policies for a case: allow only selected tools, deny selected tools, disable network, or simulate tool failure if the protocol supports it. Assert that the agent asks for alternatives, reports unavailability, or uses an approved fallback.

Mini Plan:

1. Verify which tool/MCP/server controls the App Server exposes.
2. Add explicit case policy fields for allowed/denied capabilities.
3. Record policy in run facts and case evidence.
4. Assert on graceful degradation trajectory/final-answer facts.
5. Render policy and observed behavior in the report.

Implementation Prompt:

```text
Add tool chaos and graceful-degradation evals to Meta Skill in /Users/rishi/Code/agent after verifying App Server tool/MCP/sandbox controls. Support explicit case policies for allowed or denied tools/capabilities, record the policy in run evidence, and assert that the skill handles missing tools by using approved fallbacks or clearly reporting unavailability. Update trajectory assertions, failure classification, report rendering, docs, tests, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 10. Trigger Fuzzing After Native Routing Exists

Status: future only; requires non-forced skill routing.

Context: Trigger cases should test whether a skill fires under paraphrase, typo, indirection, or distractor noise. Today the runner force-attaches skill payloads, so trigger firing cannot be tested.

Issue: A hand-authored trigger phrasing is weak evidence, and force-attached runs are not trigger-routing proof.

Surface: native routing protocol, case taxonomy, prompt mutator, sampling/fork support, trajectory evidence, and reports.

Solution Shape: Once the App Server can make a skill available without force-attaching it, generate prompt mutations and sample/fork them. Record activation or non-activation evidence from the event stream.

Mini Plan:

1. Verify skill-available-but-not-attached routing protocol.
2. Restore trigger type `T` only after activation evidence is observable.
3. Add prompt mutation strategies: paraphrase, typo, indirection, buried request, distractor.
4. Run mutations as sampled/forked cases.
5. Report trigger robustness rate with examples, not just one pass/fail.

Implementation Prompt:

```text
Add trigger fuzzing to Meta Skill in /Users/rishi/Code/agent only after the App Server exposes native skill routing evidence without force-attaching the skill. Restore trigger type `T` at that point, generate prompt mutations for trigger cases, run them as sampled or forked cases, record activation/non-activation from trajectory evidence, and report trigger robustness with representative examples. Do not restore `T` as an executable type until routing proof is real. Update taxonomy, docs, tests, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 11. Writable Sandbox And Artifact Capture

Status: future only; requires protocol-proven writable policy.

Context: Some skills produce files. The current runner is read-only, so writable-output evaluation needs an explicit protocol-backed mode.

Issue: Without writable sandbox evidence, the tool cannot test whether a skill produces the right file output, avoids writing outside the stage, or cleans up after itself.

Surface: App Server sandbox policy, stage workspace, output collector, trajectory assertions, report output listing, case taxonomy, and docs.

Solution Shape: Add explicit writable mode limited to a staged workspace output area. Capture generated files deterministically and assert no writes escape the allowed area.

Mini Plan:

1. Verify writable sandbox policy and file-write event shapes.
2. Add an explicit case/run policy for writable output mode.
3. Capture generated files under a known evidence folder.
4. Add trajectory/file assertions for allowed and forbidden writes.
5. Document writable-output case claims after this works.

Implementation Prompt:

```text
Add writable sandbox output capture to Meta Skill in /Users/rishi/Code/agent only after verifying the App Server writable sandbox protocol. Support explicit writable cases scoped to a staged output area, capture generated files deterministically, assert no writes escape the allowed area, and render output evidence in reports. Update runner, case config, trajectory assertions, report code, tests, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 12. Closed-Loop Eval Diagnose Fork-Verify

Status: high-wow future capability; keep human-gated.

Context: The improve lane should turn failing evidence into bounded proposed edits. App Server fork/rerun support can test whether an edit would plausibly fix the failure before a human promotes it.

Issue: Without fork-verified evidence, improvement can become vibes: a critic suggests changes, but the tool does not prove the case improves.

Surface: `skill-improve`, eval run evidence, failing trajectories, patch proposal storage, forked verification run, reports, and human promotion gates.

Solution Shape: On failure, spawn a critic thread that reads the failing trajectory and proposes a bounded skill edit. Apply it in a temporary payload or forked workspace, rerun the failing case, and present before/after evidence. Never auto-promote.

Mini Plan:

1. Define a patch proposal evidence file with cited failure references.
2. Run critic analysis in a separate no-tools or read-limited thread.
3. Apply proposed edit only to a temporary verification payload.
4. Rerun the failing case/fork and compare verdict/trajectory evidence.
5. Require human approval before promotion or release.

Implementation Prompt:

```text
Add a human-gated closed-loop eval diagnose fork-verify workflow to Meta Skill in /Users/rishi/Code/agent. On a failed case, create a critic thread that reads the failing trajectory and proposes a bounded skill edit with evidence citations. Apply the edit only to a temporary verification payload, rerun the failing case, and present before/after trajectory/test evidence to the human. Do not auto-promote or release. Update skill-improve docs, eval evidence storage, tests/fixtures, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 13. Answer-Only Runner As An Explicit Escape Hatch

Status: my addition; optional strategic simplification.

Context: If a case only grades final answer quality, the App Server is overkill. A plain model API style runner could run faster and cheaper, with massive parallelism and simple text judging.

Issue: The project should be honest about when it is grading answers versus behavior. Keeping every case on App Server can obscure that distinction.

Surface: eval runner selection, case config, docs, report labels, judge inputs, and validation.

Solution Shape: Add an explicit `answer-only` runner mode only for final-answer cases, or document why the project refuses it. Label its evidence clearly as text-only: no trajectory, no sandbox, no trigger proof.

Mini Plan:

1. Decide whether answer-only mode belongs in the tool or only as a design note.
2. If implemented, keep it opt-in and unavailable for gate, trajectory, and writable-output cases.
3. Persist runner mode in run facts.
4. Report text-only evidence limitations prominently.
5. Keep App Server as the default for behavior evals.

Implementation Prompt:

```text
Evaluate and, if accepted, add an explicit answer-only runner mode to Meta Skill in /Users/rishi/Code/agent. This mode should be opt-in, limited to final-answer cases, and clearly labeled as text-only evidence with no trajectory, sandbox, trigger, or writable-output proof. If the team keeps App Server as the only behavior-eval default, record that decision in docs. Update runner selection, report labels, tests, docs, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 14. Case Minimality And Criteria-Leak Audit

Status: my addition; protects eval integrity.

Context: The runner omits `case.md` from the solver workspace so criteria frontmatter never stages beside solver-visible fixtures. As case generation, fuzzing, user simulators, and fork trees arrive, leakage and over-broad context become easier to reintroduce accidentally.

Issue: Behavior evals lose credibility if hidden criteria, judge rubrics, or answer keys leak into solver-visible prompts, branch prompts, or generated follow-ups.

Surface: `stageWorkspace`, case loader, generated/fuzzed branch prompts, judge inputs, report evidence, and lint.

Solution Shape: Add an audit that records exactly which files/prompts were solver-visible and checks that hidden criteria/judge material did not enter task, branch, or simulator prompts.

Mini Plan:

1. Record solver-visible files and prompts per case.
2. Add lint/audit checks for criteria/judge leakage.
3. Include generated branch/fuzz prompts in the audit.
4. Render a compact "criteria hidden" evidence row in reports.
5. Add regression tests around stage workspace omissions.

Implementation Prompt:

```text
Add a case minimality and criteria-leak audit to Meta Skill in /Users/rishi/Code/agent. Record solver-visible files and prompts for each case, verify hidden `case.md` criteria and judge/rubric material do not leak into task, branch, simulator, or fuzz prompts, and render compact evidence in reports. Update stage workspace code, lint/audit tests, docs, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 15. Case Flake Ledger

Status: my addition; useful before full sampling UI.

Context: Repeated runs of the same case will happen manually before formal sampling ships. The run index could expose instability without adding a full flake-rate dashboard.

Issue: A single run is weak evidence, but adding n-sample machinery too early risks more ceremony. A ledger of repeated case outcomes is a smaller step.

Surface: run index, case IDs, verdict/test outcomes, token usage, trajectory summaries, and report project view.

Solution Shape: Add a read-only aggregation over historical runs: for each case, show recent execution failures, test/judge verdicts, token totals, and notable trajectory assertion failures. No new run mode required.

Mini Plan:

1. Read existing run reports/index entries by case ID.
2. Aggregate last N outcomes without changing run execution.
3. Show instability markers in project report.
4. Keep it informational, not a promotion gate.
5. Add fixtures for repeated pass/fail/no-verdict runs.

Implementation Prompt:

```text
Add a read-only case flake ledger to Meta Skill in /Users/rishi/Code/agent. Aggregate recent outcomes for each case across existing runs, including execution failures, test/judge verdicts, token totals, and trajectory assertion failures when present. Show instability markers in the project report without adding sampling mode or promotion gates. Update report/index code, tests, docs, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 16. Protocol Canary Run

Status: my addition; cheap protection for App Server drift.

Context: The tracker wants to pin App Server event shapes. A small canary can prove the currently installed App Server still emits the expected methods before a full eval run.

Issue: If protocol drift appears only inside case execution, users get noisy failures or "unavailable" evidence without a clear cause.

Surface: live-smoke test, CLI preflight, token parser, trajectory parser, architecture capture notes, and report warnings.

Solution Shape: Add an opt-in `meta-skill eval doctor` or preflight that starts a tiny thread and verifies required methods: `thread/start`, `turn/start`, `item/agentMessage/delta`, `turn/completed`, `thread/tokenUsage/updated` when available.

Mini Plan:

1. Define required and optional App Server methods for current eval features.
2. Add a canary command or preflight function.
3. Record observed protocol version/shape in diagnostic output.
4. Use canary failures to explain unsupported protocol warnings.
5. Keep live execution opt-in if it is slow or environment-sensitive.

Implementation Prompt:

```text
Add an App Server protocol canary to Meta Skill in /Users/rishi/Code/agent. Provide an opt-in diagnostic command or preflight that starts a tiny thread and verifies the required generated protocol methods and event shapes used by evals. Report observed token and trajectory event shapes clearly, and use canary results to explain unsupported protocol warnings. Update live-smoke tests, docs, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

### 17. Evidence Bundle Export For Review Threads

Status: my addition; small workflow multiplier.

Context: The user often orchestrates separate review or implementation threads. Eval evidence is currently stored as a run bundle, but handoff context is not packaged for another thread.

Issue: A review thread needs the small set of files that matter: task, final answer, trajectory, token usage, failing assertions, raw links, and hidden/non-hidden boundary notes.

Surface: report/open commands, run evidence paths, skill-improve workflow, and thread handoff docs.

Solution Shape: Add a command that emits a compact Markdown evidence brief for a run/case. It should cite local evidence paths, summarize execution/verdict/trajectory facts, and avoid embedding hidden criteria unless explicitly requested.

Mini Plan:

1. Define the evidence brief fields.
2. Add a command or report action for one case/run.
3. Pull from canonical evidence files only.
4. Include local file links and raw evidence paths.
5. Add tests with failed, no-verdict, and trajectory-rich cases.

Implementation Prompt:

```text
Add a compact eval evidence brief export to Meta Skill in /Users/rishi/Code/agent. For a selected run/case, emit Markdown that summarizes execution status, verdict evidence, final answer, token usage, trajectory highlights, failed assertions, and local evidence paths without leaking hidden criteria by default. Use canonical evidence files only. Update commands/report docs, tests, and run `npm test`, `npm run typecheck`, and `git diff --check`.
```

## Completed Items

- PR #20 / `6b4086da`: Eval runs use one execution source at a time, and no-skill runs stay manual control evidence.
- PR #21 / `03bc2b4d`: Execution status and verdict evidence are separate, so successful execution is not pass/fail proof.
- PR #22 / `5911f432`: Token evidence lives on case trial facts as the canonical summary source.
- `f03a2307`: Manual cross-run inspection stays separate from in-run eval execution and automated uplift language.
- `ec8485b7`: CLI help, dispatch, docs, and tests reflect the supported command surface.
- `57c4ebe0`: App Server recovery uses one explicit orchestration retry.
- `9e36774d`: Bounded client-side App Server event retention while keeping `rpc.jsonl` as the durable raw trace.
- `888cda97`: Evidence bundles keep token reporting and file-output reporting in their canonical locations.
- `65051c8f`: Case taxonomy uses one executable type axis.
- `b462f507`: Cases live in case folders.
- `a2d749ff`: Meta Skill eval runtime uses the compact current workbench shape.
- `fcd89eab`: Reports are printed Markdown or JSON projections.
- `fb475536`: TypeScript execution runs directly from `src/`.
- `2749e558`: Tightened skill-create approval gates.
- `2e0fb77b`: Flattened the Meta Skill workbench and docs around portable payload plus `.meta-skill/`.
- `b7d22d95`: Refined skill-create and skill-eval docs for consistency.
