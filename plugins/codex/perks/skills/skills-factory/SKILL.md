---
name: skills-factory
description: Use when creating, reviewing, or improving reusable skills through the Skills Factory lanes and shared skillfactory CLI; not for packaging, installing, publishing, or unrelated Perks skill maintenance.
---

# Skills Factory

Route skill-building work to the right factory lane, then follow that lane's runtime instructions. This wrapper exists so the factory can live inside the Perks plugin while keeping the lane payloads and shared CLI together.

## Route First

- Create or redesign a reusable skill: read [skills/skill-create/SKILL.md](skills/skill-create/SKILL.md).
- Set up, run, audit, or interpret review evidence: read [skills/skill-review/SKILL.md](skills/skill-review/SKILL.md).
- Patch or surgically improve an existing skill from review evidence or a concrete failure: read [skills/skill-improve/SKILL.md](skills/skill-improve/SKILL.md).

If the user asks to implement or debug the factory engine itself, treat it as repository engineering work against `cli/` and the specs under `docs/`, not as a runtime lane task.

## Shared CLI

The three lanes use the shared `skillfactory` CLI in `cli/`, exposed from the repository by `bin/skillfactory`.

Validate lane payloads from the repo root:

```bash
bin/skillfactory validate skills/skills-factory/skills/skill-create
bin/skillfactory validate skills/skills-factory/skills/skill-review
bin/skillfactory validate skills/skills-factory/skills/skill-improve
```

## Boundaries

- Keep lane-specific behavior in the lane `SKILL.md` files.
- Keep engine implementation in `cli/`.
- Keep product specs, research, diagrams, and architecture notes in `docs/`.
- Require a human gate before packaging, installing, syncing, publishing, external writes, or promoting a candidate into canonical source.

## Output

Report the lane used, files changed or reviewed, validation run, and any human decision still needed.
