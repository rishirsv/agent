---
name: designer
description: Create distinctive, production-grade frontend interfaces with strong visual direction and research-backed usability guardrails. Use this skill when the user asks to build or redesign web components, pages, applications, dashboards, landing pages, React components, HTML/CSS layouts, or to style/beautify existing UI while preserving functionality. Also use for React Native/Expo iOS app UI creation, redesign, and native-feel polishing, including iterative design with repo UI context files in .design/.
---

Build distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics.
Implement real working code with strong visual taste and disciplined interaction design.

## iOS Native UI Routing

For native iPhone UI work in React Native or Expo, load in this order:
1. `references/native-ios-ui/apple-human-interface-guidelines.md`
2. `references/native-ios-ui/building-native-ui.md`
3. Only the relevant file(s) under `references/native-ios-ui/references/`

Routing map:
- Navigation structure: `references/native-ios-ui/references/route-structure.md`
- Tabs: `references/native-ios-ui/references/tabs.md`
- Headers, toolbar, menus: `references/native-ios-ui/references/toolbar-and-headers.md`
- Search UX: `references/native-ios-ui/references/search.md`
- Sheets: `references/native-ios-ui/references/form-sheet.md`
- Native controls: `references/native-ios-ui/references/controls.md`
- Icons/SF symbols: `references/native-ios-ui/references/icons.md`
- Motion/animations: `references/native-ios-ui/references/animations.md`
- Blur/material effects: `references/native-ios-ui/references/visual-effects.md`
- Media capture/playback: `references/native-ios-ui/references/media.md`
- Local persistence: `references/native-ios-ui/references/storage.md`
- 3D/WebGPU: `references/native-ios-ui/references/webgpu-three.md`
- Zoom transitions: `references/native-ios-ui/references/zoom-transitions.md`
- Gradients: `references/native-ios-ui/references/gradients.md`

Always apply the `Frontend Aesthetics Guidelines` section in this file while implementing iPhone UI work.

## Workflow

0. Optional: load repo UI context for iterative design

- Use `references/repo-ui-init-and-context.md` for `.design/` context files.
- Use `references/design-token-sync.md` for theme token extraction when needed.
- Run `init design context` only when the user explicitly asks to create design context files.
- Run `update design context` only when the user explicitly asks to refresh design context files.
- When `.design/` files already exist, read only the files relevant to the requested surface.

1. Understand intent and constraints

- Identify purpose, audience, platform, and accessibility/performance constraints.

2. Commit to a clear visual direction

- Pick one strong aesthetic point of view and execute it consistently.

3. If redesigning existing UI, create baseline first

- Create a faithful, pixel-accurate baseline of current UI before proposing changes.
- Gather the current design state before presenting recommendations.

4. Use screenshot-driven evidence loops for iterative passes

- Use `references/iterative-evidence-loop.md`.
- For web iteration evidence, use Agent Browser.
- For React Native/Expo iOS evidence, use iOS Simulator with consistent framing (prefer iPhone 17 Pro when available).

5. Load only the needed guideline modules

- `references/ui-principles-and-heuristics.md`: hierarchy, typography, spacing, color, accessibility baseline, responsive behavior, input modality, and performance stability checks.
- `references/motion-and-microinteractions.md`: purposeful motion, reduced-motion handling, state feedback.
- `references/interaction-states-and-feedback.md`: hover/focus/pressed/disabled/loading/success/error behavior.
- `references/forms-validation-and-recovery.md`: labels, instructions, validation timing, error recovery.

6. Implement production code

- Deliver functional code first, then polish.
- Keep styling/token choices intentional and systemized (typography scale, spacing scale, color roles, radius/shadow families).

7. Run a fast quality pass

- Check contrast, focus visibility, target size, keyboard flow, and obvious layout shift risks.

8. Explain design rationale briefly

- State the chosen direction, key tradeoffs, and why changes improve usability.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

## Non-negotiables

- Avoid generic, context-free design output.
- Preserve existing functionality and expected interaction behavior.
- Keep one clear primary message and primary action per section/screen.
- Keep focus indicators visible and avoid clipping/obscuring focused elements.
- Meet baseline accessibility thresholds when possible:
  - Text contrast at least 4.5:1 (3:1 for large text).
  - UI component/state indicators at least 3:1.
  - Pointer target size at least 24x24 CSS px (or equivalent spacing exception).
- Respect motion preferences via `prefers-reduced-motion`.
- Avoid layout-jank patterns (reserve space for late content; prefer transform/opacity motion).

Avoid defaulting to generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary themes, typography, and visual direction when appropriate to the task, and avoid repeatedly converging on the same defaults.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: You are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
