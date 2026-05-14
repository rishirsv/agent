# OAI Reference Copies

Refreshed on 2026-05-12 from the latest locally installed Codex sources on this machine.

These folders are reference material only. They are not active `rs-tools` skills or installable plugin content.

## Sources

- `artifact/`
  - Source: `/Users/rishi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/`
  - Version copied: `@oai/artifact-tool@2.7.6`
- `presentations/`
  - Source: `/Users/rishi/.codex/plugins/cache/openai-primary-runtime/presentations/26.506.11943/skills/presentations/`
- `imagegen/`
  - Source: `/Users/rishi/.codex/skills/.system/imagegen/`
- `skills/documents/`
  - Source: `/Users/rishi/.codex/plugins/cache/openai-primary-runtime/documents/26.506.11943/skills/documents/`
- `skills/spreadsheets/`
  - Source: `/Users/rishi/.codex/plugins/cache/openai-primary-runtime/spreadsheets/26.506.11943/skills/spreadsheets/`
- `skills/openai-docs/`
  - Source: `/Users/rishi/.codex/skills/.system/openai-docs/`
- `skills/skill-creator/`
  - Source: `/Users/rishi/.codex/skills/.system/skill-creator/`
- `skills/skill-installer/`
  - Source: `/Users/rishi/.codex/skills/.system/skill-installer/`
- `skills/pdf/`
  - Source: `/Users/rishi/.codex/skills/pdf/`

## Refresh Notes

- The previous OAI reference tree was replaced with a deletion sync.
- Stale older folders such as `skills/docs`, `skills/pdfs`, and `skills/slides` were removed because their current installed counterparts are now represented as `skills/documents`, `skills/pdf`, and `presentations`.
- Symlinked runtime packages were copied with dereferenced files so the reference tree remains inspectable from the repo alone.
- `.DS_Store` files were removed.
