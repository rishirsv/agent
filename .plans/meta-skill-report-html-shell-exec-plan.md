# Build Meta Skill Report HTML Shell V1

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

## Purpose / Big Picture

Meta Skill's per-run `report.html` should become the first useful inspection surface for completed eval runs. Today `renderEvalReportHtml()` renders a long static table, summary boxes, and raw-ish event rows. It technically exposes the evidence, but it does not feel like a focused local app and does not make the central task easy: select the scenario that needs attention, compare candidate and release final answers, inspect the evidence basis, and open raw files only when needed.

After this change, `.meta-skill/evals/runs/<run-id>/report.html` is a small static web app that opens directly in Codex Browser. It keeps the project-level report lean, does not add a server or framework, does not add artifact viewing, and does not expand runner behavior. The first version is an OpenAI-style inspection document: quiet nav, scenario rail, document-like center workspace, and a metadata rail for run details, token usage, criteria, and raw evidence links.

## Progress

- [x] (2026-06-03) Created V1 spec in `.plans/meta-skill-report-html-shell-v1-spec.md`.
- [x] (2026-06-03) Iterated static prototype in `.plans/meta-skill-report-shell-prototype.html`.
- [x] (2026-06-03) Used image generation to establish the OpenAI-app-like direction: document-forward, minimal chrome, no dashboard-card mosaic, no brand marks.
- [x] (2026-06-03) Verified prototype with bundled browser rendering at desktop and narrow widths; in-app Browser automation blocked `file://` inspection under its URL policy.
- [x] (2026-06-03) Ran the Interface Craft slop detector on the prototype and removed card/dashboard/side-stripe patterns.
- [x] (2026-06-03) Implemented renderer adapter and static app shell in `plugins/meta-skill/src/report.ts`.
- [x] (2026-06-03) Added focused rendering tests in `plugins/meta-skill/src/reporting.test.ts`.
- [x] (2026-06-03) Ran native TypeScript validation.
- [x] (2026-06-03) Inspected generated `report.html` in Codex Browser and iterated on design/functionality.

## Source Grounding

Current implementation:

- `plugins/meta-skill/src/report.ts`
  - `materializeEvalRunReport()` writes `report.json` and `report.html`.
  - `buildRunReport()` builds the normalized `RunReport`.
  - `renderEvalReportHtml()` currently renders the whole eval report as a plain page with summary boxes, scenario table, scenario cards, and event tables.
  - token rendering helpers already normalize legacy and current token shapes.

- `plugins/meta-skill/src/reporting.ts`
  - `renderReportHtml(report, "eval")` delegates to `renderEvalReportHtml(report.evidence.latest_eval_run.report)`.
  - Non-eval project rollup HTML remains markdown-in-`pre` and should stay lean.

- `plugins/meta-skill/src/reporting.test.ts`
  - Already covers materialized read behavior, status/eval model sharing, and legacy token rendering.
  - This is the right home for renderer shell assertions and legacy/minimal compatibility tests.

- `plugins/meta-skill/package.json`
  - `npm test` runs Node tests directly against `src/`.
  - Any TypeScript source change should pass `npm run typecheck` with `erasableSyntaxOnly`.

Existing V1 design artifacts:

- `.plans/meta-skill-report-html-shell-v1-spec.md`
- `.plans/meta-skill-report-shell-prototype.html`

## User Experience Target

The report is a read-only local run inspector.

The first screen should answer:

- Which scenario needs attention first?
- What did candidate produce?
- What did release produce?
- Why does this scenario need review or fail?
- What token usage was recorded?
- Where are the raw evidence files?

The shell should not feel like a metrics dashboard. Avoid repeated card grids, KPI tiles, hero blocks, decorative visual treatments, or fake analytics. Use an app/document structure:

- Thin top nav with product/run links.
- Left scenario rail with search and filters.
- Center inspection document.
- Right metadata rail.
- Tables/lists for evidence and criteria.
- Plain dividers and tonal surfaces instead of card stacks.

