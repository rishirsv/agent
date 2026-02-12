# Generation Notes - Full Project North Prose Rewrite (Feb 12, 2026)

## Inputs reviewed (newer than `deck-input.json` in Downloads)
- `/Users/rishi/Downloads/exhibit-register.csv`
- `/Users/rishi/Downloads/appendix-topic-index.md`
- `/Users/rishi/Downloads/working-capital-adjustments.csv`
- `/Users/rishi/Downloads/qoe-adjustments.csv`
- `/Users/rishi/Downloads/financials-cashflow-bridge.csv`
- `/Users/rishi/Downloads/financials-balance-sheet-stratified.csv`
- `/Users/rishi/Downloads/financials-income-statement.csv`
- `/Users/rishi/Downloads/generation-notes.md`
- `/Users/rishi/Downloads/deck-plan.json`
- `/Users/rishi/Downloads/deck-input.json`

## Root-cause diagnosis of poor prior quality
1. Prior bullets were too formulaic and often read like template scaffolding rather than manager-ready diligence prose.
2. Implication language repeated the same sentence structures, so pages sounded robotic even when factually correct.
3. Some narrow-table slides relied on generic fallback narration, which reduced slide-specific insight quality.
4. The QoE register page exceeded layout capacity when prose density increased, forcing explicit fit-aware compaction.

## Remediation implemented
1. Rewrote all narrative fields (`body`, `leftBody`, `rightBody`, `insights`) into complete two-sentence business prose for substantive bullets.
2. Applied Project North-style structure at bullet level: observation/evidence first, transaction implication second.
3. Increased linguistic variation and reduced repetitive connective patterns to avoid robotic voice.
4. Preserved numeric fidelity, signs, and required placeholders (`[CHART PLACEHOLDER]`, `[TABLE IMAGE PLACEHOLDER]`).
5. Kept table-slide commentary slide-specific (no fallback-only language on QoE/NWC appendix tables).
6. Compacted slide 26 (`QoE Adjustments Register`) table labels/insights to clear strict overflow without reverting to fragments.

## Quality controls run
- `node generator/validate.js --in /Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck-spec.json` -> `OK`
- `node generator/index.js --in /Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck-spec.json --out /Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck.pptx --strict` -> `PASS`
- Strict overflow gate -> `PASS` (no slide overflow failures)
- Narrative diagnostics:
  - `258/258` substantive bullets are multi-sentence
  - `250` unique second-sentence implications across `258` substantive bullets

## Output artifacts
- `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck-spec.json`
- `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck.pptx`
- `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck.pdf`
- `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck-gold-standard-northbridge-fdd.pptx`
- `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/dist/kpmg-slidegen-fdd/exports/deck-gold-standard-northbridge-fdd.pdf`

## Remaining caveats
- Open support dependencies remain intentionally flagged where source support is still pending (for example QA03, QA09, QA11, QA12 and selected NWC items).
- This remains a simulated diligence pack driven by provided source inputs.
