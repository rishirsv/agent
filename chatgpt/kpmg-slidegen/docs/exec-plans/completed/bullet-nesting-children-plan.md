# Bullet Nesting v2 (`children` Schema, Pre-Release)

## Phase Outcomes (Non-Technical)
- Phase 1: Authors and the model have one clear format for nested bullets.
- Phase 2: Nested bullets render with consistent hierarchy, including dash style at deeper levels.
- Phase 3: Dense nested slides paginate without overlap regressions.
- Phase 4: Skill guidance teaches when to use flat bullets vs nested bullets.
- Phase 5: Parent renderer and skill bundle remain mirrored and verified.

## Implementation Checklist
- [x] 1.0 Policy + plan setup
  - [x] 1.1 Add AGENTS.md rule: pre-release, no backward-compat fallbacks unless explicitly requested
  - [x] 1.2 Save this plan in `docs/exec-plans/active/`
  - [x] 1.3 Validation for 1.0: confirm files exist and are tracked
- [x] 2.0 Runtime contract + validation
  - [x] 2.1 Implement recursive `children` parsing for `textArray`/`stringArray`
  - [x] 2.2 Reject legacy nested arrays with clear validation errors
  - [x] 2.3 Enforce max nesting depth and forbid `children` on headers/subheaders
  - [x] 2.4 Validation for 2.0: run validation regression tests
- [x] 3.0 Rendering + pagination
  - [x] 3.1 Render nested bullets recursively in `bullets.js`
  - [x] 3.2 Apply dash bullet symbol at deeper level
  - [x] 3.3 Update pagination chunking for nested structures
  - [x] 3.4 Validation for 3.0: generate dense nested samples and confirm no overflow failures
- [x] 4.0 Schema + skill guidance
  - [x] 4.1 Add `children` recursion to deckspec schema
  - [x] 4.2 Update `slide-contract.md` nested bullet contract and examples
  - [x] 4.3 Update `writing-standards.md` with nested-bullet usage guidance
  - [x] 4.4 Update `SKILL.md` with decision rules for when nested bullets should be used
  - [x] 4.5 Validation for 4.0: verify docs/schema consistency by inspection
- [x] 5.0 Regression coverage + skill mirror
  - [x] 5.1 Add dense nested-bullet visual regression fixtures/scripts for 3 layouts
  - [x] 5.2 Run regression commands and verify pass
  - [x] 5.3 Run `npm run skill:sync` and `npm run skill:verify`
  - [x] 5.4 Validation for 5.0: confirm mirrored files changed only via sync