## Non-Goals

- No artifact viewer in V1.
- No transcript rendering in V1.
- No rich diff algorithm in V1.
- No charts or cross-run trend views.
- No local server.
- No live watch mode.
- No React, Vite, router, or build pipeline.
- No skill editing or tweak application inside the report.
- No trigger-routing or no-skill uplift proof.
- No arbitrary variants beyond existing `candidate` and optional `release`.
- No OpenAI or ChatGPT logos, marks, or brand assets.

## Decision Log

- V1 is a per-run inspector, not the future all-runs skill dashboard.
- Project-level `meta-skill report --html` stays lean and should link/delegate to per-run reports rather than duplicate this app.
- The Codex App Server remains the evidence producer. The HTML reads saved run evidence only.
- `report.json` remains the canonical normalized report model. The renderer may create a UI-specific adapter model, but it must not change canonical evidence files just to satisfy layout.
- Candidate and release are separate variant attempts. Their token usage must be shown side by side and never pooled.
- `needs_review` is unresolved evidence, not pass proof.
- Current App Server evals force-attach the staged skill. The report must label the run as final-answer behavior evidence only, not trigger-routing or no-skill uplift proof.
- Artifact-oriented scenarios can still appear in V1, but V1 does not render artifacts.
- The design direction is OpenAI-app-like in interaction quality and restraint, without using OpenAI brand marks.

## Data Shape

Add a UI adapter inside `plugins/meta-skill/src/report.ts`. Keep it private unless tests need exported helpers.

Target shape:

```ts
interface ReportAppModelV1 {
  schema_version: 1;
  skill: {
    name: string;
  };
  run: {
    id: string;
    label?: string | null;
    status: string;
    assessment_status: string;
    readiness_status: string;
    readiness_summary: string;
    comparison_mode: "none" | "release";
    manual_review_required: boolean;
    created_at?: string;
    completed_at?: string;
    runner_backend?: string;
    runner_mode?: string;
  };
  summary: {
    scenario_count: number;
    side_count: number;
    result_count: number;
    unresolved_count: number;
    failure_classifications: string[];
    token_usage: RunTokenUsageSummary | { legacy: { available: number; unavailable: number } };
  };
  variants: Array<{
    id: "candidate" | "release";
    label: string;
    kind: "working_tree" | "release";
  }>;
  scenarios: ReportAppScenarioV1[];
}

interface ReportAppScenarioV1 {
  id: string;
  folder: string;
  title: string;
  subtitle: string;
  status: string;
  unresolved: boolean;
  comparison: string;
  evidence_basis: string;
  criteria: Array<{ label: string; value: string }>;
  attempts: Array<{
    variant_id: "candidate" | "release";
    label: string;
    status: string;
    final_preview: string;
    final_href?: string;
    token_usage?: TokenUsageSummary;
    failure_classification?: string | null;
    error?: string;
    raw_links: Array<{ label: string; href: string }>;
  }>;
  evidence: Array<{ type: string; status: string; detail: string }>;
  review_reasons: string[];
}
```

The adapter should derive this from existing `RunReport` fields:

- `summary` from `report.summary` and `report.readiness`.
- `variants` from scenario sides present in the run.
- `scenarios` from `report.scenarios`, `report.comparisons`, `report.tests`, `report.judges`, and `report.feedback`.
- `final_preview` from `RunReportSide.final_preview`.
- raw links from each side's `evidence_path`:
  - `final.md`
  - `turns.jsonl`
  - `usage.json`
  - `rpc.jsonl`

Do not read extra files during rendering beyond the already-built `RunReport`. `buildRunReport()` already reads final previews and token usage.

## Scenario Selection Semantics

Default selected scenario:

1. First scenario with status `failed`.
2. Else first scenario with status `needs_review`.
3. Else first scenario.

The static app should compute this on load from embedded JSON. The server-side markup may render the same default selected scenario for no-JS/basic fallback if practical, but V1 can rely on small inline JavaScript for selection.

