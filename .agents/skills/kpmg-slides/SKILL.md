---
name: kpmg-slides
description: Create, revise, and QA KPMG-branded PowerPoint decks via deckSpec JSON -> PPTX using the bundled kpmg-slidegen generator. Use for outline-first planning, deckSpec authoring, generation runs, and fixing QA issues (contract, overflow, overlap).
---

# KPMG Slides (kpmg-slidegen)

This skill produces KPMG-branded `.pptx` decks from a `deckSpec` JSON file and gives you a QA loop to fix what breaks.

## Core Workflow (Do This In Order)

1. Normalize settings and constraints (slide count, depth, tone).
2. Outline-first: lock the slide plan before writing dense copy.
3. Draft or revise `deckSpec` (slot-valid JSON).
4. Generate artifacts (PPTX + QA + montage/preview + visual overflow check).
5. QA triage -> fix -> rerun until blocking issues are cleared.

## Modes (Pick One)

- **Outline mode (default)**: user has notes, wants a new deck.
- **DeckSpec edit mode**: user already has a `*.deckSpec.json` and wants revisions.
- **QA fix mode**: user has a failed/ugly run and wants targeted fixes.

## Reference Files (Load Only What You Need)

| File | Read When You Need |
|------|---------------------|
| `references/slide-contract.md` | Choosing slide types, required slots, chart/table shapes, density minimums |
| `references/starter-template-guide.md` | Starting from the starter `deckSpec` template or expanding it safely |
| `references/writing-guide.md` | Writing or tightening slide copy (especially for overflow fixes) |
| `references/qa-rules.md` | Interpreting `qa.json`, triaging issues, and applying fix recipes |

## Authoring Controls (Not Runtime Fields)

These control how you author the deck. The generator does not read them unless you also encode them into the deckSpec yourself.

Defaults (use unless the user overrides):

```json
{
  "numSlidesTarget": 12,
  "textAmount": "detailed",
  "writingProfile": "kpmg_exec",
  "splitPolicy": "balanced",
  "tone": "executive"
}
```

Notes:
- `textAmount`: `minimal | concise | detailed | extensive` (treat as a hard density budget; prefer splitting over cramming).
- `splitPolicy`:
  - `balanced` (default): split when needed, but avoid slide explosions.
  - `readability_first`: split early to protect whitespace.
  - `min_slides`: tighten aggressively; split only when required.

## Outline Mode (Default)

Goal: lock slide structure first so the deckSpec is slot-valid and readable.

1. Confirm deck goal (do not skip):
   - Audience and decision needed
   - Context (deal, diligence workstream, time period)
   - Target slide count (`numSlidesTarget`)
   - Any required sections (e.g., Exec Summary, QoE, NWC, Net Debt, Risks)
2. Produce an outline that is layout-aware:
   - Each slide must have: `type`, claim-led `title`, and the "evidence shape" (narrative, compare/contrast, chart, table).
   - Use `---` as slide separators.
   - Choose `twoColumnText` only when you truly have two parallel streams.
   - Choose chart/table layouts only when you can supply the required objects.

Outline template (copy/paste):

```text
Slide 1 (cover)
Title: ...
Subtitle: ...

---

Slide 2 (contents)
Title: ...
Sections (>= 8): ...

---

Slide 3 (dividerDark)
SectionNumber: 01
SectionTitle: Executive Summary

---

Slide 4 (oneColumnText)
Title (claim): ...
Strapline (implication): ...
Evidence: (what proves the claim)
```

Only after the outline is agreed: write the deckSpec.

## DeckSpec Authoring Rules (Hard Requirements)

Before drafting, read `references/slide-contract.md`.

1. Use only supported slide `type` values.
2. Fill every required slot for that type.
3. Do not attach unsupported slots (e.g., `chart` on `oneColumnText`).
4. Respect minimum density targets (the validator enforces these).
5. Add sources for quantitative claims (`chart.source`, `source`, `noteSource`).

## Commands (Generation)

Start from the standard template:

```bash
cp skills/kpmg-slides/assets/templates/deckspec-starter.json decks/my-deck.deckSpec.json
```

Generate artifacts:

```bash
skills/kpmg-slides/scripts/run_kpmg_slides.sh --in decks/my-deck.deckSpec.json
```

Optional custom output directory:

```bash
skills/kpmg-slides/scripts/run_kpmg_slides.sh --in decks/my-deck.deckSpec.json --out-dir outputs/my-client-run
```

This runner always attempts:
- Preview PNGs
- Montage PNG
- Visual overflow check (renders with padding and flags slides that overflow the canvas)

## How To Read Artifacts (What The Tool Produces)

For an `--out-dir` like `outputs/my-client-run/`:
- `deck.pptx`: the generated deck
- `qa.json`: consolidated QA report (contract, density, overlap, overflow, postprocess status)
- `preview/`: slide PNGs (if preview succeeded)
- `montage.png`: contact sheet (if montage succeeded)

Open `qa.json` first. Use `references/qa-rules.md` for the fix loop.

## Response Contract (What You Say Back To The User)

Always respond in user-friendly language first, then include technical paths.

1. `Status`: `Ready to share` or `Needs fixes`
2. `What was generated`:
   - PowerPoint deck path
   - Preview/montage/overflow status (from `qa.json.postprocess` or printed runner summary)
3. `What to fix next` (only if blocking issues exist):
   - Short, action-oriented list by slide number
4. `Minor notes` (exactly one sentence):
   - `I noticed there were X non-blocking issues: ...`
5. `Technical artifacts`:
   - DeckSpec path used
   - QA report path (JSON)

Always include this validation note when delivering:
> This deck was validated via automated rendering (LibreOffice-based). Please review in Microsoft PowerPoint before distribution, as rendering differences may exist.

Example response (folded output example):

```text
Status: Needs fixes
What was generated:
- PowerPoint deck: outputs/my-client-run/deck.pptx
- Postprocess: preview=ok, montage=ok, overflowVisual=fail (slides: 7, 11)
What to fix next:
- Slide 7: Right column overflows; shorten or split into a continuation slide.
- Slide 11: Visual overflow detected; reduce table density or split the table across two slides.
Minor notes:
- I noticed there were 2 non-blocking issues: one table density warning and one thin-slide advisory.
Technical artifacts:
- DeckSpec path: decks/my-deck.deckSpec.json
- QA report path: outputs/my-client-run/qa.json
```

## References

1. `references/slide-contract.md`: slide types, slots, chart/table shapes, density minimums.
2. `references/writing-guide.md`: executive writing + overflow tightening patterns.
3. `references/starter-template-guide.md`: how to extend the starter deckSpec safely.
4. `references/qa-rules.md`: exactly how to QA and how to fix what QA reports.
