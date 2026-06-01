# Distillation

Use this when the user provides a source pack — input files, process notes, and past completed outputs — and asks to make the workflow reusable. The goal is to extract the procedural method, not to embed the engagement.

## Scope

This reference owns source classification, input-to-output pairing, mechanism extraction, anti-overfit gates, rule surface form, and source provenance.

Use [design.md](design.md) for skill-or-not, trigger contract, body shape, and general intake. Use [structure.md](structure.md) for what goes in the portable runtime.

## Contents

- Distillation flow (5 steps).
- Mechanism Gates (5 hard gates with override paths).
- Engagement-leak Failure Modes (4 named patterns).
- Rule Surface Form (language-level discipline).
- Examples in the Runtime Skill (when concrete content is allowed).
- What is NOT a Source.
- Source Provenance (`source_ref` requirement).
- Worked example.

## Distillation Flow

1. **Classify source roles.** Label each pack item: raw inputs, finished outputs, templates, process notes, rubrics or checklists, rejected or noisy examples, or sensitive one-off material. Items without a clear procedural role stay in project docs, not the runtime.
2. **Pair inputs to outputs.** For each reusable output section, identify which input files, fields, tabs, excerpts, or calculations informed it. A rule cannot earn its place without ≥2 input-output pairs supporting it (see Mechanism Gates).
3. **Classify and extract transformations.** Before writing each rule, name its transformation type: normalization, structural reshape, categorization, calculation, judgment move, caveat pattern, or check. Then state the rule in procedural form (see Rule Surface Form). Categorical labeling forces abstraction before drafting.
4. **Validate against Mechanism Gates.** Each candidate rule must pass all five gates. Single-engagement evidence triggers a "needs human review" flag in the spec.
5. **Map and finalize.** Decide which `SKILL.md` section each surviving rule belongs to. Attach a `source_ref` to each rule in the project spec, never in the runtime. Source pack, raw pairings, rejected candidates, and engagement-specific evidence stay in project docs.

## Mechanism Gates

A candidate rule must pass all five before landing in the runtime skill:

1. **Procedural Specificity.** Names a concrete mechanism — a sequence, a calculation, a judgment move, a check. Not vague advice like "be careful with adjustments."
2. **Implementable in Next Engagement.** Could be applied to a new engagement without modification. If the rule depends on engagement-specific facts, it fails.
3. **Distinct Trigger.** Has a clear "when to apply" condition. A general principle without a trigger is not a rule.
4. **Cross-Example Support.** Supported by ≥2 input-output pairs in the source pack. Single-pair evidence does not pass; flag for human review and record the rule in the spec instead of shipping it.
5. **Stable Phrasing.** Does not depend on volatile specifics (FY numbers, vendor names, deal sponsor, target client) that will rot by the next engagement.

One gate failure rejects the rule. One human-review flag records the rule in the spec but keeps it out of the runtime until reviewed.

## Engagement-leak Failure Modes

These are the named patterns engagement-specific content takes when it slips into a runtime rule. Scan every draft for them:

- **Claim rot.** Rule cites volatile numbers, fiscal-year-specific values, or vendor names that will not survive the next engagement. Example: "EBITDA was $4.2M" should become "subtract one-time grants when normalizing EBITDA."
- **One-source overfit.** Rule's only support is the single past engagement being studied. Flag for human review; do not ship as a general rule.
- **Encyclopedia bloat.** Rule restates general knowledge the base model already has. Example: "Use the indirect method for cash flow statements" — the model knows this; the value-add is what is specific about how this team applies it.
- **Self-citation.** Rule cites the past output as authority for itself. The past output is evidence the rule was applied once; it is not authority for the rule's validity.

## Rule Surface Form

Procedural rules survive across engagements. Instance-specific rules rot on first reuse. Language style enforces the shape:

- **Imperative verbs.** "Start by," "Prefer," "Extract," "Track," "Verify." Not "We noticed that…" or "In the Acme engagement, we…"
- **Abstract role nouns.** "Operand," "period," "entity," "measure," "target metric." Not "Q4 revenue," "the FY24 EBITDA bridge," or "Acme's NWC."
- **Placeholder templates instead of literal values.** `BASE_PERIOD = <fiscal year of the deal>` instead of `BASE_PERIOD = "FY24"`.
- **Discipline-style section headers.** "Normalization Discipline," "Tie-Out Discipline." Not "Steps for the Acme QoE."

Concrete tokens that should never appear in a runtime rule extracted from source material: client names, deal sponsor names, dollar amounts, fiscal-year labels, file paths, identifying dates, target identifiers.

## Examples in the Runtime Skill

Few-shot examples are valid runtime material when they illustrate a rule without replacing it. Use them sparingly — one or two well-chosen examples per skill, anchored to specific rules.

Constraints for source-derived examples that ship in the runtime:

- **Anonymize.** Replace real client names with stand-ins ("a sponsor-owned target," "the buyer"). No real deal figures, real fiscal years, or real identifying details.
- **Label as examples.** The reader must be able to tell at a glance that the concrete content is illustrative, not instructional. Use "Example:" prefixes or dedicated example blocks.
- **Pair with the abstract rule.** An example without its rule encourages pattern-matching to the example rather than the principle. The rule comes first; the example anchors it.

If an example would require real client data or unanonymizable specifics to make sense, it belongs in project docs, not the runtime.

## What Is Not a Source

These pack contents do not yield mechanism-bearing rules. Keep them in project docs; do not feed them into runtime extraction:

- Engagement-letter boilerplate.
- Pure deliverable text without process rationale — the final report with no working papers.
- Generic training material the base model already has.
- Anonymized but otherwise template-shaped material with no unique workflow content.

## Source Provenance

Every rule extracted from a source pack must carry a `source_ref` in the project spec recording its origin. The reference lives in the spec only, never in the runtime `SKILL.md`.

Format:

```
- Rule: <the procedural rule, as it will appear in SKILL.md>
  source_ref: <path/in/pack#section-or-tab>
  transformation_type: <normalization | structural reshape | categorization | calculation | judgment move | caveat pattern | check>
  supporting_pairs: <number of input-output pairs that support this rule>
```

A maintainer can confirm each rule came from a real source-pack location and was supported by the recorded number of pairs. Rules without a `source_ref` do not ship to the runtime.

## Worked Example

Source pack excerpt (process note):

> "In the Acme QoE we normalized EBITDA by removing the $1.2M PPP forgiveness booked in Q2 2023 and adding back the $450K of management fees paid to the sponsor. We then ran a sensitivity assuming the sponsor fees would continue at 50%."

Draft rule (rejected — claim rot, self-citation, no abstract roles):

> "Remove the $1.2M PPP forgiveness and add back $450K of management fees, then sensitize sponsor fees at 50%."

Final rule (procedural, gated, with provenance in spec):

> **Normalization Discipline.** When normalizing EBITDA on a sponsor-owned target, identify (a) one-time pandemic-era subsidies booked above the line, and (b) related-party fees paid to the sponsor. Remove the subsidies as one-time. Add back related-party fees if they will not continue post-close. Sensitize related-party fees at the rate the buyer expects to retain them.

Provenance recorded in the project spec, not in the runtime:

```
- Rule: Normalization Discipline (above)
  source_ref: pack/qoe-process-notes.md#ebitda-normalization
  transformation_type: normalization
  supporting_pairs: 2
```

The final rule names the *types* of items (subsidies, related-party fees), not the dollar amounts. It names the *judgment move* (sensitize at retention rate), not the specific 50%. The procedural shape survives the next engagement.
