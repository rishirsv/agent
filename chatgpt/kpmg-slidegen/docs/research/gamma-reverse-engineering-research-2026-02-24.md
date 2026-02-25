# Gamma Reverse Engineering Research (2026-02-24)

## Executive Summary
This report updates the earlier discovery with **logged-in Gamma traffic captures** (CDP-attached Chrome session) and reconstructs the most likely internal system-prompt pipeline.

High-confidence findings:
- Gamma generation is a **2-stage pipeline**: outline first, then deck-with-layout.
- Outline requests use `promptKey: "GenerateOutlineStory"` (model observed: `exa`).
- Deck generation requests use `promptKey: "GenerateDeckWithLayout"` plus `basePromptKey: "GenerateDeck2.5"` (model observed: `claude-opus-4-6`).
- Text-content UI levels map to backend `textAmount` exactly as:
  - `Minimal -> sm`
  - `Concise -> md`
  - `Detailed -> lg`
  - `Extensive -> xl`
- Card-count control (`numBullets` in outline) takes precedence over natural-language prompt hints.
- Markdown `---` separators are passed into deck generation inputs and influence card splitting behavior.

For `kpmg-slidegen`, the key move is to copy this architecture: **settings contract -> outline -> card writer/layout router -> QA**, with deterministic text scaling and split rules.

## Scope, Date, and Artifacts
- Date: Tuesday, February 24, 2026
- Project: `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen`
- Evidence root: `outputs/gamma-research/live/extracted/`

Primary trace sets used:
- `scenario-c-generate-run/`
- `scenario-e-regenerate-outline-3cards/`
- `detailed-run/`
- `minimal-outline/`
- `concise-outline/`
- `detailed-outline/`
- `extensive-outline/`

## Test Matrix (What Was Validated)
| Scenario | Action | Key Evidence |
|---|---|---|
| Baseline create | New generate flow request payload | `scenario-c-generate-run/resources/5ffaa71aa413990e13213559d4505187bcd7adb4.json` |
| Outline regenerate (count behavior) | Regenerate outline after card-count setting | `scenario-e-regenerate-outline-3cards/resources/99879a8275cd43b1d94d4afa0f28406e3762023e.json` |
| Full deck generation | Generate deck from prepared markdown input | `detailed-run/resources/5e6cf6a7155086b5674e7bdf95266e93e51639b7.json` |
| Runtime prompt/model flags | Prompt keys + model/basePrompt configuration | `detailed-run/resources/5c66810c65527c1273ecfff252d722a671a93eb7.json` |
| Minimal text level | UI toggle + regenerate outline | `minimal-outline/resources/c955df9caf24b60aa68bab6f1b8d7b4eccfea890.json` |
| Concise text level | UI toggle + regenerate outline | `concise-outline/resources/1ed11f395365a6d1981b01680f61780da7d91856.json` |
| Detailed text level | UI toggle + regenerate outline | `detailed-outline/resources/3b916e4e98385b046048005bec19dd768b1a6af6.json` |
| Extensive text level | UI toggle + regenerate outline | `extensive-outline/resources/33e22a580a8176b9b2df5fe8f17dffb43ba343df.json` |

## Confirmed Backend Pipeline
### Stage 0: Settings persistence (draft input)
Gamma updates draft settings via GraphQL mutation (`UpdateDocGenerationDraftInput`) before generation.

Observed settings fields include:
- `numCards`
- `textMode`
- `textAmount`
- `imageProvider`
- `cardDimensions`
- `defaultContentWidth`
- `styleTemplate`
- `scaleContentToFit`

### Stage 1: Outline generation
Gamma issues an outline request with:
- `promptKey: "GenerateOutlineStory"`
- `variables.topic`
- `variables.numBullets`
- `variables.textAmount`
- `variables.model` (observed: `exa`)

### Stage 2: Deck generation with layout
Gamma issues a second request with:
- `promptKey: "GenerateDeckWithLayout"`
- `variables.basePromptKey: "GenerateDeck2.5"`
- `variables.model: "claude-opus-4-6"` (observed run)
- `variables.textAmount`
- `variables.textMode`
- `variables.numCards`
- `variables.input` (markdown with separators)

### Stage 3: Telemetry and interaction tracking
`ai.interaction`, `ai.request.sent`, `ai.request.streamStart`, and outline/deck events show prompt key + interaction metadata and confirm stage boundaries.

