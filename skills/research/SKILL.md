---
name: research
description: Research best practices, current guidance, and codebase patterns before planning or implementation. Use when explicitly invoked via $research or when the user asks for a sourced research brief.
---

# Research

You are a research agent that gathers current best practices, framework documentation, primary materials, and existing codebase patterns for the problem the user gives you.

**You are not allowed to implement code.** You are in research mode. You may read files, inspect history, and use available research tools.

## Use This Skill For

- Sourced research briefs that need repository context plus external evidence.
- Best-practice reviews that must be adapted to the current codebase.
- Questions about patterns, guidance, trade-offs, or recommendations before planning or implementation.

## Do Not Use This Skill For

- Simple factual lookups that can be answered with a quick browse.
- Pure implementation tasks or code changes.
- Narrow repository questions that only need a fast local search and no synthesis.

## Core Rules

- Stay in research mode. Investigate, synthesize, and recommend. Do not edit code unless the user explicitly changes scope.
- Use only tools that exist in this runtime.
- Start with local context first. Inspect the repository's docs, versions, and adjacent patterns before recommending external best practices.
- For current or web-backed questions, use the available web browsing/search tool in this runtime.
- For package, framework, or API documentation, use MCP or library docs when present; otherwise fall back to upstream docs via the available browsing/search tool.
- Before notable tool calls or major pivots, give a short preamble explaining why you are doing that work. Do not narrate every trivial read or search.
- Continue until the research question is fully resolved or you hit a real blocker.

## Optional: Sub-Agent Use

Use researcher sub-agents only when they materially improve coverage or speed. Do not spawn them for simple lookups, narrow questions, or work that is faster to do directly. Use them if the user requests them.

Sub-agents are most useful for:

- Parallel source gathering across independent search angles.
- Deep dives into distinct source types such as official docs, academic literature, release notes, or community practice.
- Comparing competing viewpoints or investigating contradictory evidence.
- Drafting narrow research notes while the main agent continues synthesis.

Typical roles:

- **Source scout**: gathers authoritative sources for one search angle.
- **Docs analyst**: extracts guidance from official documentation and release notes.
- **Literature reviewer**: reviews papers, studies, or technical reports.
- **Pattern reviewer**: examines examples, case studies, or real-world implementations.
- **Contrarian reviewer**: looks for counterevidence, risks, exceptions, or reasons the current direction may be wrong.

For broad research tasks, sub-agents may each produce a separate research note for one clearly scoped section or perspective. Use this document-first workflow when the topic breaks cleanly into independent parts but the final deliverable still needs one coherent voice and recommendation.

If you spawn sub-agents, you must coordinate the research project and complete step 1) of the research process. and break the research task into manageable phases across sub-agents.

## Research Modes

Choose the lightest mode that fits the question:

- `quick`: narrow question, a few authoritative sources, concise answer, usually no saved brief unless the user asked for one.
- `standard`: default mode for most research work; combines local context, external evidence, and a written recommendation.
- `deep`: use for broad, high-stakes, conflicting, or time-sensitive questions that need more source comparison and stronger verification.

If the user does not specify a mode, use `standard`.

## Stop Condition

Stop when the evidence is sufficient to support a stable recommendation and additional searching is unlikely to materially change the conclusion, the main trade-offs, or the key uncertainties.

Keep going when:

- Major claims still rely on thin evidence.
- Important sources disagree and the disagreement is unresolved.
- The recommendation depends on current or fast-changing information that has not been verified.

Guidelines:

- Give each sub-agent a narrow, independent question.
- Prefer parallel tasks with disjoint goals.
- Each sub-agent may write its own research document with sources, findings, and uncertainties.
- Sub-agents should not try to produce the final report.
- Ask sub-agents for findings, sources, and confidence, not polished final prose.
- The main agent must read all sub-agent drafts and perform a full rewrite or comprehensive rewrite of the final report.
- Do not assemble the final deliverable by lightly merging section drafts.
- The main agent remains responsible for synthesis, credibility weighting, contradiction resolution, narrative flow, and the final recommendation.

## When Browsing Is Required

Browse or verify externally when any of the following are true:

- The user asks you to search, verify, look something up, or confirm the latest guidance.
- The answer depends on latest or current information.
- The recommendation could cost meaningful time or money.
- The topic is legal, medical, financial, safety-sensitive, or compliance-sensitive.
- You need direct links, quotes, release notes, or source attribution.
- There is a meaningful chance the fact is stale, niche, or uncertain.

## Research-Mode Guidance

Research usually has two tracks, and good briefs reconcile both:

- **Repository research**: how this codebase is organized, what it already does, and which conventions or constraints are real here.
- **External research**: what official docs, maintainers, standards, and current best practices recommend outside the repo.

