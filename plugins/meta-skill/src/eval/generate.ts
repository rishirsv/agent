import path from "node:path";
import { markdownTableHeadersMatch, normalizeMarkdownTableHeader, splitMarkdownTableRow } from "../markdown-table.ts";
import { ensureDir, projectPaths, readText, requirePortableSkill, slugify, writeJson, writeText } from "../project.ts";
import { listEvalFolders } from "./discovery.ts";

interface ScenarioSeed {
  scenario: string;
  phaseFocus: string;
  capability: string;
  userTaskShape: string;
  baselineRisk: string;
  expectedSkillLift: string;
  dimensionsExercised: string;
  sourceBasis: string;
}

export interface GenerateEvalsResult {
  scenariosPath: string;
  created: string[];
  skipped: string[];
}

const SCENARIO_COLUMNS = [
  "scenario",
  "phase focus",
  "capability",
  "user task shape",
  "baseline risk",
  "expected skill lift",
  "dimensions exercised",
  "source basis"
];

export async function generateEvalsFromScenarios(project: string): Promise<GenerateEvalsResult> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  const scenariosPath = p.evalScenarios;
  const text = await readText(scenariosPath);
  const seeds = parseScenarioPlan(text).filter((seed) => !isPlaceholder(seed.scenario));
  const existing = await listEvalFolders(p.evals);
  const existingSlugs = new Set(existing);
  const created: string[] = [];
  const skipped: string[] = [];

  await ensureDir(p.evals);
  for (const seed of seeds) {
    const slug = slugify(seed.scenario, "eval");
    if (existingSlugs.has(slug)) {
      skipped.push(seed.scenario);
      continue;
    }
    const folder = slug;
    const evalRoot = path.join(p.evals, folder);
    await writeText(path.join(evalRoot, "task.md"), taskDraft(seed));
    await writeJson(path.join(evalRoot, "criteria.json"), criteriaDraft(seed));
    existingSlugs.add(slug);
    created.push(folder);
  }

  return { scenariosPath, created, skipped };
}

function parseScenarioPlan(text: string): ScenarioSeed[] {
  const lines = text.split(/\r?\n/);
  const seeds: ScenarioSeed[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const header = splitMarkdownTableRow(lines[index]).map(normalizeMarkdownTableHeader);
    if (!markdownTableHeadersMatch(header, SCENARIO_COLUMNS)) continue;
    index += 2;
    while (index < lines.length) {
      const cells = splitMarkdownTableRow(lines[index]);
      if (!cells.length) break;
      if (cells.length < SCENARIO_COLUMNS.length) break;
      seeds.push({
        scenario: cells[0],
        phaseFocus: cells[1],
        capability: cells[2],
        userTaskShape: cells[3],
        baselineRisk: cells[4],
        expectedSkillLift: cells[5],
        dimensionsExercised: cells[6],
        sourceBasis: cells[7]
      });
      index += 1;
    }
  }
  return seeds;
}

function isPlaceholder(value: string): boolean {
  return !value.trim() || /^<.*>$/.test(value.trim());
}

function taskDraft(seed: ScenarioSeed): string {
  const expected = seed.expectedSkillLift || `The skill improves the ${seed.capability || seed.scenario} workflow.`;
  return `# ${seed.scenario}

Capability: ${seed.capability || seed.scenario}
Topics: ${slugify(seed.phaseFocus || "implementation", "implementation")}

## Problem Description

${seed.userTaskShape || "Refine this generated problem description into realistic user context before running."}

## Output Specification

${expected}

## Task

${seed.userTaskShape || seed.scenario}

Return an output that satisfies the specification above.
`;
}

function criteriaDraft(seed: ScenarioSeed): Record<string, unknown> {
  return {
    fixtures: [],
    tests: [],
    metadata: {
      generated_from: ".meta-skill/eval-scenarios.md",
      phase_focus: seed.phaseFocus,
      baseline_risk: seed.baselineRisk,
      expected_skill_lift: seed.expectedSkillLift,
      dimensions_exercised: seed.dimensionsExercised,
      source_basis: seed.sourceBasis
    },
    criteria: criteriaRows(seed)
  };
}