## Prompt Keys and Model Routing (Observed)
From runtime flags and request payloads:
- `generateOutlinePrompt -> GenerateOutlineStory`
- `generateDeckPrompt -> GenerateDeckWithLayout`
- `generateDeckBasePrompt -> GenerateDeck2.5`
- `generateDeckPreserveBasePrompt -> GenerateDeck2.5Preserve`
- `generateDeckModel -> claude-opus-4-6`
- `generateDeckPreserveModel -> claude-sonnet-4-6`
- `generatorDefaultTextAmount -> md`

Additional enabled prompt families in flags include:
- `DetermineGenerateSettings`
- `GenerateOutlineSimple`
- `GenerateOutlineStory`
- `GenerateCardWithLayout`
- `GenerateCardLayoutVariants`
- `EditCardWithLayout`
- `GenerateSpeakerNotes`

This strongly indicates an internal prompt catalog rather than a single monolithic prompt.

## Text Content Setting Mapping (Fully Confirmed)
| UI Setting | `textAmount` | Evidence |
|---|---|---|
| Minimal | `sm` | `minimal-outline/resources/c955df9caf24b60aa68bab6f1b8d7b4eccfea890.json` |
| Concise | `md` | `concise-outline/resources/1ed11f395365a6d1981b01680f61780da7d91856.json` |
| Detailed | `lg` | `detailed-outline/resources/3b916e4e98385b046048005bec19dd768b1a6af6.json` |
| Extensive | `xl` | `extensive-outline/resources/33e22a580a8176b9b2df5fe8f17dffb43ba343df.json` |

Notes:
- Control mapping is deterministic in payloads.
- Output verbosity is **not perfectly monotonic on one sample** because of model variance and topic framing; treat `textAmount` as a budget signal, not a guarantee.

## Control Precedence and Behavior Rules (Observed)
### 1. Card count knob beats natural language
Prompt text asked for a “3-card” deck, but outline call used `numBullets: 10` in one run and produced 10 sections.

Evidence:
- `scenario-c-generate-run/resources/9eb4cb3168775fb924dbde9fe263629668b50f22.txt`

### 2. Outline regenerate is explicit
Changing cards/text settings does not implicitly rewrite outline; user action `Regenerate outline` triggers new outline request.

### 3. Markdown separators survive into deck generation
Deck request `variables.input` contains explicit `---` boundaries, indicating markdown structural hints are passed downstream.

### 4. Settings are staged through draft state
Mutation writes updated settings/content first; generation call then consumes those staged values.

## Most Likely Internal Prompt Stack (Reconstructed)
These are not exact leaked prompts; they are evidence-based reconstructions of likely system instructions.

### Prompt A: DetermineGenerateSettings
Purpose: normalize UX inputs into a generation contract.

Likely system instruction:
```text
You are a generation settings resolver.
Normalize user intent + UI controls into a strict settings object.
Honor explicit controls over natural-language hints.
Resolve conflicts with deterministic coercions and warnings.
Return JSON only.
```

Likely output schema:
```json
{
  "format": "deck",
  "numCards": 10,
  "textMode": "generate",
  "textAmount": "md",
  "audience": "",
  "tone": "",
  "language": "English (US)",
  "imageProvider": "none",
  "theme": "lavender",
  "cardDimensions": "fluid",
  "warnings": []
}
```

### Prompt B: GenerateOutlineStory
Purpose: create structured draft outline from topic/settings.

Likely system instruction:
```text
You are an outline planner for card-based decks.
Generate exactly numBullets sections.
Use markdown cards separated by ---.
Keep style consistent with textAmount and language.
Return concise preface + markdown draft.
```

Observed variables passed:
- `topic`, `numBullets`, `format`, `language`, `textAmount`, `model`

### Prompt C: GenerateDeckWithLayout (+ base prompt)
Purpose: transform outline/content into card-ready deck plan with layout guidance.

Likely system instruction:
```text
You are a deck generator with layout awareness.
Consume markdown input and preserve explicit card separators.
Produce card content compatible with visual layout constraints.
Apply textMode/textAmount settings and image policy.
Optimize for readability and balanced card density.
```

Observed composition:
- wrapper key: `GenerateDeckWithLayout`
- base key: `GenerateDeck2.5`
- model: high-capability model (observed `claude-opus-4-6`)

### Prompt D: Preserve-path variant
Purpose: same as deck generation, but with stricter rewrite constraints.

