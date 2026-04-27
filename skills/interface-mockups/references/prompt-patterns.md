# Prompt Patterns

Use these as starting points. Replace bracketed text with the task details and trim sections that do not matter.

## Full Mobile Screen

```text
Create one polished [iOS/Android] full-screen app mockup for [product/feature].

Artifact: single full phone screen inside a clean realistic device frame.
Screen: [screen type and state].
User job: [what the user is trying to do].
Required UI: [elements].
Exact text: "[heading]", "[button]", "[critical label]".
Hierarchy: [primary object/action], [secondary context], [metadata].
Visual system: [repo or product design language].
Composition: full screen, readable text, safe-area-aware native layout, no cropped controls.
Avoid: [unwanted tropes, extra features, unreadable labels].
```

## Mobile Flow Board

```text
Create one presentation image showing [2/3/4] full [iOS/Android] screens for [product/feature].

Artifact: multi-screen mobile flow board with each phone in the same frame style.
Flow: [screen 1] -> [screen 2] -> [screen 3].
Required UI: [shared required content].
Exact text: [critical strings in quotes].
Visual system: [repo or product design language].
Composition: labels outside each phone, consistent scale, readable UI, warm neutral presentation background.
Avoid: random screens, fake complexity, tiny labels, unrelated features, decorative clutter.
```

## Isolated Component

```text
Create one isolated component mockup for [component name].

Artifact: component on a clean neutral canvas, no full app shell.
Platform/context: [iOS/web/etc].
Component role: [what it helps the user do].
Content: [realistic data and exact labels].
States shown: [default/active/error/etc] if needed.
Visual system: [repo or product design language].
Constraints: keep text readable, controls plausible, hit targets realistic.
Avoid: unnecessary surrounding screens, placeholder text, extra actions, decorative shadows.
```

## Component State Matrix

```text
Create one labeled component state matrix for [component name].

Artifact: one image with the same component repeated across [number] states.
States: [A/default], [B/active], [C/error], [D/disabled].
Labels: place state labels outside the component.
Content: use the same realistic data across states unless the state requires a change.
Visual system: [repo or product design language].
Preserve: same component size, alignment, typography, palette, and surrounding canvas.
Avoid: changing unrelated layout, tiny unreadable labels, fake extra controls.
```

## A/B/C Option Board

```text
Create one A/B/C option board for [feature/component/screen].

Artifact: three clearly labeled UI mockup options in one image.
Shared constraints: [platform], [product], [required content], [palette], [device or viewport], [exact text].
Option A thesis: [direction].
Option B thesis: [direction].
Option C thesis: [direction].
Variation rule: vary only [dimension] / use moderate variation / explore wide alternatives.
Preserve across all options: [list].
Composition: labels outside UI, same scale, same background, readable text.
Avoid: random palette changes, unrelated features, fake content, unreadable labels.
```

## Web App Screen

```text
Create one polished web app mockup for [product/feature].

Artifact: [desktop/tablet/mobile web] viewport [with/without] browser chrome.
Screen: [screen type and state].
User job: [what the user needs to operate, monitor, or decide].
Required regions: [nav/workspace/inspector/table/chart/form/etc].
Exact text: [critical strings in quotes].
Hierarchy: [primary action], [selected object], [secondary context].
Visual system: [repo or product design language].
Avoid: marketing hero, generic SaaS card grid, arbitrary gradients, tiny fake data, stock illustration.
```
