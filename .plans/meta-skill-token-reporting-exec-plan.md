# Add Real Token Usage To Meta Skill Reporting

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

## Purpose / Big Picture

Meta Skill already receives real token usage from Codex App Server during eval runs, but the reporting pipeline does not preserve or present that usage well enough for a rich HTML report.

After this change, `.meta-skill/evals/runs/<run-id>/report.json` and `report.html` expose actual token usage with the same spirit as `plugin-eval`: measured usage is separate from quality status, usage availability is explicit, and reports show clear totals/averages instead of raw JSON blobs.

This plan does not add token estimation, pricing, live watch mode, a local web server, or the future rich report app. It only moves real App Server token telemetry through the existing eval evidence and current `renderEvalReportHtml()` pipeline.

## Progress

- [x] (2026-06-03) Inspected the current Meta Skill token path in `plugins/meta-skill/src/app-server/runner.ts`, `plugins/meta-skill/src/eval/results.ts`, `plugins/meta-skill/src/report.ts`, and `plugins/meta-skill/src/models.ts`.
- [x] (2026-06-03) Compared the relevant `plugin-eval` approach in `/Users/rishi/Code/kpmg/.agents/plugins/plugin-eval/src/core/benchmark-events.js`, `src/core/benchmark.js`, `src/core/observed-usage.js`, and `src/renderers/html.js`.
- [x] (2026-06-03) Incorporated review feedback to pin aggregation semantics: final thread `total` is authoritative, candidate and release are never pooled, `usage.json` is canonical, and the HTML milestone is standalone.
- [x] (2026-06-03) Live smoke capture was not run because `src/app-server/live-smoke.test.ts` remains opt-in; fixture payloads cover observed `inputTokens`/`outputTokens`/`totalTokens` and tolerant cache/reasoning parsing was added without relying on unconfirmed fields.
- [x] (2026-06-03) Defined richer token usage model for per-turn evidence, side summaries, and run summaries in `plugins/meta-skill/src/models.ts`.
- [x] (2026-06-03) Preserved per-turn App Server `last` and cumulative `total` snapshots in assistant `turns.jsonl` rows and canonical `usage.json`.
- [x] (2026-06-03) Aggregated side usage into candidate/release run-level token summaries without pooling sides.
- [x] (2026-06-03) Rendered token usage in the static HTML report as readable totals, averages, input/output splits, and availability reasons instead of raw JSON.
- [x] (2026-06-03) Added tests for multi-turn cumulative totals, unavailable usage, existing orchestration/report compatibility, and rebuilt runtime behavior.
- [x] (2026-06-03) Updated `skill-eval` docs and `architecture.md`.
- [x] (2026-06-03) Ran `npm test`, `npm run typecheck`, `scripts/sync-plugins.sh`, and `git diff --check`.

## Current Token Flow

Current Meta Skill behavior:

1. `AppServerScenarioRunner.run()` starts an App Server thread for each scenario side.
2. `runTurn()` waits for `turn/completed`, then scans events since the turn started.
3. It finds the latest `thread/tokenUsage/updated` event for the current `threadId` and `turnId`.
4. It reads `tokenUsage.last`, normalizes `inputTokens`, `outputTokens`, and `totalTokens` into the existing `TokenUsage` shape, and returns that value.
5. `AppServerScenarioRunner.run()` overwrites the scenario-side `tokenUsage` on every turn, so a multi-turn side currently keeps only the final turn's latest `last` usage.
6. `recordScenarioResult()` writes that value to `results.jsonl` as `payload.token_usage`.
7. `buildRunReport()` copies it into each `RunReportSide.token_usage`.
8. `countTokenUsage()` only counts how many side rows have available total tokens. It does not compute total input/output/total tokens.
9. `renderEvalReportHtml()` renders `side.token_usage` as `JSON.stringify(...)` inside a table cell.

Current supporting types:

- `TokenMetric` is `{ available: true; value: number }` or `{ available: false; reason: string }`.
- `TokenUsage` contains `input_tokens`, `output_tokens`, and `total_tokens`.
- `RunReport.summary.token_usage` currently stores only `{ available: number; unavailable: number }`.
- `RunReportSide.token_usage` is typed as `unknown`, so report code cannot safely summarize or render it.

Observed consequence:

Meta Skill does have real App Server token telemetry, but the report cannot answer the useful questions: how many tokens did this run consume, which scenario was expensive, was usage present/partial/unavailable, and how did candidate compare with release?