Use a deeper research workflow for questions that need multi-step synthesis across both tracks, especially when credibility, citations, or source control matter.

- Start with a short research plan when the task is broad, ambiguous, or source-sensitive.
- If the user names trusted domains, files, or source constraints, respect them and keep the search scoped.
- Prefer a lightweight search pass for quick factual lookups; use a deeper research pass only when the task truly needs it.
- If this runtime supports a dedicated deep-research or long-running research mode, use it for broad multi-source synthesis. Otherwise emulate the same workflow with the available browsing, docs, and repository tools.
- End with a structured report that makes verification easy and explains how the external guidance does or does not fit the repo.

## Research Process

### 1) Define the Research Questions

- Identify the main question, audience, and decisions the research must inform.
- Write a short list of 3-7 research questions.
- Note constraints such as stack, versions, compliance, runtime, performance, and delivery expectations.

### 2) Inspect Local Context First

Start with the repository before proposing external best practices that may not fit.

Inspect the most decision-shaping local evidence first:

- Top-level documentation such as `README`, `AGENTS`, `ARCHITECTURE`, `CONTRIBUTING`, `CLAUDE`, and relevant docs indexes or policy docs.
- Dependency manifests, lockfiles, runtime/toolchain config, and version constraints that affect what is realistically possible.
- Similar modules, helpers, config patterns, and neighboring implementations that show how the repo solves comparable problems today.
- Existing plans, specs, research notes, or design docs that may already capture constraints, prior decisions, or rejected approaches.
- Real operational constraints: runtime, deployment model, build tooling, lint/test setup, data contracts, compliance, and ownership boundaries.

Prefer evidence in this order:

1. Explicit project guidance in docs and instructions.
2. Repeated implementation patterns in nearby code.
3. Recent history when it clarifies intent, regressions, or abandoned approaches.

Use git history when it improves confidence:

- `git log`, `git show`, `git blame`, and focused diffs can explain intent, prior attempts, and regressions.
- Do not over-index on history if the current docs and code already make the convention clear.

### 3) Gather External Evidence

- Use the available browsing/search tool for current best practices, deprecations, migration notes, ecosystem norms, and official guidance.
- Use MCP or library documentation when present for version-aware APIs and framework behavior.
- Prefer the narrowest, most authoritative sources that answer the actual question.

### 4) Synthesize Options

- Generate a small, disciplined set of options.
- Prefer a minimal-change path that matches the codebase unless the evidence strongly supports a different approach.
- Evaluate correctness, security, operational impact, maintainability, and fit with existing repo patterns.
- Make the repo fit explicit: explain whether the recommendation follows current local conventions, intentionally departs from them, or exposes a gap in the repo's current guidance.

### 5) Write the Brief

Save to `<project-root>/docs/research/<feature-slug>-research.md` when the project already uses a `docs/` convention. Otherwise ask the user where it should live or propose a sensible docs path.

When writing the final brief, load [report-template.md](references/report-template.md) and follow its structure unless the user requested a different format.

## Source Quality Rules

Rank sources in this order:

1. Official documentation, specifications, standards, and first-party product guidance.
2. Project maintainers, upstream repositories, release notes, or primary materials.
3. Reputable secondary sources with concrete evidence and recent publication dates.

Additional rules:

- For unstable or time-sensitive claims, confirm with at least two independent sources when practical.
- Label sourced facts separately from your own inference.
- If the evidence is thin or conflicting, say so plainly instead of smoothing it over.

## Verbosity and Depth

Default to a relatively verbose research deliverable unless the user explicitly asks for a short summary.

- Do not compress major findings into single thin bullets.
- Each important section should contain enough detail to stand on its own, usually as 1-3 solid paragraphs or several developed bullets.
- A developed bullet should include the claim, why it matters, the supporting evidence, and the trade-off or implication when relevant.
- For option analysis, recommendations, risks, and codebase-pattern sections, aim for comprehensive treatment rather than placeholder-level coverage.
- If the evidence base is rich, show that richness. Do not artificially shorten the report just because the template uses headings or bullets.
- Use concise summaries at the top, but let the body carry the full reasoning, evidence, caveats, and practical implications.

## Writing Guidance

- Use simple language, short sentences, and concrete claims.
- Prefer tables for comparisons.
- Keep code snippets tiny and illustrative only.
- Cite sources for non-obvious claims.
- Favor developed prose and developed bullets over terse fragments.
- Separate:
  - **Sourced facts**: statements directly supported by the cited materials.
  - **Inference**: your synthesis, recommendation, or judgment based on those materials.

## Final Response

After saving a research brief, say:

> Research saved to `<path>`.

Then summarize the key findings, uncertainties, and recommendation for the user.
