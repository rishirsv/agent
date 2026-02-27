# Section contract: Business overview

## Table of contents
- Core rule
- Writing guidance
- Layout options (choose one)
- Available slot shapes (tool library)
- Layout-to-slot recipes
- Industry adaptation examples
- Render skeleton
- Common mistakes (and fixes)
- Structural preflight rules (must pass)
- Split policy rules
- Full example

## Core rule

Write a clear, decision-useful summary of what the business is, how it earns revenue, how it operates, and what changed over the review period.

The section must read as client-ready diligence writing: factual, concise, and specific.

Global writing, placeholder, and language rules are defined in `references/global-writing-conventions.md` and apply here.

## Writing guidance

1. Start with what the business does, then how it monetizes, then what drives earnings quality.
2. Keep every bullet operational and decision-relevant.
3. Use concrete business mechanics before interpretation.
4. Link recent changes to likely direction of revenue, margin, or volatility impact.
5. Keep this section business-driver focused; avoid full financial performance narrative.

## Layout options (choose one)

### `baseline`
Use when the business has a relatively simple model and one dominant operating pattern.

Target length:
- 260-420 words

Required blocks:
- `Business model`
- `Customers and go-to-market`
- `Operating model`
- `Recent changes and context for financial trends`

### `diversified`
Use when the business spans multiple entities, segments, product lines, or service lines.

Target length:
- 320-560 words

Required blocks:
- same as `baseline`
- include segment/entity composition in `Business model`
- include shared dependency/coordination detail in `Operating model`

### `commercial_complexity`
Use when route-to-market, pricing, contract mechanics, or channel composition is a key driver of outcomes.

Target length:
- 300-520 words

Required blocks:
- same as `baseline`
- add commercial composition detail in `Customers and go-to-market`
- add pricing/contract mechanic detail where relevant

## Available slot shapes (tool library)

Use these as building blocks. Choose only what the selected layout needs.

### `snapshot_bullet`
- Purpose: define what the company does and where it operates.
- Best use: opening bullet in each block.
- Target length: 20-45 words.
- Placeholders: allowed.

### `driver_bullet`
- Purpose: connect an operating fact to earnings or margin behavior.
- Best use: core explanatory bullets.
- Target length: 20-50 words.
- Placeholders: allowed.

### `composition_bullet`
- Purpose: describe composition across channel/customer/product/segment/geography.
- Best use: business model and GTM blocks.
- Target length: 18-45 words.
- Placeholders: allowed.

### `dependency_bullet`
- Purpose: describe operational dependencies that can affect quality of earnings.
- Best use: operating model block.
- Target length: 20-55 words.
- Placeholders: allowed.

### `change_bullet`
- Purpose: describe a change over time and likely impact direction.
- Best use: recent changes block.
- Target length: 20-55 words.
- Placeholders: allowed.

### `source_note`
- Purpose: compact support note for a block.
- Best use: once per block when needed.
- Target length: 8-25 words.
- Placeholders: allowed.

## Layout-to-slot recipes

### `baseline` recipe
- `Business model`: 1 `snapshot_bullet` + 2 `driver_bullet` + optional `composition_bullet`
- `Customers and go-to-market`: 1 `snapshot_bullet` + 2 `driver_bullet` + optional `composition_bullet`
- `Operating model`: 1 `snapshot_bullet` + 2 `dependency_bullet`
- `Recent changes`: 2-3 `change_bullet`

### `diversified` recipe
- `Business model`: 1 `snapshot_bullet` + 2 `driver_bullet` + 1-2 `composition_bullet`
- `Customers and go-to-market`: 1 `snapshot_bullet` + 2 `driver_bullet` + optional `composition_bullet`
- `Operating model`: 1 `snapshot_bullet` + 2-3 `dependency_bullet`
- `Recent changes`: 2-3 `change_bullet`

### `commercial_complexity` recipe
- `Business model`: 1 `snapshot_bullet` + 2 `driver_bullet`
- `Customers and go-to-market`: 1 `snapshot_bullet` + 2 `composition_bullet` + 1-2 `driver_bullet`
- `Operating model`: 1 `snapshot_bullet` + 2 `dependency_bullet`
- `Recent changes`: 2-3 `change_bullet`

## Industry adaptation examples

These examples show how layout choice adapts by business reality, not by industry label.

- Consumer retail brand:
  - Likely layout: `commercial_complexity`
  - Why: channel mix, acquisition cost, and pricing cadence can drive margin and cash conversion.