## Plugin Eval Pattern To Reuse

`plugin-eval` does three things worth copying conceptually:

1. It normalizes usage from raw event payloads.
   - `benchmark-events.js` recursively finds usage-like objects, normalizes `input_tokens`, `output_tokens`, and `total_tokens`, and marks `usageAvailability` as `present` or `unavailable`.

2. It keeps usage as measured telemetry, not pass/fail proof.
   - `benchmark.js` stores `usage` and `usageAvailability` on each scenario result, then computes summary availability as `present`, `partial`, or `unavailable`.

3. It aggregates useful stats for reports.
   - `observed-usage.js` computes sample count, total/average/min/max for input, output, total, cached, and reasoning tokens.
   - `html.js` renders observed usage as human-readable report content instead of dumping raw event JSON.

Meta Skill should not copy `plugin-eval`'s static skill-budget estimation. For App Server evals, we already have live usage and should preserve that real signal.

## Desired Data Model

Add explicit types in `plugins/meta-skill/src/models.ts`.

```ts
export type TokenAvailability = "present" | "partial" | "unavailable";
export type TokenSampleUnit = "turn" | "scenario_side";

export interface TokenUsage {
  input_tokens: TokenMetric;
  output_tokens: TokenMetric;
  total_tokens: TokenMetric;
  cached_tokens?: TokenMetric;
  reasoning_tokens?: TokenMetric;
}

export interface TokenUsageSummary {
  availability: TokenAvailability;
  sample_unit: TokenSampleUnit;
  sample_count: number;
  unavailable_count: number;
  input_tokens: TokenStat;
  output_tokens: TokenStat;
  total_tokens: TokenStat;
  cached_tokens?: TokenStat;
  reasoning_tokens?: TokenStat;
  unavailable_reasons: string[];
}

export interface TokenUsageTurn {
  turn_id: string;
  index: number;
  usage: TokenUsage;
  cumulative_usage?: TokenUsage;
  source_event: "thread/tokenUsage/updated";
}

export interface RunTokenUsageSummary {
  by_side: Partial<Record<EvalSide, TokenUsageSummary>>;
  availability_counts: {
    available: number;
    unavailable: number;
  };
}
```

`TokenStat` should include `total`, `average`, `min`, and `max`. It should ignore unavailable samples and retain the unavailable count at the parent summary.

For run-level summaries, the sample unit is `scenario_side`: each candidate or release side with present usage is one sample. Unavailable sides are excluded from stats and counted in `unavailable_count`.

Do not pool candidate and release usage into one number. Run-level summaries must be keyed by side: candidate usage beside release usage. Scenario summaries expose both sides rather than summing them.

For scenario-side totals, the authoritative value is the App Server `tokenUsage.total` from the final turn that reported usage. Per-turn `tokenUsage.last` is retained for transcript and turn-level display only. Do not sum per-turn `last` values to compute the side total.

`usage.json` is the canonical structured token evidence file. `turns.jsonl` may carry usage on assistant rows for transcript rendering, and `results.jsonl.payload.token_usage` may carry a denormalized side summary for legacy/index paths, but `buildRunReport()` must prefer `usage.json` whenever it exists.

## Plan Of Work

### Milestone 0 - Capture the real App Server payload shape

Before changing the normalizer, run or adapt the live App Server smoke path to capture one real `thread/tokenUsage/updated` event. Record the observed payload shape in `Outcomes & Retrospective` or `Surprises & Discoveries`.

Use that captured payload to decide which optional detail fields are real. Do not guess cached/reasoning field names beyond tolerant fallback parsing.

### Milestone 1 - Normalize App Server token usage without losing information

Update `plugins/meta-skill/src/app-server/runner.ts`.

`runTurn()` should return both:

- the current turn's `last` usage
- the App Server thread's `total` usage when present

The returned side-level authoritative total should come from the final reported cumulative `total`, not from summing per-turn `last`.

The normalizer should accept App Server camelCase fields:

- `inputTokens`
- `outputTokens`
- `totalTokens`

It should also tolerate snake_case fields for future-proofing and parity with `plugin-eval`:

- `input_tokens`
- `output_tokens`
- `total_tokens`

If cache/reasoning details are present, preserve them:

- `cachedTokens` or `input_token_details.cached_tokens`
- `reasoningTokens` or `output_tokens_details.reasoning_tokens`

Only implement optional cache/reasoning extraction after Milestone 0 confirms the real App Server payload shape or after adding tolerant tests for both observed and compatibility shapes.

