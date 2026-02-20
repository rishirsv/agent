# ISSUES.md

## Review scope
- Deck reviewed: `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/outputs/runs/2026-02-20-zoominfo-premium/zoominfo-premium.pptx`
- Visual basis: `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/outputs/runs/2026-02-20-zoominfo-premium/png-v2/slide-01.png` to `slide-20.png`
- QA basis: `/Users/rishi/Code/ai-tools/chatgpt/kpmg-slidegen/outputs/runs/2026-02-20-zoominfo-premium/zoominfo-premium.qa.json`

## Critical issues

| ID | Priority | Slide(s) | Issue | Driver | Plain english explanation | Suggested fix |
|---|---|---|---|---|---|---|
| 1 | P0 | 5 | `Summary financials` is still an empty scaffold | Layout/builder only renders panel placeholders, not content payloads | This reads like a template page, not a client deliverable. It kills executive confidence early in the deck. | Replace this slide with a real summary page: 3-5 quantified headline findings, mini-bridges, and explicit implications. If data is unavailable, hide the layout and use a text+chart summary format instead. |
| 2 | P0 | 17 | `Quality of earnings workplan` is a full-page empty blue box | `qualityOfEarnings` builder defaults to scaffold rectangle with no meaningful body rendering | This looks unfinished and would be interpreted as missing work. | Either fully populate the QoE layout (normalization bridge, key adjustments, testing plan) or remove it from production runs until content is available. |
| 3 | P0 | 2 | Contents page still shows top-right `Glossary`/`KPMG contacts` utility text | `contents-slide.js` hardcodes utility links | You asked to remove top-right nav/chrome style globally, but one slide still has it, so brand behavior is inconsistent. | Remove hardcoded utility text from contents builder or gate it behind a config flag defaulting to `off`. |
| 4 | P0 | all footer slides | Legal footer still contains unresolved placeholders (`[year] [legal member firm name] ...`) | Master/footer token values are not hydrated | Placeholder legal text in client output is a serious professionalism miss. | Add runtime footer variables (`legalEntityName`, `jurisdiction`, `year`) and require them for non-demo mode; fail generation if missing. |
| 5 | P0 | 20 | Back cover has no KPMG closing mark and feels detached from template finishing style | Closing master/chrome parity is incomplete | Last slide looks generic compared with canonical Diligence+ endings; weak final impression. | Add canonical closing chrome variant from template extraction (logo/lockup/footer treatment), and enforce it for `backCover`. |

## High-priority issues

| ID | Priority | Slide(s) | Issue | Driver | Plain english explanation | Suggested fix |
|---|---|---|---|---|---|---|
| 6 | P1 | 4 | P&L scaffold heading bar is content-heavy and visually cramped | Long heading string in constrained heading geometry | The headline is technically readable but not premium-polished; it feels overstuffed. | Enforce `heading` max of ~70 chars for this layout and move overflow to first bullet in body. |
| 7 | P1 | 4, 8, 9 | Source attribution is inconsistent and too sparse for high-stakes claims | Content pack mapping does not enforce source slot per analytical slide | Executive readers cannot quickly verify evidence trail, reducing trust. | Add required `sourceTag` slot for all analysis/table/chart slides and render at consistent location (e.g., `S1-S5`). |
| 8 | P1 | 8, 12, 13, 14, 19 | Text density is very high and scanability is weak | Slot fill strategy prioritizes completeness over hierarchy | Slides feel like memo pages, not board-ready visuals; key messages are harder to absorb quickly. | Use “headline + 3 bullets + implication” pattern. Cap body bullets to 4-5 and move overflow to appendix notes. |
| 9 | P1 | 9 | QoE normalization chart uses synthetic grouped bars with limited analytical value | Builder defaults to simple charting without analytical template semantics | The chart looks decorative vs decision-driving. | Replace with a true bridge/waterfall or reconciliation table that directly ties GAAP to adjusted run-rate earnings. |
| 10 | P1 | 10, 18 | Table slides use generic right-column heading `Key takeaways` | Builder convention too generic | Repeated generic label weakens storytelling and makes slides feel templated. | Use slide-specific insight headers (e.g., `Underwriting implications`, `IC decision impact`) via slot. |
| 11 | P1 | 2 | TOC page ranges are manually authored and can drift from actual pagination | No page-range auto-sync logic | As soon as content expands/contracts, TOC page ranges become wrong and credibility drops. | Auto-compute TOC ranges from final paginated deck or remove ranges in draft mode. |
| 12 | P1 | 10, 18 | Table cell wrapping creates awkward line breaks and uneven readability | Table auto-fit + fixed geometry without line-break optimization | Questions/phrases break unnaturally, making important rows harder to parse. | Add table text fit heuristics: shorten labels, wider key columns, or split dense rows across continuation slide. |
| 13 | P1 | 1-20 | No explicit recommendation slide (Go/No-Go, conditions, next steps) | Deck plan lacks investment-committee end-state template | A $200k-quality diligence deck should land on a clear decision framework, not just findings. | Add mandatory `IC recommendation` layout with thesis scorecard, gating risks, and required pre-close actions. |