- Healthcare services platform:
  - Likely layout: `diversified`
  - Why: multi-site operations, provider model, and payer/service mix often create segment and dependency complexity.

- Industrial distributor:
  - Likely layout: `baseline` or `commercial_complexity`
  - Why: choose `baseline` when model is straightforward; use `commercial_complexity` when contract terms and customer concentration are core drivers.

## Render skeleton

```markdown
## Business overview

### Business model
- [snapshot_bullet]
- [driver_bullet]
- [driver_bullet]
- [composition_bullet optional]
- Source note: [source_note optional]

### Customers and go-to-market
- [snapshot_bullet]
- [driver_bullet]
- [composition_bullet optional]
- [driver_bullet]
- Source note: [source_note optional]

### Operating model
- [snapshot_bullet]
- [dependency_bullet]
- [dependency_bullet]
- [composition_bullet optional]
- Source note: [source_note optional]

### Recent changes and context for financial trends
- [change_bullet]
- [change_bullet]
- [change_bullet optional]
- Source note: [source_note optional]
```

## Common mistakes (and fixes)

1. Mistake: generic positioning language with no business mechanics.
- Fix: replace adjectives with operating facts and revenue mechanics.

2. Mistake: detailed financial analysis inside business overview.
- Fix: keep this section business-and-driver focused; move deep performance commentary to P&L sections.

3. Mistake: adding open-item lists.
- Fix: keep missing facts inline using placeholders such as `$[x]` and `[Date]`.

4. Mistake: citing every sentence.
- Fix: use one compact source note per block only when needed.

5. Mistake: long merged bullets from extracted text.
- Fix: split into one idea per bullet and keep sequence logical.

## Structural preflight rules (must pass)

1. All four required blocks exist and are in this exact order.
2. No `Open items` or `Data requests` headings appear.
3. Missing data uses inline placeholders.
4. Bullet density is within contract range.
5. Language and tone pass global conventions.

## Split policy rules

1. Split a block when it exceeds 6 bullets.
2. Split a bullet when it exceeds 55 words.
3. Split into two short blocks when one block mixes unrelated ideas.
4. Prefer subhead bullets over dense paragraphs for complex structures.

## Full example

```markdown
## Business overview

### Business model
- [GROUP FULL NAME] operates a multi-entity food and beverage platform anchored by branded coffee retail, coffee-product manufacturing, and bakery production.
- [ENTITY 2] runs the branded coffee shop network through owned, franchise, and co-investment store models across [x] locations nationwide as of [Date].
- [ENTITY 1] manufactures coffee beans and beverage products and distributes related equipment, supporting both internal demand and third-party customers.
- [ENTITY 3] produces bakery products under house and OEM labels, with product development services that support both internal stores and external accounts.
- At a group level, earnings are influenced by same-store sales, franchise royalty mix, and manufacturing utilization across coffee and bakery production lines.

### Customers and go-to-market
- The retail channel serves daily-consumption customers through physical stores, while B2B revenue is generated through catering, franchise support, and product supply relationships.
- Go-to-market execution combines owned-store traffic generation with partner-led expansion in franchise and co-investment formats.
- Revenue mix is currently weighted toward [retail/franchise/manufacturing], with mix percentages pending confirmation at [x]% / [x]% / [x]%.
- Commercial performance is sensitive to ticket size, store throughput, and channel mix between direct store sales and contract-based supply arrangements.

### Operating model
- The group operates through separate legal entities with overlapping functional support, including finance, back-office administration, and certain management functions.
- Management responsibilities across entities are partly centralized within the founding shareholder family structure, which affects how labor and overhead are allocated between operating units.
- Certain shared services were historically provided without intercompany recharges, which may reduce comparability of standalone entity cost bases.
- As of [Date], shared functions included approximately [x] FTEs supporting more than one entity, with payroll costs split across [ENTITY 1], [ENTITY 2], and [ENTITY 3].

### Recent changes and context for financial trends
- During [FY20XX]-[FY20XX], the business expanded from core coffee retail into adjacent bakery and catering lines, increasing revenue diversification but also adding coordination complexity across entities.
- Management has indicated that current organizational design does not fully reflect a post-transaction standalone operating model, particularly for shared functions and intercompany service charging.
- A post-transaction realignment of structure and service-charge mechanics could shift reported margins by entity, even where group-level economics remain directionally consistent.
```