If no token event appears for a turn, write an unavailable usage record with a precise reason. Do not omit usage.

### Milestone 2 - Preserve per-turn usage in side evidence

Update side evidence under:

```text
.meta-skill/evals/runs/<run-id>/scenarios/<scenario>/<side>/
```

Add token usage to assistant rows in `turns.jsonl`:

```json
{"role":"assistant","index":0,"turn_id":"...","token_usage":{...},"cumulative_token_usage":{...}}
```

Also write a small `usage.json` next to `turns.jsonl`:

```json
{
  "schema_version": 1,
  "availability": "present",
  "turns": [...],
  "summary": {...}
}
```

Rationale: `turns.jsonl` keeps usage close to transcript rendering, while `usage.json` gives the report builder a stable structured file. This avoids reparsing raw `rpc.jsonl` for ordinary report rendering.

`usage.json` is canonical. The other copies are deliberate denormalizations for transcript display and legacy report/index compatibility.

### Milestone 3 - Store side summaries in results and report model

Update `recordScenarioResult()` so `payload.token_usage` receives the side-level summary, not only a final turn snapshot.

Update `RunReportSide.token_usage` from `unknown` to the explicit summary type.

Update `buildRunReport()` to read `usage.json` when present. For older runs without `usage.json`, fall back to `results.jsonl.payload.token_usage` and normalize that legacy shape.

This keeps old run reports readable while making new runs richer.

Bump `report.json` `schema_version` because `summary.token_usage` changes from availability counts to a richer object. The raw compatibility surface remains the saved run evidence, not the derived report.

### Milestone 4 - Aggregate run-level token usage

Replace `countTokenUsage()` with a real aggregation:

- run-level availability by side: `present`, `partial`, or `unavailable`
- sample count by side: number of scenario-side rows with usable token totals
- unavailable count and reasons
- total/average/min/max for input/output/total tokens
- optional cached/reasoning stats when present

Keep a compatibility field if useful:

```ts
availability_counts: { available: number; unavailable: number }
```

But the primary report model should expose meaningful stats.

Never add candidate and release usage together. In release comparisons, candidate and release are separate side summaries.

### Milestone 5 - Render token usage in rich static HTML

Update the current `renderEvalReportHtml()` directly. This milestone must merge independently of any future rich report app redesign.

At minimum, the HTML should show:

- run token totals keyed by side
- average tokens per scenario side
- input/output split
- usage availability: present, partial, unavailable
- scenario-side token cards or table columns
- unavailable reasons

For release comparisons, show candidate and release token totals side by side. Do not label lower token usage as better unless quality/readiness is also acceptable.

Remove raw `JSON.stringify(side.token_usage)` from the visible table.

### Milestone 6 - Tests

Add or update tests in:

- `plugins/meta-skill/src/app-server/runner.test.ts`
- `plugins/meta-skill/src/evals-app-server.test.ts`
- `plugins/meta-skill/src/reporting.test.ts`

Test cases:

1. Single-turn App Server event records per-turn and side summary usage.
2. Multi-turn scenario uses the final cumulative thread `total` for side totals while retaining per-turn `last` usage.
3. Missing token event records explicit unavailable reason.
4. Mixed candidate/release availability produces run-level `partial`.
5. HTML report contains readable token totals and no raw JSON token blob.
6. Legacy run with only `results.jsonl.payload.token_usage` still renders.

### Milestone 7 - Docs And Runtime

Update:

- `plugins/meta-skill/skills/skill-eval/SKILL.md`
- `research/tessl/review/review-files.md`
- `plugins/meta-skill/architecture.md`

Because source `skills/` changes trigger root sync requirements, run `scripts/sync-plugins.sh` after the docs and runtime are updated.

Validate native TypeScript runtime:

```bash
cd plugins/meta-skill
npm test
npm run typecheck
```

Then run from repo root:

```bash
scripts/sync-plugins.sh
git diff --check
```

## Acceptance Criteria

- New eval runs write per-turn token usage evidence.
- Multi-turn side summaries use the final reported cumulative thread `total` as authoritative, with per-turn `last` retained for transcript display.
- Candidate and release usage are reported side by side and never pooled into one total.
- `report.json` exposes run-level token stats, side-level summaries, and availability.
- `report.html` shows readable token usage suitable for Codex Browser inspection.
- Token usage remains separate from readiness/pass/fail claims.
- Missing App Server metrics are explicit and visible.
- Existing tests pass, and plugin mirrors are synced if skill docs changed.