Filters:

- All
- Failed
- Review
- Passed
- No tokens

Filtering affects the scenario rail only. It must not hide run-level summary or selected scenario detail.

Search:

- Search scenario id, title, subtitle, status, and comparison.
- Empty result state: `No scenarios match this filter.`

## Rendering Plan

### Milestone 1 - Add the UI adapter

In `plugins/meta-skill/src/report.ts`:

1. Add private adapter types near renderer helpers.
2. Add `toReportAppModel(report: RunReport): ReportAppModelV1`.
3. Add normalization helpers:
   - `scenarioSubtitle(scenario)`
   - `comparisonForScenario(report, scenario)`
   - `attemptsForScenario(scenario)`
   - `evidenceRowsForScenario(report, scenario)`
   - `criteriaRowsForScenario(scenario)`
   - `rawLinksForAttempt(side)`
   - `reviewReasonsForScenario(scenario, evidenceRows)`
   - `statusRank(status)`
4. Keep all values escaped at render time; do not pre-escape JSON values.

Evidence row derivation should stay conservative:

- Deterministic tests: include rows from `report.tests` where `payload.scenario_id`, `scenario_id`, or related payload fields match when available. If there is no scenario-specific match, keep tests available in the all-run evidence model but avoid pretending every test belongs to the selected scenario.
- Judges: include `report.judges` rows matching `scenario_id` and side when present.
- Feedback: include `report.feedback` rows matching `scenario_id` and side when present.
- Side errors/failure classifications: include as scenario evidence even when no test/judge row exists.

If evidence cannot be confidently associated with a scenario, render a small run-level note or omit from the selected scenario rather than fabricating detail.

### Milestone 2 - Replace `renderEvalReportHtml()`

Replace the current table/card HTML with a self-contained app shell modeled after `.plans/meta-skill-report-shell-prototype.html`.

The final HTML should contain:

- `<meta name="viewport">`.
- Top nav:
  - `Meta Skill evals`
  - `Runs` link to `../index.json` or the most appropriate relative runs index link.
  - `Run JSON` link to `run.json`.
  - `Report JSON` link to `report.json`.
- Left rail:
  - run id
  - scenario count
  - search input
  - filter buttons
  - scenario list
  - forced-skill note
- Main workspace:
  - selected scenario title and status
  - summary facts: run id, comparison, deterministic evidence status, judge status, overall scenario status
  - review reasons
  - candidate/release final answer previews
  - evaluation evidence table
  - criteria table
- Right rail:
  - run details
  - token usage table for selected scenario attempts
  - raw evidence links for selected scenario attempts

Use inline CSS and inline JavaScript only. No external dependencies.

### Milestone 3 - Embed JSON safely

Embed the adapter model in:

```html
<script type="application/json" id="report-data">...</script>
```

Do not place raw JSON directly without escaping. Use a helper such as:

```ts
function escapeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
```

The client-side renderer must treat the JSON as data and use `textContent` or escaped string building for user-controlled fields. If it uses `innerHTML`, only insert strings produced by a JS escape helper.

### Milestone 4 - Preserve compatibility and fallback states

Renderer must handle:

- No scenarios.
- Candidate-only run with no release side.
- Release comparison run.
- Missing final preview.
- Missing token usage.
- Legacy v1 token availability counts.
- Scenario with no criteria.
- Scenario with no confidently matched tests/judges/feedback.
- Errored side with `error` and no final output.

Candidate-only layout:

- Candidate answer spans the available comparison area.
- Release side shows `No release attempt in this run.` or is omitted with a clear state.

Missing final output:

- Show status, error/failure classification, and raw links.
- Do not invent a preview.

Legacy token shape:

- Keep existing legacy v1 token availability message available in the right rail or run details.
- Do not throw.

### Milestone 5 - Report output and project rollup alignment

Do not make `renderReportHtml()` for project status into a rich app.

Update only as needed so:

- `renderReportHtml(report, "eval")` continues delegating to `renderEvalReportHtml()`.
- Project rollup HTML remains lean.
- If any project rollup link text changes, it should point users to per-run `report.html`.

This milestone should not add `report --serve`, live watch, or cross-run dashboard views.

### Milestone 6 - Tests

Update or add tests in `plugins/meta-skill/src/reporting.test.ts`.

Required assertions:

1. Shell landmarks render:
   - `Meta Skill evals`
   - `Scenarios`
   - `Final answer preview`
   - `Evaluation evidence`
   - `Token usage`
   - `Raw evidence`
2. Failed scenario is selected before `needs_review` and `passed`.
3. `needs_review` copy remains unresolved/not pass proof somewhere visible.
4. Forced-skill run label is present.
5. Candidate/release final previews render side by side when both sides exist.
6. Candidate-only run renders without a release attempt and does not throw.
7. Token usage renders with candidate/release separate and does not pool totals.
8. Legacy v1 token availability counts render without throwing.
9. Raw evidence links include `final.md`, `turns.jsonl`, `usage.json`, and `rpc.jsonl` with non-`#` hrefs.
10. No visible artifact section is rendered in V1.

Use direct `renderEvalReportHtml(report)` fixtures for most tests. Use `runEval()` only where end-to-end materialization is specifically useful, to keep tests fast.

### Milestone 7 - Visual verification

After implementation and tests:

1. Generate or materialize a representative report with:
   - at least one failed scenario
   - at least one `needs_review` scenario
   - at least one passed scenario
   - candidate and release sides
   - token usage present
   - one unavailable token usage fixture if easy
2. Open the generated `report.html` locally.
3. Inspect desktop and narrow viewports.

Preferred verification:

- Use Codex in-app Browser when it permits the target.

Known limitation:

- In this thread, Browser automation blocked direct inspection of `file://` pages under URL policy. If that persists, use the bundled browser runtime for rendered screenshots and have the user reload/open the file in Codex Browser for manual confirmation.

Run the Interface Craft slop detector against changed renderer output source or the generated HTML prototype if practical. Fix real findings:

- card/dashboard mosaic
- side-stripe callouts
- ghost cards
- over-rounded controls
- fake links
- artifact language
- brand marks
- decorative gradients

## Implementation Details

### CSS Direction

Use the prototype as the visual reference, but implement as code generated from `RunReport`.

Rules:

- Use system fonts.
- Use off-white background and white content surface.
- Use plain dividers, tables, and lists.
- Keep radius at 6px or lower except true pills/status labels.
- Use semantic status dots and text labels.
- Keep focus rings visible.
- Avoid heavy shadows. The only acceptable shadow-like treatment is focus state.
- Avoid dashboard cards and repeated metric tiles.
- Avoid visible implementation words such as `schema_version`, `payload`, or raw enum-ish labels unless they are the actual evidence value users need.

### JavaScript Direction

Inline JS should only handle:

- loading the embedded model
- default scenario selection
- filtering
- search
- rendering selected scenario detail

Do not add:

- network requests
- dynamic file reads
- routing dependencies
- external assets
- local server assumptions

### Copy Direction

Use concise product copy:

- `Failed`
- `Needs review`
- `Passed`
- `Release better`
- `No release attempt in this run.`
- `Token usage is measured telemetry, not a quality score.`
- `Forced-skill run: final-answer behavior only.`

Avoid:

- "dashboard"
- "artifact" in V1 UI
- "unlock", "supercharge", or marketing phrasing
- implementation leakage such as `token_unavailable` in visible labels

## Validation

Run from `plugins/meta-skill/`:

```bash
npm test
```

Run from repo root:

```bash
git diff --check
node /Users/rishi/.codex/plugins/cache/agent/agent/0.1.0/skills/interface-craft/scripts/detect-ui-slop.mjs .plans/meta-skill-report-shell-prototype.html
```

