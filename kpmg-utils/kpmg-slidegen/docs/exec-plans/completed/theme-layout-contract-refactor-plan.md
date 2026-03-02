# Theme + Layout Contract Refactor Plan

## Phase Outcomes (Non-Technical)

### Phase 1: One trusted place for visual rules
We establish a single theme object so fonts, colors, spacing, and component metrics come from one source. This reduces visual drift and makes deck updates predictable.

### Phase 2: Clear separation between user input and runtime internals
We stop mixing runtime internals into slide payloads. Builders receive user slide data and runtime context separately, reducing accidental collisions and making validation safer.

### Phase 3: Layout consistency across builders
We introduce a layout contract with named boxes so builders stop re-deriving geometry and stop carrying magic numbers in multiple places.

### Phase 4: Guardrails and confidence checks
We add drift detection and regression tests so future changes surface inconsistencies early without blocking normal development flow.

## Implementation Checklist

- [x] 1.0 Build shared runtime context
  - [x] 1.1 Add `generator/runtime/theme.js` with raw `theme.tokens` + semantic mappings
  - [x] 1.2 Add `generator/runtime/layout-contract.js` for named per-slide boxes
  - [x] 1.3 Add `generator/runtime/render-context.js` to compose theme + layout contract
  - [x] 1.4 Validation for 1.0 (unit/smoke checks)

- [x] 2.0 Switch builder API to explicit context
  - [x] 2.1 Update dispatch to `builder(pptx, slideSpec, ctx)`
  - [x] 2.2 Migrate builders using mixed payload internals
  - [x] 2.3 Validation for 2.0 (render smoke)

- [x] 3.0 Migrate high-drift constants to theme/layout
  - [x] 3.1 Contents slide tokens + spacing
  - [x] 3.2 Narrow table colors/widths + chart typography constants
  - [x] 3.3 Footer/back-cover constants from context where applicable
  - [x] 3.4 Validation for 3.0 (focused regressions)

- [x] 4.0 Add drift guard and finalize tests
  - [x] 4.1 Add AST-based drift guard for style-bearing literals
  - [x] 4.2 Add/update regression tests for migrated builders
  - [x] 4.3 Validation for 4.0 (run test scripts + generator run)