Observed routing signals:
- `generateDeckPreserveBasePrompt: GenerateDeck2.5Preserve`
- `generateDeckPreserveModel: claude-sonnet-4-6`

Likely instruction emphasis:
```text
Preserve source facts and structure unless layout safety requires minimal edits.
Do not add unsupported claims.
Prefer split-over-rewrite for overflow.
```

### Prompt E: Card-level edit/layout prompts
Based on enabled prompt families (`EditCardWithLayout`, `GenerateCardWithLayout`, etc.), Gamma likely has localized prompts for single-card operations after initial generation.

## Recreated System Prompt Pack for kpmg-slidegen
Use this prompt stack to emulate Gamma behavior while keeping deterministic QA.

### 1) `SYSTEM_SETTINGS_RESOLVER`
```text
You are the slide generation settings resolver.

Inputs:
- userPrompt
- markdownInput
- uiControls: {textMode, textContentLevel, numCards, splitPolicy, audience, tone, language, imagePolicy, theme}

Rules:
- Controls override natural-language hints.
- Map textContentLevel -> textAmount using: Minimal=sm, Concise=md, Detailed=lg, Extensive=xl.
- If textMode=preserve, forbid net-new facts.
- If splitPolicy=explicit, honor --- boundaries first.
- Emit warnings/coercions when controls conflict.

Return strict JSON only.
```

### 2) `SYSTEM_OUTLINE_STORY`
```text
You are a card-outline planner.

Rules:
- Produce exactly targetCards cards unless explicit separators define fixed boundaries.
- Output markdown only, with `---` between cards.
- Each card must have one takeaway and a title.
- Respect textAmount budget and audience/tone/language.
- Avoid unsupported facts.
```

### 3) `SYSTEM_DECK_WITH_LAYOUT`
```text
You are a layout-aware deck writer.

Rules:
- Convert markdown cards into block-structured slide specs.
- Preserve explicit `---` boundaries unless overflow mandates split.
- Prefer splitting cards over shrinking typography below readability thresholds.
- Enforce per-card max words/max bullets by textAmount and layout type.
- Return JSON slide specs only.
```

### 4) `SYSTEM_QA_EDITOR`
```text
You are a deck QA editor.

Rules:
- Validate consistency of terminology, tone, and units.
- Detect overflow risk per layout and request split when needed.
- Flag unsupported claims if textMode != generate.
- Return edits and warnings only (no prose).
```

## Detailed vs Extensive: Scaling Strategy for kpmg-slidegen
Observed Gamma behavior confirms the control path (`lg` vs `xl`), but model variance means you should implement explicit scaling budgets in your own pipeline.

Recommended deterministic budget table:

| `textAmount` | Target words/card | Bullet target | Bullet words | Intended use |
|---|---:|---:|---:|---|
| `sm` | 35-55 | 3-4 | 8-12 | executive skim |
| `md` | 55-85 | 4-5 | 10-14 | standard deck |
| `lg` | 85-125 | 4-6 | 12-18 | detailed diligence |
| `xl` | 120-170 | 5-7 | 14-24 | extensive appendix-style depth |

Dynamic scaler (recommended):
```text
effectiveWordBudget = baseByTextAmount
  * layoutComplexityMultiplier
  * (1 - visualCoverageRatio)

If estimatedWords > effectiveWordBudget:
  split card
Else:
  keep card
```

Recommended multipliers:
- `layoutComplexityMultiplier`: `0.85` (chart/table-heavy), `1.00` (text-focused)
- `visualCoverageRatio`: `0.15` to `0.50` based on image/chart footprint

## Practical kpmg-slidegen Implementation Checklist
1. Add `textContentLevel` as first-class input and map to `textAmount` (`sm/md/lg/xl`).
2. Split pipeline into explicit stages: settings resolver -> outline -> slide writer -> layout router -> QA.
3. Enforce control precedence: UI knobs over natural language.
4. Add deterministic overflow splitter keyed by layout + textAmount budgets.
5. Emit machine-readable warnings/coercions for conflicting inputs.
6. Keep markdown `---` as hard boundaries when split policy is explicit.

## Confidence by Finding
- High confidence:
  - Prompt keys used in requests
  - Text setting to `textAmount` mapping
  - 2-stage outline -> deck call pattern
  - Control precedence behavior (numBullets)
- Medium confidence:
  - Exact internal wording of each system prompt
  - Detailed preserve-path rewrite rules
- Lower confidence:
  - Hidden post-processing not visible in client-captured payloads