## Medium-priority issues

| ID | Priority | Slide(s) | Issue | Driver | Plain english explanation | Suggested fix |
|---|---|---|---|---|---|---|
| 14 | P2 | 1, 3, 11, 15 | Divider usage is structurally correct but excessive for deck length | Sectioning strategy not scaled to deck size | Frequent full-screen dividers break narrative momentum in a 20-slide deck. | Collapse to 2-3 dividers max for this deck length, or use lighter section openers embedded in content slides. |
| 15 | P2 | 6, 14, 19 | Several key slides are mostly text with large unused whitespace | Layout choice mismatch for content type | Visual imbalance makes pages feel under-designed. | Swap some one-column text slides to mixed layouts (icon row, mini-chart, risk heatmap, or 2x2 implication matrix). |
| 16 | P2 | 8 | Historical chart lacks comparative context (e.g., growth %, NRR trend overlay) | Single-series chart default | Reader sees direction but not the business quality signal. | Add secondary series or annotations for YoY growth and NRR trend to connect revenue and durability. |
| 17 | P2 | 4, 6, 8, 19 | Number and unit style varies (`$m`, `%`, `B`) without a formal convention block | No numeric formatting policy in content generation | Inconsistent notation looks less polished and can create interpretation friction. | Enforce number-style rules in deck spec generation (e.g., all currency in `$m` with 1 decimal unless >$1bn). |
| 18 | P2 | 20 | Back-cover URL/source line looks like a text hyperlink and may not match template intent | Back-cover text style inherits link-like appearance | This draws attention to the wrong element and feels non-canonical. | Use non-underlined source style and optionally move full source register to appendix only. |
| 19 | P2 | 2, 16 | Nomenclature drift (`Value creation` vs `Value creation blueprint`) | Manual title entry not normalized against section taxonomy | Minor but noticeable naming inconsistency. | Add title normalization map so section labels and slide titles stay consistent unless intentionally overridden. |
| 20 | P2 | all | Narrative is strong but still “single-pass”; no explicit sensitivity pages for downside/upside economics | Content pack not transformed into scenario page set | For IC audiences, decision confidence needs quantified scenario deltas. | Add 2 mandatory scenario slides: base/downside/upside with EBITDA, cash conversion, and leverage/debt paydown impact. |

## Design-improvement opportunities (non-blocking but high value)

| ID | Priority | Slide(s) | Issue | Driver | Plain english explanation | Suggested fix |
|---|---|---|---|---|---|---|
| 21 | P3 | 4, 8, 9, 10 | Chart/table visual language is competent but not yet “premium consulting” | Default builder styling is intentionally generic | It works, but it does not yet look like a bespoke executive artifact. | Add style variants: stronger annotation layers, callout chips, and decision-oriented subtitles per visual. |
| 22 | P3 | 12, 13, 14 | Risk content would be stronger as a risk matrix than prose bullets | Current layouts optimized for text blocks | Readers must parse paragraphs instead of seeing risk priority at a glance. | Add `riskMatrix` layout (probability x impact) with owner/mitigation columns. |
| 23 | P3 | 5, 16 | Scaffolds are useful internally but should be hidden in external “presentation mode” | No run-mode distinction between working and client output | Internal workbench artifacts are leaking into client-grade output. | Introduce `mode: internal|client` and block scaffold-only slides in `client` mode. |
| 24 | P3 | all | Slide-level “so what” statements are inconsistent | No explicit implication slot required in schema | Some slides state facts but not action. | Add required `implication` slot for analytical slide types and render in a standardized callout band. |

## Suggested execution order
1. Fix P0 items first (scaffold leakage, footer placeholders, utility-link regression, closing parity).
2. Then address P1 story quality (source discipline, scanability, recommendation slide, TOC auto-sync).
3. Finish with P2/P3 polish (visual upgrades, risk matrix, scenario quantification, style system enhancements).