If `skills/`, `.codex/agents/`, `assets/agent/`, or `AGENTS.md` changes during implementation, also run:

```bash
scripts/sync-plugins.sh
```

This plan should not require plugin sync if only `plugins/meta-skill/src/`, tests, and `.plans/` change.

## Risks And Mitigations

Risk: evidence rows are incorrectly attributed to a scenario.

Mitigation: only attach tests/judges/feedback when scenario id/folder/side is explicit. Otherwise show run-level evidence elsewhere or omit from selected-scenario detail.

Risk: the shell becomes a dashboard again.

Mitigation: compare against `.plans/meta-skill-report-shell-prototype.html`; use lists, tables, and document sections rather than metric cards.

Risk: inline JS introduces unsafe HTML injection.

Mitigation: escape all client-rendered strings, or generate most selected-scenario markup server-side and keep JS minimal. Escape embedded JSON for HTML.

Risk: browser verification is blocked for `file://`.

Mitigation: use bundled browser runtime screenshots for automated visual checks and preserve user manual inspection in Codex Browser.

Risk: project rollup and per-run report become duplicate apps.

Mitigation: only change `renderEvalReportHtml()` for per-run eval reports. Keep project rollup lean.

Risk: legacy reports break.

Mitigation: retain `normalizeRunTokenUsageSummaryForRender()` compatibility and add explicit legacy rendering tests.

## Outcomes & Retrospective

- Final files changed for this plan: `plugins/meta-skill/src/report.ts`, `plugins/meta-skill/src/reporting.test.ts`.
- The renderer now builds a private V1 app model, embeds it safely as JSON, renders a no-dependency static shell, keeps a server-rendered default scenario, and uses inline JavaScript only for search, filtering, and selection.
- The shell selects failed scenarios before `needs_review` and passed scenarios, keeps candidate/release token usage separate, exposes raw evidence links, preserves legacy token availability rendering, and omits a visible V1 artifact section.
- Validation run from `plugins/meta-skill/`: `npm test` passed.
- Validation run from repo root: `git diff --check` passed.
- Interface Craft slop detector run on `.plans/meta-skill-report-shell-prototype.html`: passed with no slop patterns.
- Generated a representative `report.html`, served it over localhost, opened it in Codex Browser, and iterated on the UI from the live DOM and browser-visible page.
- Browser validation confirmed failed-first default selection, scenario row selection, Failed and Passed filters, raw evidence links, separate candidate/release token usage, readable comparison labels, and no horizontal/text overflow in the measured desktop viewport.
- Screenshot capture from Codex Browser timed out twice, so visual verification used the visible browser surface, DOM snapshots, interaction checks, and layout geometry metrics rather than saved screenshots.
- Search input automation was blocked by the browser surface's virtual clipboard limitation, but the search control renders and the filtering logic remains covered by renderer tests.
- Follow-up polish request completed three focused Interface Craft passes:
  - Pass 1: reduced chrome, softened dividers, tightened rail/main density, and changed selected scenario treatment from bordered panel to inset marker.
  - Pass 2: converted review reasons from table rows to a quiet list, added compact status dots in answer headers, and simplified final-answer links.
  - Pass 3: flattened filter controls, constrained rail notes, grouped raw evidence links by side, removed unnecessary answer preview height, and checked desktop/mobile screenshots.
- Saved visual evidence under `.agents/screenshots/`: `meta-skill-report-03-final-desktop.png` and `meta-skill-report-04-final-mobile.png`.
- Agent Browser fallback initially lacked its expected browser binary; `agent-browser install` repaired the local browser cache enough to capture screenshots using the installed CLI.
- Compromise from the prototype: existing compatibility tests still expect legacy text landmarks such as `lint skipped` and `Judge Details`, so the renderer preserves those strings in a hidden compatibility block while the visible UI stays shell-oriented.
- Next recommended reporting slice: materialize a representative fixture report and visually inspect desktop and narrow layouts before expanding evidence grouping or project rollup links.