## Public References Used for Cross-Validation
- https://developers.gamma.app/docs/generate-api-parameters-explained
- https://developers.gamma.app/docs/create-from-template-parameters-explained
- https://developers.gamma.app/docs/understand-the-api-options
- https://help.gamma.app/en/articles/11016396-what-are-cards-in-gamma-and-how-to-do-they-work
- https://help.gamma.app/en/articles/7838093-how-do-i-create-a-new-presentation-document-or-webpage-in-gamma

## Implementation Ideas
This section compares the current `kpmg-slidegen` skill implementation to the Gamma findings and proposes concrete upgrades optimized for a **skill-driven workflow** (not a direct end-user GUI).

### Current Implementation (Detailed Read)
Key strengths already in place:
- Deterministic orchestration and QA generation in `generator/index.js`.
- Strong template contract enforcement, slot validation, and density scoring in `generator/runtime/render-deck.js`.
- Deterministic overflow/pagination heuristics in `generator/runtime/paginate.js`.
- Reliable run packaging and artifact reporting in `skills/kpmg-slides/scripts/run_kpmg_slides.sh`.
- Clear authoring constraints and expected workflow in `skills/kpmg-slides/SKILL.md`.

Primary gaps relative to Gamma-style flow:
- No explicit, first-class **settings resolver** stage before content creation.
- No automated **outline planning stage** that maps goals to slide types/slots before writing content.
- Density/overflow feedback is mostly **post-render**, not used as a pre-generation prompt contract.
- No native `textContentLevel -> textAmount` contract in the skill workflow.
- No structured conflict-coercion/warning object for contradictory instructions.

### Strongest Gamma Patterns to Adopt and Expand
Highest-leverage patterns from Gamma for this repo:
1. Explicit settings contract with control precedence.
2. Two-stage generation (outline first, then layout-aware deck generation).
3. Deterministic text scaling via `sm/md/lg/xl` controls.
4. Structured warnings/coercions instead of silent fallback.
5. Continuous loop from generation diagnostics back into next prompt cycle.

### Prioritized Implementation Ideas
| Priority | Idea | Where to Implement | Skill/UI-UX Benefit |
|---|---|---|---|
| P0 | Add a **Settings Resolver** stage that normalizes user intent into a strict object (`textMode`, `textAmount`, `numSlides`, split policy, audience/tone, image policy) | New helper in `skills/kpmg-slides/scripts/` plus wiring in `SKILL.md` workflow; optional generator acceptance in `generator/index.js` | Faster first-pass success in skill sessions; fewer clarifying back-and-forth turns; more predictable deck behavior from the first run |
| P0 | Add explicit `textContentLevel` (`minimal/concise/detailed/extensive`) mapped to `sm/md/lg/xl` | Skill input contract and deckSpec metadata; enforce in validation/density checks | Author can intentionally choose “board brief” vs “appendix depth” without rewriting prompts repeatedly |
| P0 | Introduce an **Outline Planner** that creates a slide-type/slot skeleton before content fill | New planning command (e.g., `--plan`) using `templates/kpmg-diligence/package/layouts.json` and schema refs | Reduces invalid slot combinations and layout mismatches; improves narrative flow before detailed writing starts |
| P0 | Add deterministic **conflict resolver + warning schema** (ignored fields, coerced values, reason) | Shared normalizer invoked before render; emit in QA JSON | Builds trust and transparency in skill outputs; users understand why the tool changed behavior instead of guessing |
| P1 | Export **prompt-ready hint bundles** from validation (`slotMetrics`, density gaps, repair suggestions) | Extend outputs from `generator/runtime/render-deck.js` and QA object in `generator/index.js` | Enables iterative “self-healing” skill loops: each run provides actionable instructions for the next run |
| P1 | Run **preflight QA** before expensive render/postprocess steps and classify findings into blocking vs advisory | Add preflight validation path in CLI and script wrapper | Quicker iteration cycles; less waiting on full render when slide contract issues are obvious early |
| P1 | Add markdown split grammar support (`---SLIDE---`, heading fallback) at the skill planning layer | Parser in skill script; emit canonical deckSpec sections | Lets users author naturally in markdown while keeping deterministic slide boundaries |
| P2 | Add targeted regeneration mode for problematic slides only (from QA findings) | Skill command to rewrite only specific slide indices/types | Better editing UX in skill mode: smaller corrective loops instead of regenerating full decks |
| P2 | Add “preserve mode” strictness profile for diligence/legal text | Settings resolver + content writer prompt policy | Reduces accidental factual drift when summarizing source material |

