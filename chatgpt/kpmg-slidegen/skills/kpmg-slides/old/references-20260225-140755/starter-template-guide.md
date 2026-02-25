# Starter Template Guide (How To Start Fast Without Breaking Contract)

Use the starter template when creating a new deckSpec from scratch.

Templates:
- In skill bundle (portable): `assets/templates/deckspec-starter.json`
- In repo (example): `decks/deckspec-starter-template.deckSpec.json`

## Workflow: Outline Pass -> Fill Pass -> QA Pass

### 1) Copy the template

```bash
cp skills/kpmg-slides/assets/templates/deckspec-starter.json decks/my-deck.deckSpec.json
```

### 2) Outline pass (structure only)

Goal: get the story and slide types right before writing dense content.

Do:
- Replace bracketed placeholders in `title`, `sectionTitle`, and `subtitle`.
- Add/remove slides to match the desired `numSlidesTarget`.
- Keep each slide's job obvious from the title.

Do not:
- Write long paragraphs yet.
- Add charts/tables unless you can provide valid objects.

### 3) Fill pass (slot completion)

Goal: make every slide contract-valid.

Do:
- Fill every required slot for each `type`.
- Add `strapline` on decision-heavy slides.
- Add `source` / `chart.source` / `noteSource` for numbers.
- Use inline `subheader` objects in `textArray` to structure dense bodies.

### 4) QA pass (generate -> fix -> rerun)

Run generation and iterate using the QA rules.

## What Each Starter Slide Type Is For

1. `cover`: Deck title and subtitle (context + date).
2. `dividerDark`: New section break (chapter reset).
3. `contents`: Agenda and navigation (>= 8 sections).
4. `oneColumnText`: Single-thread narrative claim.
5. `twoColumnText`: Compare/contrast (two parallel streams only).
6. `analysisWideChart2ColsText`: Chart plus interpretation.
7. `analysisNarrowTable`: Table and key takeaways.
8. `analysisWideChartTableText`: Combined chart + (optional) table + synthesis.
9. `titleStrapline4TextBoxes`: Four-pillar summary.
10. `backCover`: Closing disclaimer and URL.

## Slot Tips (High Leverage)

1. Required slots are non-negotiable. Fix required slots before polishing optional fields.
2. Titles must be claim-led (not topics).
3. Use `strapline` to state the implication in one sentence.
4. Use `bodyStyle` to choose `bullets` (default) vs `paragraphs` (rare).
5. Keep source lines short and legible (1-2 lines).

## Editing Checklist (Fast Preflight)

- Every slide uses a supported `type`.
- Chart slides:
  - `chart.type` is set
  - each series has numeric `values`
  - `chart.source` included when numbers are external
- Table slides:
  - `headers` and `rows` present
  - row text is not essay-length (split if dense)
- Narrative slides:
  - bullets are short, one idea each
  - content fits without cramming; split if needed
