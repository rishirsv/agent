import path from "node:path";
import { EVAL_PHASES, type EvalCriterion, type EvalMetadata, type EvalPhase, type EvalRecord } from "../models.ts";
import { CliError, createWorkbench, exists, projectPaths, readJson, readText, requirePortableSkill } from "../project.ts";
import { evalIdentity, listEvalFolders } from "./discovery.ts";
import type { EvalSelector } from "./types.ts";

export { evalIdentity } from "./discovery.ts";

export async function initEvals(project: string): Promise<{ path: string; warnings: string[] }> {
  const root = await requirePortableSkill(project);
  await createWorkbench(root);
  const warnings: string[] = [];
  const p = projectPaths(root);
  const evals = await listEvalFolders(p.evals);
  if (!evals.length) warnings.push("No evals exist yet. Add .meta-skill/evals/<slug>/task.md and criteria.json.");
  return { path: p.evals, warnings };
}

export async function loadEvals(project: string, selector: EvalSelector = {}): Promise<EvalRecord[]> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  if (!(await exists(p.evals))) return [];
  const wantedEvals = selector.eval?.length ? new Set(selector.eval) : undefined;
  const folders = (await listEvalFolders(p.evals)).filter((folder) => !wantedEvals || wantedEvals.has(folder));
  const records = await Promise.all(folders.map((folder) => readEval(path.join(p.evals, folder), folder)));

  const selected = selectEvals(records, selector);
  if (selector.eval?.length && !selected.length) throw new CliError("no evals selected");
  return selected;
}

export async function readEval(evalPath: string, folder = path.basename(evalPath)): Promise<EvalRecord> {
  const { id } = evalIdentity(folder);
  const taskPath = path.join(evalPath, "task.md");
  const criteriaPath = path.join(evalPath, "criteria.json");
  const [taskText, criteriaJson] = await Promise.all([readText(taskPath), readJson<unknown>(criteriaPath)]);
  const task = parseTaskMarkdown(taskText, taskPath);
  const criteria = parseCriteriaJson(criteriaJson, criteriaPath);
  return {
    folder,
    id,
    path: evalPath,
    metadata: {
      title: task.title,
      topics: task.topics,
      capability: task.capability,
      fixtures: criteria.fixtures,
      metadata: criteria.metadata
    },
    criteria: { criteria: criteria.criteria, tests: criteria.tests },
    problemDescription: task.problemDescription,
    outputSpecification: task.outputSpecification,
    task: task.task,
    turns: task.turns
  };
}

function selectEvals(records: EvalRecord[], selector: EvalSelector): EvalRecord[] {
  const wantedEvals = selector.eval?.length ? new Set(selector.eval) : undefined;
  const wantedTopics = selector.topic?.length ? new Set(selector.topic) : undefined;
  return records.filter((item) => {
    if (wantedEvals) {
      if (!wantedEvals.has(item.id) && !wantedEvals.has(item.folder)) return false;
    }
    if (wantedTopics) {
      if (!(item.metadata.topics || []).some((topic) => wantedTopics.has(topic))) return false;
    }
    return true;
  });
}

function parseTaskMarkdown(text: string, filePath: string): { title: string; capability?: string; topics: string[]; problemDescription: string; outputSpecification: string; task: string; turns: Array<{ content: string }> } {
  const title = /^#\s+(.+?)\s*$/m.exec(text)?.[1]?.trim() || "";
  const capability = /^Capability:\s*(.+?)\s*$/m.exec(text)?.[1]?.trim();
  const topics = (/^Topics:\s*(.+?)\s*$/m.exec(text)?.[1] || "")
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);
  const sections = markdownSections(text);
  const problemDescription = sections.find((section) => section.heading === "Problem Description")?.content || "";
  const outputSpecification = sections.find((section) => section.heading === "Output Specification")?.content || "";
  const task = sections.find((section) => section.heading === "Task");
  if (!title) throw new CliError(`${filePath}: task.md must start with a scenario title heading`);
  if (!capability) throw new CliError(`${filePath}: task.md must include Capability: <capability>`);
  if (!problemDescription) throw new CliError(`${filePath}: task.md must include ## Problem Description`);
  if (!outputSpecification) throw new CliError(`${filePath}: task.md must include ## Output Specification`);
  if (!task?.content) throw new CliError(`${filePath}: task.md must include ## Task with task text`);
  const turns = sections
    .filter((section) => /^Turn\s+\d+$/.test(section.heading))
    .sort((a, b) => Number(a.heading.replace(/\D+/g, "")) - Number(b.heading.replace(/\D+/g, "")))
    .map((section) => ({ content: section.content }));
  if (sections.some((section) => !["Problem Description", "Output Specification", "Task"].includes(section.heading) && !/^Turn\s+\d+$/.test(section.heading))) {
    throw new CliError(`${filePath}: task.md supports only ## Problem Description, ## Output Specification, ## Task, and ## Turn N headings`);
  }
  return { title, capability, topics, problemDescription, outputSpecification, task: task.content, turns };
}

