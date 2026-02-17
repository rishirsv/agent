# Repo UI init and context files

Use this when the task is iterative design on an existing repo UI.

## Commands

Use these commands only when the user asks for context generation or refresh.

- `init design context`: create `.design/` and generate all required context files.
- `update design context`: refresh all `.design/*.md` files from current repo sources.

## Output location

Write context files to `.design/` in the project root.

Required files:
- `.design/components.md`
- `.design/layouts.md`
- `.design/routes.md`
- `.design/theme.md`

## What each file must contain

### `.design/components.md`
- Shared/reusable UI primitives and building blocks.
- File path + short note + focused snippets only.

### `.design/layouts.md`
- Shared layout wrappers and shells (app layout, nav, header, sidebar, footer).
- File path + short note + focused snippets only.

### `.design/routes.md`
- Route map: path, file, layout relation.
- Include router config content when present.

### `.design/theme.md`
- Full token/theme extraction (see `design-token-sync.md`).
- Include token values and focused snippets for global styles/config sources.

## Read rule

For every iterative design task:
- Read only the `.design/*.md` files relevant to the requested surface.
- If files are missing or stale, continue with direct repo inspection unless the user asks to generate or refresh context files.

## Context-file usage

When preparing design analysis/reproduction, include context files for:
- Target page/feature file(s)
- Shared layouts used by that page
- Reusable UI primitives used in that page
- Global styles and theme/token sources

Keep context practical and relevant. Do not require exhaustive repo-wide file inclusion.
