import { promises as fs } from "node:fs";
import path from "node:path";
import type { CaseCriteria, CaseFixture, CaseMetadata, CaseRecord, CaseType } from "../models.ts";
import { CliError, createWorkbench, exists, projectPaths, readText, requirePortableSkill } from "../project.ts";
import type { EvalSelector } from "./types.ts";

export async function initEvals(project: string): Promise<{ path: string; warnings: string[] }> {
  const root = await requirePortableSkill(project);
  await createWorkbench(root);
  const warnings: string[] = [];
  const p = projectPaths(root);
  const cases = (await exists(p.cases)) ? (await fs.readdir(p.cases, { withFileTypes: true })).filter((entry) => entry.isDirectory()) : [];
  if (!cases.length) warnings.push("No cases exist yet. Add .meta-skill/evals/cases/<ID-slug>/case.md.");
  return { path: p.evals, warnings };
}

export async function loadCases(project: string, selector: EvalSelector = {}): Promise<CaseRecord[]> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  if (!(await exists(p.cases))) return [];
  const dirs = (await fs.readdir(p.cases, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const records: CaseRecord[] = [];
  for (const dirent of dirs) {
    records.push(await readCase(path.join(p.cases, dirent.name), dirent.name));
  }

  const selected = selectCases(records, selector);
  if (selector.case?.length && !selected.length) throw new CliError("no cases selected");
  return selected;
}

export async function loadRunCaseSnapshots(project: string, runRoot: string, selector: EvalSelector = {}): Promise<CaseRecord[]> {
  const root = await requirePortableSkill(project);
  const casesRoot = path.join(runRoot, "cases");
  if (!(await exists(casesRoot))) return loadCases(root, selector);
  const dirs = (await fs.readdir(casesRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const records: CaseRecord[] = [];
  for (const dirent of dirs) {
    const casePath = path.join(casesRoot, dirent.name);
    if (await exists(path.join(casePath, "case.md"))) records.push(await readCase(casePath, dirent.name));
  }

  const selected = selectCases(records, selector);
  if (selector.case?.length && !selected.length) throw new CliError("no cases selected");
  return selected;
}

export async function readCase(casePath: string, folder = path.basename(casePath)): Promise<CaseRecord> {
  const { id, type } = caseIdentity(folder);
  const parsed = parseCaseMarkdown(await readText(path.join(casePath, "case.md")), path.join(casePath, "case.md"));
  return { folder, id, type, path: casePath, ...parsed };
}

export function caseIdentity(folder: string): { id: string; type: CaseType } {
  const match = /^([RFG]\d+)-[a-z0-9][a-z0-9-]*$/.exec(folder);
  if (!match) throw new CliError(`case folder must use <ID>-<slug> with R/F/G prefix: ${folder}`);
  const id = match[1];
  const type = id.startsWith("R") ? "regression" : id.startsWith("F") ? "failure_mode" : "gate";
  return { id, type };
}

function selectCases(records: CaseRecord[], selector: EvalSelector): CaseRecord[] {
  const wantedCases = selector.case?.length ? new Set(selector.case) : undefined;
  const wantedTopics = selector.topic?.length ? new Set(selector.topic) : undefined;
  return records.filter((item) => {
    if (wantedCases) {
      if (!wantedCases.has(item.id) && !wantedCases.has(item.folder)) return false;
    }
    if (selector.type) {
      const prefix = item.id.charAt(0);
      if (prefix !== selector.type) return false;
    }
    if (wantedTopics) {
      if (!(item.metadata.topics || []).some((topic) => wantedTopics.has(topic))) return false;
    }
    return true;
  });
}

function parseCaseMarkdown(text: string, filePath: string): { metadata: CaseMetadata; criteria: CaseCriteria; task: string; turns: Array<{ content: string }> } {
  if (!text.startsWith("---\n")) throw new CliError(`${filePath}: case.md must start with YAML frontmatter`);
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) throw new CliError(`${filePath}: case.md frontmatter is not closed`);
  const frontmatter = parseYamlObject(text.slice(4, end), filePath);
  const body = text.slice(end + 5);
  const title = stringField(frontmatter.title);
  const criteria = objectField(frontmatter.criteria);
  const metadata: CaseMetadata = {
    title,
    topics: arrayOfStrings(frontmatter.topics),
    capability: frontmatter.capability === undefined ? undefined : stringField(frontmatter.capability),
    fixtures: arrayOfFixtures(frontmatter.fixtures),
    metadata: objectField(frontmatter.metadata, true)
  };
  return {
    metadata,
    criteria: {
      what_it_tests: criteria.what_it_tests === undefined ? undefined : stringField(criteria.what_it_tests),
      expected_behavior: stringField(criteria.expected_behavior),
      assertions: arrayOfStrings(criteria.assertions),
      tests: arrayOfStrings(criteria.tests),
      judges: arrayOfJudges(criteria.judges),
      rubric: criteria.rubric === undefined ? undefined : stringField(criteria.rubric)
    },
    ...parseTurns(body, filePath)
  };
}

function parseTurns(body: string, filePath: string): { task: string; turns: Array<{ content: string }> } {
  const matches = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];
  const sections = matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || body.length : body.length;
    return { heading: match[1].trim(), content: body.slice(start, end).trim() };
  });
  const task = sections.find((section) => section.heading === "Task");
  if (!task?.content) throw new CliError(`${filePath}: case.md must include ## Task with task text`);
  const turns = sections
    .filter((section) => /^Turn\s+\d+$/.test(section.heading))
    .sort((a, b) => Number(a.heading.replace(/\D+/g, "")) - Number(b.heading.replace(/\D+/g, "")))
    .map((section) => ({ content: section.content }));
  if (sections.some((section) => section.heading !== "Task" && !/^Turn\s+\d+$/.test(section.heading))) {
    throw new CliError(`${filePath}: case.md supports only ## Task and ## Turn N headings`);
  }
  return { task: task.content, turns };
}