### Detailed Recommendation Notes (With Benefit Lens)
#### 1) Settings Resolver as a First-Class Stage (P0)
Implementation idea:
- Introduce a normalized settings payload before any deckSpec authoring/render:
  - `textMode`
  - `textAmount`
  - `numSlidesTarget`
  - `splitPolicy`
  - `audience`
  - `tone`
  - `language`
  - `imagePolicy`
  - `layoutDensityPreference`

Skill/UI-UX benefit:
- In a skill-driven workflow, this replaces ambiguous natural-language intent with a compact “control panel” object.
- Users get predictable outcomes quickly, which is the equivalent of good UI affordances in non-UI environments.

#### 2) Outline-First Authoring (P0)
Implementation idea:
- Add a planning command that outputs a skeleton `deckSpec`:
  - slide order
  - slide types constrained to supported layouts
  - expected slots per slide
  - section transitions

Skill/UI-UX benefit:
- Reduces cognitive load: users review structure first, then fill content.
- Mirrors Gamma’s strongest “structured draft first” experience without requiring a visual editor.

#### 3) Text Scaling Contract (`sm/md/lg/xl`) (P0)
Implementation idea:
- Adopt Gamma-like mapping:
  - `minimal -> sm`
  - `concise -> md`
  - `detailed -> lg`
  - `extensive -> xl`
- Tie each level to explicit per-layout budgets (words, bullets, line-length limits).

Skill/UI-UX benefit:
- Gives users reliable control over content depth, especially for “detailed vs extensive” asks.
- Prevents repeated manual edits to force the right density.

#### 4) Conflict Resolver and Transparent Warnings (P0)
Implementation idea:
- Normalize contradictory instructions before generation.
- Emit structured warnings/coercions in QA:
  - `ignored_parameter`
  - `coerced_value`
  - `unsupported_combo`

Skill/UI-UX benefit:
- Equivalent of inline form validation in a GUI: users understand exactly what changed and why.
- Decreases frustration from silent behavior changes.

#### 5) Preflight + Postflight QA Loop (P1)
Implementation idea:
- Preflight: run slot/density/contract checks before full PPTX build.
- Postflight: keep existing overlap/overflow diagnostics and classify findings by severity.

Skill/UI-UX benefit:
- Improves perceived speed and control in skill interactions.
- Users get “fix these first” guidance early, then polished QA after render.

#### 6) Prompt-Hint Feedback Loop (P1)
Implementation idea:
- Convert existing diagnostic outputs into prompt-ready “next run hints.”
- Include per-slide repair directives automatically.

Skill/UI-UX benefit:
- Makes iterative runs feel guided and intelligent.
- Reduces manual interpretation of raw QA JSON.

#### 7) Markdown-Native Planning (P1)
Implementation idea:
- Support explicit slide delimiters and heading-based fallback at the skill level.
- Convert markdown sections deterministically into slide skeletons.

Skill/UI-UX benefit:
- Users can author in familiar markdown while preserving deterministic generation behavior.
- Better portability from notes/transcripts to slide structure.

#### 8) Targeted Slide Regeneration (P2)
Implementation idea:
- Add a mode that regenerates only flagged slides based on QA issues.

Skill/UI-UX benefit:
- Much shorter correction loops.
- Keeps validated slides stable while fixing only what is broken.

### What to De-Prioritize from Gamma (Lower Relevance to Skill Mode)
- GUI-specific interactions (drag/drop card manipulation, visual inline controls).
- Credit/upsell UI mechanics.
- Broad image marketplace knobs unless directly needed by your workflows.

These do not materially improve a CLI/skill experience compared with settings normalization, outline planning, and deterministic QA loops.

### Suggested Execution Order
1. Implement `P0` settings resolver + text scaling contract + conflict warnings.
2. Implement `P0` outline planner that emits a slot-valid skeleton deckSpec.
3. Implement `P1` preflight QA and prompt-hint exports for iterative skill loops.
4. Implement `P2` targeted regeneration once the above telemetry and contracts are stable.

### Expected Outcome
Adopting these Gamma-inspired patterns in a skill-native way should produce:
- Higher first-pass deck quality.
- Fewer iterative correction turns.
- More predictable “detailed vs extensive” content behavior.
- Better trust through explicit constraints and transparent warnings.
- A more guided and less error-prone authoring experience without needing a full GUI.
