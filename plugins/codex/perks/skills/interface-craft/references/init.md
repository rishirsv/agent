# Init And Refresh

Create or update the repo's durable design source of truth. Existing repo convention wins: use the design- or taste-related path the project already has. When no convention exists, create one obvious project docs file for design guidance and use the default shape below.

## What To Produce

Default format:

- YAML frontmatter for machine-readable tokens.
- Markdown sections in a stable order.
- Tokens are normative; prose explains how to use them.
- The file is stack-agnostic: web CSS tokens, Tailwind values, SwiftUI colors, native asset catalogs, component APIs, screenshots, and previews can all be source evidence.

Do not create a sidecar JSON file unless the user asks.

## Scan Before Asking

Inspect:

- existing design- or taste-related files
- README, docs, specs, plans, and product context
- package/config files and platform stack
- tokens: CSS variables, Tailwind config, SwiftUI styles, asset catalogs, token JSON, theme files
- components: buttons, inputs, cards, navigation, dialogs, lists, empty states
- rendered output: screenshots, previews, simulator/browser views
- brand assets, icons, imagery, fonts

Infer the register from the code and docs. Treat app/tool surfaces as product. Treat public marketing/communication surfaces as brand.

## Ask For Missing Intent

Ask only for what cannot be inferred:

- primary users and job to be done
- product or brand personality
- anti-references
- accessibility or platform requirements
- key surfaces the design file must govern
- a visual north star if the implemented system is absent or incoherent

Do not ask about colors, fonts, or radii when the code already establishes them.

## Default File Shape

Frontmatter example:

```yaml
---
name: "Project Name"
description: "One-line description"
register: "product"
colors:
  primary: "#315c4d"
typography:
  body:
    fontFamily: "system-ui, sans-serif"
rounded:
  md: "8px"
spacing:
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
---
```

Markdown sections, in order:

1. `## Overview`
2. `## Colors`
3. `## Typography`
4. `## Elevation`
5. `## Components`
6. `## Do's and Don'ts`

Fit layout, motion, accessibility, adaptive behavior, and copy rules into the closest section. Avoid extra top-level sections unless the repo already uses them and they are valuable.

## Write Rules

- Never silently overwrite an existing design file. For `refresh`, merge deliberately and preserve correct intent.
- Do not invent tokens. If a token should exist but does not, say so in prose or create it only when the user asked for implementation too.
- Use project token names when they exist. Do not rename a working system into generic Material-style roles.
- Include color strategy, typography rules, imagery expectations, and anti-references as concrete Do/Don't rules.
- If the file is seeded before UI exists, mark it with `<!-- SEED -->` and say it should be refreshed once real UI ships.