interface YamlLine {
  indent: number;
  text: string;
}

function parseYamlObject(source: string, filePath: string): Record<string, unknown> {
  const lines = source
    .split(/\r?\n/)
    .map((raw) => ({ indent: raw.match(/^ */)?.[0].length || 0, text: raw.trim() }))
    .filter((line) => line.text && !line.text.startsWith("#"));
  const [value] = parseYamlNode(lines, 0, 0, filePath);
  return objectField(value);
}

function parseYamlNode(lines: YamlLine[], index: number, indent: number, filePath: string): [unknown, number] {
  if (index >= lines.length || lines[index].indent < indent) return [{}, index];
  if (lines[index].indent === indent && lines[index].text.startsWith("- ")) return parseYamlArray(lines, index, indent, filePath);
  return parseYamlMap(lines, index, indent, filePath);
}

function parseYamlMap(lines: YamlLine[], index: number, indent: number, filePath: string): [Record<string, unknown>, number] {
  const out: Record<string, unknown> = {};
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent || line.text.startsWith("- ")) break;
    if (line.indent > indent) throw new CliError(`${filePath}: invalid frontmatter indentation near ${line.text}`);
    const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line.text);
    if (!match) throw new CliError(`${filePath}: invalid frontmatter line: ${line.text}`);
    const key = match[1];
    const rest = match[2] || "";
    if (rest) {
      out[key] = parseYamlScalar(rest);
      index += 1;
    } else {
      const nextIndent = lines[index + 1]?.indent;
      if (nextIndent === undefined || nextIndent <= indent) {
        out[key] = null;
        index += 1;
      } else {
        const parsed = parseYamlNode(lines, index + 1, nextIndent, filePath);
        out[key] = parsed[0];
        index = parsed[1];
      }
    }
  }
  return [out, index];
}

function parseYamlArray(lines: YamlLine[], index: number, indent: number, filePath: string): [unknown[], number] {
  const out: unknown[] = [];
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent || !line.text.startsWith("- ")) break;
    if (line.indent > indent) throw new CliError(`${filePath}: invalid list indentation near ${line.text}`);
    const rest = line.text.slice(2).trim();
    if (!rest) {
      const parsed = parseYamlNode(lines, index + 1, (lines[index + 1]?.indent ?? indent + 2), filePath);
      out.push(parsed[0]);
      index = parsed[1];
      continue;
    }
    const inlineMap = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(rest);
    if (inlineMap) {
      const item: Record<string, unknown> = { [inlineMap[1]]: inlineMap[2] ? parseYamlScalar(inlineMap[2]) : null };
      index += 1;
      while (index < lines.length && lines[index].indent > indent) {
        const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(lines[index].text);
        if (!match) throw new CliError(`${filePath}: invalid frontmatter line: ${lines[index].text}`);
        if (match[2]) {
          item[match[1]] = parseYamlScalar(match[2]);
          index += 1;
        } else {
          const parsed = parseYamlNode(lines, index + 1, lines[index + 1]?.indent ?? lines[index].indent + 2, filePath);
          item[match[1]] = parsed[0];
          index = parsed[1];
        }
      }
      out.push(item);
    } else {
      out.push(parseYamlScalar(rest));
      index += 1;
    }
  }
  return [out, index];
}

function parseYamlScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "[]") return [];
  if (trimmed === "{}") return {};
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function objectField(value: unknown, optional = false): Record<string, unknown> {
  if (value === undefined && optional) return {};
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function arrayOfFixtures(value: unknown): CaseFixture[] {
  return Array.isArray(value)
    ? value
        .map((item) => objectField(item))
        .filter((item) => typeof item.path === "string")
        .map((item) => ({ path: String(item.path), ...(typeof item.description === "string" ? { description: item.description } : {}) }))
    : [];
}

function arrayOfJudges(value: unknown): CaseCriteria["judges"] {
  return Array.isArray(value)
    ? value
        .map((item) => objectField(item))
        .filter((item) => typeof item.id === "string")
        .map((item) => {
          const threshold = objectField(item.threshold, true);
          return {
            id: String(item.id),
            ...(Object.keys(threshold).length ? { threshold: threshold as { overall_min?: number; dimensions?: Record<string, number> } } : {})
          };
        })
    : [];
}
