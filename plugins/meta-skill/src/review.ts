import { promises as fs } from "node:fs";
import path from "node:path";
import type { Issue, LintReport } from "./models";
import { lintProject } from "./lint";
import { nextSequencedId, projectPaths, readText, requirePortableSkill, writeJson } from "./project";
import { materializeReviewReport } from "./reporting";

type Vector = { name: string; score: number; max: number; reasoning: string };
type Suggestion = { priority: "high" | "medium" | "low"; vector: string; issue: string; suggested_fix: string };

export async function reviewProject(project: string): Promise<{ reviewId: string; reviewRoot: string; score: number; report: string; data: Record<string, unknown> }> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  const reviewId = await nextSequencedId(p.reviews, "quality-review");
  const reviewRoot = path.join(p.reviews, reviewId);
  await fs.mkdir(reviewRoot, { recursive: true });

  const skillText = await readText(path.join(root, "SKILL.md"));
  const lint = await lintProject(root, { executeTests: false });
  await writeJson(path.join(reviewRoot, "lint.json"), lint);

  const discoveryVectors = discoveryReview(skillText);
  const implementationVectors = implementationReview(skillText, lint);
  const validationChecks = validationChecksFromLint(lint);
  const discovery = percent(discoveryVectors);
  const implementation = percent(implementationVectors);
  const validation = validationPercent(lint);
  let quality = Math.round(discovery * 0.35 + implementation * 0.45 + validation * 0.2);
  if (lint.failures.length) quality = Math.min(quality, 69);

  const suggestions = suggestionsFor(discoveryVectors, implementationVectors, lint);
  const data = {
    schema_version: 1,
    rubric_version: "meta-skill-quality-2026-06",
    reviewer: {
      name: "meta-skill-reviewer",
      read_only: true,
      status: "deterministic-fallback",
      reason: "The local CLI cannot invoke a reviewer subagent here, so Discovery and Implementation use explicit textual signals only."
    },
    inputs: {
      skill_md: "SKILL.md",
      lint_json: "lint.json",
      lint_failures: lint.failures.length,
      lint_warnings: lint.warnings.length
    },
    quality: {
      score: quality,
      discovery,
      implementation,
      validation
    },
    discovery: {
      assessment: assessment(discoveryVectors, "Discovery"),
      vectors: discoveryVectors
    },
    implementation: {
      assessment: assessment(implementationVectors, "Implementation"),
      vectors: implementationVectors
    },
    validation: {
      assessment: lint.failures.length ? "Deterministic validation found blocking failures." : lint.warnings.length ? "Deterministic validation passed with warnings." : "Deterministic validation passed without warnings.",
      checks: validationChecks
    },
    suggestions
  };
  await writeJson(path.join(reviewRoot, "review.json"), data);
  const report = await materializeReviewReport(reviewRoot, data);
  return { reviewId, reviewRoot, score: quality, report, data };
}

function discoveryReview(skillText: string): Vector[] {
  const frontmatter = frontmatterText(skillText).toLowerCase();
  const description = descriptionText(skillText).toLowerCase();
  const all = skillText.toLowerCase();
  return [
    vector("specificity", /\b(use when|asked to|for)\b/.test(description) && description.split(/\s+/).length >= 8, "Description names a concrete use case rather than a generic capability."),
    vector("completeness", Boolean(description && /\bnot for\b/.test(description)), "Description includes both trigger and non-trigger context."),
    vector("trigger_term_quality", /\b(use when|when the user|asks? to|needs?)\b/.test(description || frontmatter), "Trigger language is easy for an agent to match."),
    vector("distinctiveness_conflict_risk", /\bnot for\b/.test(description) || /\badjacent|handoff|route|boundary\b/.test(all), "Adjacent boundaries reduce routing conflict risk."),
    vector("boundary_clarity", /\bnot for\b/.test(all) || /\bboundar/.test(all), "The skill names stop conditions or non-trigger cases.")
  ];
}

function implementationReview(skillText: string, lint: LintReport): Vector[] {
  const all = skillText.toLowerCase();
  return [
    vector("conciseness", skillText.length < 9000 && skillText.split(/\r?\n/).length <= 220, "Runtime instructions fit a compact skill budget."),
    vector("actionability", /\b1\./.test(skillText) || /\bworkflow\b/.test(all) || /\bsteps?\b/.test(all), "The skill gives executable steps or named workflow guidance."),
    vector("workflow_clarity", /\b(workflow|process|loop|sequence|beginner path)\b/.test(all), "The workflow is named or staged clearly."),
    vector("progressive_disclosure", resourcesAreLinked(skillText), "Runtime references, scripts, and assets are directly linked or absent."),
    vector("resource_and_script_hygiene", !lint.warnings.some((warning) => /runtime scripts|runtime .* should be directly linked/i.test(warning.message)), "Lint found no runtime resource or script hygiene warning."),
    vector("controls_and_human_gates", /\bapproval|human|gate|confirm|do not\b/.test(all), "The skill includes explicit human gates or stop rules."),
    vector("evidence_and_eval_readiness", /\.meta-skill|lint|eval|review|evidence/.test(all), "The skill can route work through evidence, lint, review, or eval when needed.")
  ];
}

function vector(name: string, passed: boolean, reasoning: string): Vector {
  return {
    name,
    score: passed ? 3 : 1,
    max: 3,
    reasoning: passed ? reasoning : `${reasoning} This signal is missing or weak in the current text.`
  };
}