function markdownSections(body: string): Array<{ heading: string; content: string }> {
  const matches = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];
  return matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || body.length : body.length;
    return { heading: match[1].trim(), content: body.slice(start, end).trim() };
  });
}

function parseCriteriaJson(value: unknown, filePath: string): { fixtures: EvalMetadata["fixtures"]; metadata: Record<string, unknown>; tests: string[]; criteria: EvalCriterion[] } {
  const data = objectValue(value, filePath, "criteria.json");
  const criteriaValue = data.criteria;
  if (!Array.isArray(criteriaValue)) throw new CliError(`${filePath}: field 'criteria' must be a list`);
  return {
    fixtures: optionalFixtureList(data.fixtures, filePath),
    metadata: data.metadata === undefined ? {} : objectValue(data.metadata, filePath, "field 'metadata'"),
    tests: optionalStringList(data.tests, filePath, "tests"),
    criteria: criteriaValue.map((item, index) => parseCriterion(item, index, filePath))
  };
}

function parseCriterion(value: unknown, index: number, filePath: string): EvalCriterion {
  const item = objectValue(value, filePath, `criteria[${index}]`);
  return {
    criterion: stringField(item, "criterion", filePath, `criteria[${index}]`),
    phase: parseEvalPhase(stringField(item, "phase", filePath, `criteria[${index}]`), filePath),
    dimension: stringField(item, "dimension", filePath, `criteria[${index}]`),
    question: stringField(item, "question", filePath, `criteria[${index}]`),
    evidence: stringField(item, "evidence", filePath, `criteria[${index}]`)
  };
}

function parseEvalPhase(value: string, filePath: string): EvalPhase {
  if ((EVAL_PHASES as readonly string[]).includes(value)) return value as EvalPhase;
  throw new CliError(`${filePath}: criteria Phase must be Quality, Implementation, or Validation`);
}

function optionalFixtureList(value: unknown, filePath: string): EvalMetadata["fixtures"] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new CliError(`${filePath}: field 'fixtures' must be a list`);
  return value.map((item, index) => {
    const fixture = objectValue(item, filePath, `fixtures[${index}]`);
    const fixturePath = stringField(fixture, "path", filePath, `fixtures[${index}]`);
    const description = optionalStringField(fixture, "description", filePath, `fixtures[${index}]`);
    return { path: fixturePath, ...(description ? { description } : {}) };
  });
}

function optionalStringList(value: unknown, filePath: string, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) throw new CliError(`${filePath}: field '${field}' must be a list of strings`);
  return value;
}

function stringField(source: Record<string, unknown>, key: string, filePath: string, label: string): string {
  const value = source[key];
  if (typeof value !== "string" || !value.trim()) throw new CliError(`${filePath}: ${label}.${key} must be a non-empty string`);
  return value;
}

function optionalStringField(source: Record<string, unknown>, key: string, filePath: string, label: string): string | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new CliError(`${filePath}: ${label}.${key} must be a string`);
  return value;
}

function objectValue(value: unknown, filePath: string, label: string): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  throw new CliError(`${filePath}: ${label} must be an object`);
}