function criteriaRows(seed: ScenarioSeed): Array<{ criterion: string; phase: string; dimension: string; question: string; evidence: string }> {
  const dimensions = splitDimensions(seed.dimensionsExercised, seed.phaseFocus);
  const primary = dimensions[0] || { phase: phaseName(seed.phaseFocus || "Implementation"), dimension: "Actionability" };
  const rows = [
    {
      criterion: seed.capability ? `Addresses ${seed.capability}` : "Addresses scenario capability",
      phase: primary.phase,
      dimension: primary.dimension,
      question: `Does the response satisfy the ${seed.capability || seed.scenario} capability?`,
      evidence: "response"
    }
  ];
  const seenDimensions = new Set([`${primary.phase}:${primary.dimension}`.toLowerCase()]);
  for (const dimension of dimensions.slice(1)) {
    const key = `${dimension.phase}:${dimension.dimension}`.toLowerCase();
    if (seenDimensions.has(key)) continue;
    seenDimensions.add(key);
    rows.push({
      criterion: `Exercises ${dimension.dimension}`,
      phase: dimension.phase,
      dimension: dimension.dimension,
      question: criteriaQuestion(dimension.phase, dimension.dimension, seed),
      evidence: "response, transcript, tests"
    });
  }
  if (seed.baselineRisk) {
    rows.push({
      criterion: "Avoids baseline risk",
      phase: "Validation",
      dimension: dimensionNamed(dimensions, "Prohibited Behavior Avoidance") || "Prohibited Behavior Avoidance",
      question: `Does the response avoid this baseline risk: ${seed.baselineRisk}?`,
      evidence: "response"
    });
  }
  if (seed.sourceBasis) {
    rows.push({
      criterion: "Uses source basis",
      phase: "Validation",
      dimension: dimensionNamed(dimensions, "Source Faithfulness") || "Source Faithfulness",
      question: `Does the response ground its behavior in ${seed.sourceBasis}?`,
      evidence: "response"
    });
  }
  return withBasePhaseCoverage(rows, seed);
}

function splitDimensions(text: string, defaultPhase: string): Array<{ phase: string; dimension: string }> {
  return text
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter((item) => item && !isPlaceholder(item))
    .map((item) => {
      const parts = item.split(":").map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 2) return { phase: phaseName(parts[0]), dimension: parts.slice(1).join(": ") };
      return { phase: phaseName(defaultPhase || "Implementation"), dimension: item };
    });
}

function phaseName(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("quality")) return "Quality";
  if (normalized.includes("validation")) return "Validation";
  return "Implementation";
}

function dimensionNamed(dimensions: Array<{ dimension: string }>, wanted: string): string | undefined {
  return dimensions.find((item) => item.dimension.toLowerCase() === wanted.toLowerCase())?.dimension;
}

function criteriaQuestion(phase: string, dimension: string, seed: ScenarioSeed): string {
  const target = seed.expectedSkillLift || seed.capability || seed.scenario;
  if (phase === "Quality") return `Is the response strong on ${dimension} for ${target}?`;
  if (phase === "Validation") return `Can the saved evidence validate ${dimension} for ${target}?`;
  return `Does the response implement ${dimension} for ${target}?`;
}

function withBasePhaseCoverage(
  rows: Array<{ criterion: string; phase: string; dimension: string; question: string; evidence: string }>,
  seed: ScenarioSeed
): Array<{ criterion: string; phase: string; dimension: string; question: string; evidence: string }> {
  const existing = new Set(rows.map((row) => row.phase));
  const baseRows = [
    { phase: "Quality", dimension: "Specificity", criterion: "Specific output quality" },
    { phase: "Implementation", dimension: "Actionability", criterion: "Actionable implementation" },
    { phase: "Validation", dimension: "Structural correctness", criterion: "Validatable result" }
  ];
  for (const base of baseRows) {
    if (existing.has(base.phase)) continue;
    rows.push({
      criterion: base.criterion,
      phase: base.phase,
      dimension: base.dimension,
      question: criteriaQuestion(base.phase, base.dimension, seed),
      evidence: base.phase === "Validation" ? "response, transcript, tests" : "response"
    });
  }
  return rows;
}