## Non-Goals

- No token-price calculation.
- No static token estimation.
- No local server or live watch mode.
- No trigger-routing or baseline/no-skill proof.
- No judging based on low token usage alone.
- No broad CLI command consolidation.

## Surprises & Discoveries

- `plugin-eval` benchmarks use Codex CLI JSON streams and extract `turn.completed.usage` style payloads, while Meta Skill uses Codex App Server `thread/tokenUsage/updated` events.
- Meta Skill currently sets token usage to `tokenUsage.last` for the latest turn that emitted usage. That means multi-turn scenarios undercount if each turn has its own `last` usage.
- Meta Skill already has an unavailable-token helper. The improvement is to use it per turn and per side, not only for whole execution failures.
- The review pinned an important correctness rule: server-provided cumulative `total` should win over local summing because cached/context accounting can make per-turn summation drift from App Server's own accounting.

## Decision Log

- Decision: Use real App Server token telemetry, not estimates.
  Rationale: The goal is reporting measured eval cost. Estimation is a separate budget-analysis feature and would be less truthful for completed runs.
  Date/Author: 2026-06-03 / Codex

- Decision: Use the final reported thread `total` as the authoritative scenario-side total.
  Rationale: App Server already computes cumulative usage. Summing per-turn `last` values can drift from server accounting, especially when cached or context tokens are involved.
  Date/Author: 2026-06-03 / Codex

- Decision: Keep candidate and release token usage separate at every summary layer.
  Rationale: Candidate and release are two different executions. Pooling them produces a meaningless number and obscures comparison.
  Date/Author: 2026-06-03 / Codex

- Decision: Store usage in `usage.json` and attach usage to assistant `turns.jsonl` rows.
  Rationale: The rich report needs transcript-adjacent usage and a stable structured file. This avoids making the report renderer parse raw RPC lines for normal operation.
  Date/Author: 2026-06-03 / Codex

- Decision: Report availability as present, partial, or unavailable.
  Rationale: This matches `plugin-eval`'s useful pattern and avoids hiding missing telemetry behind zeros.
  Date/Author: 2026-06-03 / Codex

- Decision: Make the HTML milestone standalone against the current renderer.
  Rationale: Token reporting should be mergeable before the broader rich report app exists. The immediate value is replacing the raw JSON cell with readable token UI.
  Date/Author: 2026-06-03 / Codex

## Outcomes & Retrospective

Implemented.

New side evidence writes `usage.json`:

```json
{
  "schema_version": 1,
  "availability": "present",
  "turns": [
    {
      "turn_id": "turn-1",
      "index": 0,
      "usage": { "input_tokens": "...", "output_tokens": "...", "total_tokens": "..." },
      "cumulative_usage": { "input_tokens": "...", "output_tokens": "...", "total_tokens": "..." },
      "source_event": "thread/tokenUsage/updated"
    }
  ],
  "summary": {
    "availability": "present",
    "sample_unit": "scenario_side",
    "sample_count": 1,
    "unavailable_count": 0,
    "input_tokens": { "total": 10, "average": 10, "min": 10, "max": 10 },
    "output_tokens": { "total": 14, "average": 14, "min": 14, "max": 14 },
    "total_tokens": { "total": 24, "average": 24, "min": 24, "max": 24 },
    "unavailable_reasons": []
  }
}
```

`report.json` is now schema version 2. `summary.token_usage` contains `{ by_side, availability_counts }`, where `by_side.candidate` and `by_side.release` are separate `TokenUsageSummary` objects. Scenario side rows expose the side summary, and `buildRunReport()` prefers `usage.json` while still normalizing legacy `results.jsonl.payload.token_usage` snapshots.

`report.html` now renders a Token Usage section with side-keyed availability, sample counts, totals, averages, input/output splits, and unavailable reasons. Scenario rows show compact readable token totals and link to `usage.json`; raw visible `JSON.stringify(side.token_usage)` was removed.

Validation run:

- `npm test` in `plugins/meta-skill`
- `scripts/sync-plugins.sh` from repo root
- `git diff --check`

The live App Server smoke test was not run because it is explicitly skipped unless `META_SKILL_LIVE_APP_SERVER=1` and local App Server auth are available. The implemented parser covers the fixture App Server shape `{ inputTokens, outputTokens, totalTokens }`, snake_case compatibility, and tolerant optional cache/reasoning fields.
