# Output Examples (Quick Reference Only)

The primary output contract and an example response are embedded in the skill's `SKILL.md`.

Use this file only as a quick reminder of the response shape.

## Response Shape (Always)

1. Status: `Ready to share` or `Needs fixes`
2. What was generated: deck path + postprocess statuses
3. What to fix next: only blocking issues, action-oriented
4. Minor notes: exactly one sentence
5. Technical artifacts: deckSpec path + `qa.json` path

Always include:
> This deck was validated via automated rendering (LibreOffice-based). Please review in Microsoft PowerPoint before distribution, as rendering differences may exist.
