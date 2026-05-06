---
name: create-design-system
description: Build or refresh reusable brand design-system packages from codebases, Figma files, decks, and asset folders. Use when the user wants a shareable design-system workspace with visual foundations, copied assets, UI kits, preview cards, brand guidance, and a portable skill for future design work.
---

# Create Design System

Create a reusable brand package that helps later design work stay faithful to the real product.

Treat the design system as a working folder with copied assets, visual rules, preview surfaces, and reusable UI kit artifacts.

## Start Here

- Begin with a concrete task list and keep it current as the system takes shape.
- Inspect every source the user provided: codebases, Figma links, decks, screenshots, and asset folders.
- Stop and ask for help if a named codebase or Figma file is inaccessible. Do not bluff through missing primary sources.
- Call `set_project_title` with a short brand or product name so the project is discoverable.

## Core Deliverables

Create these root-level artifacts unless the user explicitly asks for a different structure:

- `README.md` as the canonical design-system overview
- `colors_and_type.css` for foundational and semantic tokens
- `fonts/` for copied fonts or documented substitutions
- `assets/` for logos, icons, illustrations, and other copied visual materials
- `preview/` cards that surface the system in small, scan-friendly slices
- `ui_kits/<product>/...` for high-fidelity recreated product surfaces
- `slides/` only when the user supplied slide material worth recreating
- `SKILL.md` so the design system can be used as a portable skill later

## README Contract

Use `README.md` as the system's operating manual. It should cover:

- company and product context
- the exact sources inspected
- content fundamentals such as tone, casing, pronouns, and writing style
- visual foundations such as type, color, spacing, cards, shadows, blur, imagery, and motion
- iconography rules and copied icon sources
- a short index of the other files and folders in the system

## Asset And Token Rules

- Copy real assets instead of redrawing them.
- Copy the product's icon system first; only substitute when the original set is unavailable.
- If font files are missing, use the nearest Google Fonts substitute, flag it clearly, and ask for the real files.
- Avoid screenshot-only reconstruction when code or Figma context exists.

## Preview And UI Kit Rules

- Build many small preview cards rather than a few crowded summary boards.
- Register preview cards in consistent groups: `Type`, `Colors`, `Spacing`, `Components`, and `Brand`.
- For each product surface, build a high-fidelity UI kit with reusable components and an index surface that looks like a real view of the product.
- Recreate existing design faithfully; do not invent a fresh visual language under the banner of a UI kit.

## Closeout

- End by calling out caveats and the clearest next iteration ask.
- Remind the user to set the file type to Design System in the Share menu so other people in their org can view it.

## Detailed Guidance

Read [references/design-system-workflow.md](references/design-system-workflow.md) for the extracted full workflow, folder expectations, registration rules, UI kit guidance, and blocker conditions.