function validationChecksFromLint(lint: LintReport): Array<{ name: string; status: "passed" | "warning" | "failed"; message: string; path?: string }> {
  const checks: Array<{ name: string; status: "passed" | "warning" | "failed"; message: string; path?: string }> = [];
  for (const failure of lint.failures) checks.push(checkFromIssue(failure));
  for (const warning of lint.warnings) checks.push(checkFromIssue(warning));
  if (!checks.some((check) => check.name === "frontmatter_valid")) checks.unshift({ name: "frontmatter_valid", status: "passed", message: "SKILL.md frontmatter parsed with required fields present." });
  if (!checks.some((check) => check.name === "body_present")) checks.push({ name: "body_present", status: "passed", message: "SKILL.md body is present." });
  return checks;
}

function checkFromIssue(issue: Issue): { name: string; status: "warning" | "failed"; message: string; path?: string } {
  return {
    name: checkName(issue.message),
    status: issue.severity === "failure" ? "failed" : "warning",
    message: issue.message,
    path: issue.path
  };
}

function checkName(message: string): string {
  if (/frontmatter|description|skill name|name .*folder/.test(message)) return "frontmatter_valid";
  if (/body is missing/.test(message)) return "body_present";
  if (/trigger context/.test(message)) return "description_trigger_hint";
  if (/not for/.test(message)) return "description_boundary";
  if (/long/.test(message)) return "skill_md_line_count";
  if (/directly linked/.test(message)) return "runtime_resource_links";
  if (/agents\/openai\.yaml/.test(message)) return "agent_manifest_shape";
  if (/outside the portable payload/.test(message)) return "portable_payload_contract";
  if (/scenario/.test(message)) return "scenario_validation";
  if (/judge/.test(message)) return "judge_validation";
  if (/test/.test(message)) return "test_validation";
  return message.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "validation_check";
}

function suggestionsFor(discovery: Vector[], implementation: Vector[], lint: LintReport): Suggestion[] {
  const suggestions: Suggestion[] = [];
  for (const vector of [...discovery, ...implementation].filter((item) => item.score < item.max)) {
    suggestions.push({
      priority: vector.name === "boundary_clarity" || vector.name === "actionability" ? "high" : "medium",
      vector: vector.name,
      issue: vector.reasoning,
      suggested_fix: suggestedFix(vector.name)
    });
  }
  for (const failure of lint.failures) {
    suggestions.push({
      priority: "high",
      vector: checkName(failure.message),
      issue: failure.message,
      suggested_fix: "Fix the deterministic lint failure, then rerun `meta-skill lint` and `meta-skill review`."
    });
  }
  for (const warning of lint.warnings.slice(0, 6)) {
    suggestions.push({
      priority: "low",
      vector: checkName(warning.message),
      issue: warning.message,
      suggested_fix: "Decide whether this warning affects runtime quality; if it does, update the skill text or workbench evidence."
    });
  }
  return suggestions;
}

function suggestedFix(name: string): string {
  const fixes: Record<string, string> = {
    specificity: "Rewrite the description around one concrete user intent and target artifact.",
    completeness: "Add a compact `not for ...` clause beside the trigger description.",
    trigger_term_quality: "Start the description with `Use when ...` and name the request shape an agent should match.",
    distinctiveness_conflict_risk: "Name adjacent workflows and when this skill should hand off or stay dormant.",
    boundary_clarity: "Add an explicit boundary section or frontmatter `not for` language.",
    conciseness: "Move conditional detail into directly linked references and keep the runtime path short.",
    actionability: "Add ordered steps or a named workflow with concrete actions.",
    workflow_clarity: "Name the major phases so an agent can move through the skill predictably.",
    progressive_disclosure: "Link every runtime reference, script, or asset directly from `SKILL.md`.",
    resource_and_script_hygiene: "Add tests or links for runtime scripts and reusable resources.",
    controls_and_human_gates: "Add explicit approval gates for external writes, promotion, release, package, or publish actions.",
    evidence_and_eval_readiness: "Point review/eval/release-facing changes to lint, eval, judge, or human-feedback evidence."
  };
  return fixes[name] || "Tighten the skill text around this rubric vector.";
}

function percent(vectors: Vector[]): number {
  const max = vectors.reduce((sum, item) => sum + item.max, 0);
  const score = vectors.reduce((sum, item) => sum + item.score, 0);
  return max ? Math.round((score / max) * 100) : 0;
}

function validationPercent(lint: LintReport): number {
  const total = lint.failures.length + lint.warnings.length + 8;
  const penalty = lint.failures.length * 3 + lint.warnings.length;
  return Math.max(0, Math.round(((total - penalty) / total) * 100));
}

function assessment(vectors: Vector[], label: string): string {
  const missing = vectors.filter((vector) => vector.score < vector.max).map((vector) => vector.name);
  if (!missing.length) return `${label} signals are strong on the deterministic rubric.`;
  return `${label} needs attention on: ${missing.join(", ")}.`;
}

function frontmatterText(skillText: string): string {
  if (!skillText.startsWith("---\n")) return "";
  const end = skillText.indexOf("\n---\n", 4);
  return end === -1 ? "" : skillText.slice(4, end);
}

function descriptionText(skillText: string): string {
  const match = /^description:\s*(.+)$/im.exec(frontmatterText(skillText));
  return match?.[1]?.replace(/^['"]|['"]$/g, "").trim() || "";
}

function resourcesAreLinked(skillText: string): boolean {
  const mentionsResource = /\b(references|scripts|assets)\//.test(skillText);
  if (!mentionsResource) return true;
  return /\]\((references|scripts|assets)\//.test(skillText);
}
