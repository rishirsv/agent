import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { Issue, LintReport, TestManifest } from "./models.ts";
import { appendFact, readFacts } from "./facts.ts";
import {
  CliError,
  exists,
  parseSkillFrontmatter,
  projectPaths,
  readJson,
  requirePortableSkill
} from "./project.ts";
import { caseIdentity, readCase } from "./eval/cases.ts";

const execAsync = promisify(exec);

export interface LintOptions {
  runId?: string;
  json?: boolean;
  executeTests?: boolean;
}

export async function lintProject(target: string, options: LintOptions = {}): Promise<LintReport> {
  const root = await requirePortableSkill(target);
  const failures: Issue[] = [];
  const warnings: Issue[] = [];
  const tests: LintReport["tests"] = [];
  const p = projectPaths(root);

  await validatePortablePayload(root, failures, warnings);

  if (await exists(p.meta)) {
    await validateWorkbench(root, failures, warnings);
  }

  if (options.executeTests !== false && (await exists(p.testManifest))) {
    const manifest = await readJson<TestManifest>(p.testManifest);
    tests.push(...(await runManifestTests(root, manifest, options.runId ? "eval" : "unit", options.runId ? { runId: options.runId, runRoot: path.join(p.runs, options.runId), projectRoot: root } : undefined)));
  }

  let annotations = 0;
  if (options.runId) {
    const runRoot = path.join(p.runs, options.runId);
    if (!(await exists(runRoot))) {
      failures.push(issue("failure", `run evidence does not exist: ${options.runId}`, runRoot));
    } else {
      const runFacts = await readFacts(runRoot);
      for (const test of tests.filter((row) => row.kind === "eval")) {
        const declaredCases = runFacts.filter((fact) => fact.type === "case_defined" && Array.isArray(fact.payload.tests) && fact.payload.tests.map(String).includes(test.id));
        const targets = declaredCases.length ? declaredCases : [undefined];
        for (const target of targets) {
          await appendFact(runRoot, {
            type: "check_observed",
            run_id: options.runId,
            ...(target?.case_id ? { case_id: target.case_id } : {}),
            source: "meta-skill lint",
            payload: { kind: "test", id: test.id, outcome: test.status, command: test.command, output: test.output }
          });
          annotations += 1;
        }
      }
      await appendFact(runRoot, {
        type: "check_observed",
        run_id: options.runId,
        source: "meta-skill lint",
        payload: { kind: "test", id: "lint", outcome: failures.length ? "failed" : "passed", failures: failures.length, warnings: warnings.length, tests: tests.length }
      });
      annotations += 1;
    }
  }

  return { ok: failures.length === 0 && tests.every((test) => test.status !== "failed"), failures, warnings, tests, annotations };
}

export function formatLintReport(report: LintReport): string {
  const lines: string[] = [];
  for (const failure of report.failures) lines.push(`FAIL: ${formatIssue(failure)}`);
  for (const warning of report.warnings) lines.push(`WARN: ${formatIssue(warning)}`);
  for (const test of report.tests) lines.push(`TEST ${test.status.toUpperCase()}: ${test.id}`);
  if (report.annotations) lines.push(`ANNOTATIONS: ${report.annotations}`);
  if (!lines.length) lines.push("OK: no failures or warnings");
  else if (!report.failures.length && report.tests.every((test) => test.status !== "failed")) lines.push(`OK: no failures (${report.warnings.length} warnings)`);
  return lines.join("\n");
}

async function validatePortablePayload(root: string, failures: Issue[], warnings: Issue[]): Promise<void> {
  const skillMd = path.join(root, "SKILL.md");
  const skillText = await fs.readFile(skillMd, "utf8");
  const frontmatter = await parseSkillFrontmatter(skillMd);
  const expected = path.basename(root);
  const body = skillBody(skillText);

  if (!frontmatter.name) failures.push(issue("failure", "SKILL.md is missing required frontmatter field 'name'", skillMd));
  if (frontmatter.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name)) failures.push(issue("failure", "skill name must use lowercase letters, numbers, and single hyphens", skillMd));
  if (frontmatter.name && frontmatter.name !== expected) warnings.push(issue("warning", `skill name ${frontmatter.name} does not match folder ${expected}`, skillMd));
  if (!frontmatter.description) failures.push(issue("failure", "SKILL.md is missing required frontmatter field 'description'", skillMd));
  if (frontmatter.description && !/\b(use when|when|asked to|for)\b/i.test(frontmatter.description)) {
    warnings.push(issue("warning", "description should include trigger context", skillMd));
  }
  if (frontmatter.description && !/\bnot for\b/i.test(frontmatter.description)) {
    warnings.push(issue("warning", "description should include a nearby 'not for' boundary", skillMd));
  }
  if (!body.trim()) failures.push(issue("failure", "SKILL.md body is missing", skillMd));
  if (skillText.split(/\r?\n/).length > 220) warnings.push(issue("warning", "SKILL.md is long; move conditional detail to directly linked references", skillMd));
  await validateRuntimeResourceLinks(root, skillText, warnings);
  await validateAgentManifest(root, frontmatter, failures, warnings);
}

function skillBody(skillText: string): string {
  if (!skillText.startsWith("---\n")) return skillText;
  const end = skillText.indexOf("\n---\n", 4);
  if (end === -1) return "";
  return skillText.slice(end + 5);
}

async function validateRuntimeResourceLinks(root: string, skillText: string, warnings: Issue[]): Promise<void> {
  for (const dir of ["references", "scripts", "assets"]) {
    const dirPath = path.join(root, dir);
    if (!(await exists(dirPath))) continue;
    const files = (await fs.readdir(dirPath, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile());
    for (const file of files) {
      const relative = `${dir}/${file.name}`;
      if (!skillText.includes(`](${relative})`) && !skillText.includes(`](${relative.replace(/ /g, "%20")})`)) {
        warnings.push(issue("warning", `runtime ${dir.slice(0, -1)} should be directly linked from SKILL.md: ${relative}`, path.join(root, relative)));
      }
    }
  }
}

async function validateAgentManifest(root: string, frontmatter: { name?: string; description?: string }, failures: Issue[], warnings: Issue[]): Promise<void> {
  const manifestPath = path.join(root, "agents", "openai.yaml");
  if (!(await exists(manifestPath))) return;
  const text = await fs.readFile(manifestPath, "utf8");
  const topLevel = parseSimpleYaml(text);
  const hasCodexShape = Boolean(topLevel.name && topLevel.description);
  const hasInterfaceShape = /^\s*interface\s*:/m.test(text);
  if (!hasCodexShape && !hasInterfaceShape) {
    failures.push(issue("failure", "agents/openai.yaml must use top-level name/description or documented interface metadata", manifestPath));
    return;
  }
  if (topLevel.name && frontmatter.name && topLevel.name !== frontmatter.name) {
    warnings.push(issue("warning", `agents/openai.yaml name ${topLevel.name} does not match SKILL.md name ${frontmatter.name}`, manifestPath));
  }
}

function parseSimpleYaml(text: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    parsed[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
  }
  return parsed;
}

async function validateWorkbench(root: string, failures: Issue[], warnings: Issue[]): Promise<void> {
  const p = projectPaths(root);
  if (!(await exists(p.spec))) failures.push(issue("failure", ".meta-skill/spec.md is missing", p.spec));
  if (!(await exists(p.evalManifest))) failures.push(issue("failure", ".meta-skill/evals/evals.json is missing", p.evalManifest));
  if (!(await exists(p.testManifest))) failures.push(issue("failure", ".meta-skill/tests/manifest.json is missing", p.testManifest));

  let testIds = new Set<string>();
  if (await exists(p.testManifest)) {
    const manifest = await readJson<TestManifest>(p.testManifest);
    if (manifest.schema_version !== 1) failures.push(issue("failure", "tests manifest schema_version must be 1", p.testManifest));
    if (!Array.isArray(manifest.tests)) failures.push(issue("failure", "tests manifest must contain tests array", p.testManifest));
    testIds = new Set((manifest.tests || []).map((test) => test.id));
    if (testIds.size !== (manifest.tests || []).length) failures.push(issue("failure", "tests manifest contains duplicate test IDs", p.testManifest));
    for (const test of manifest.tests || []) {
      if (!test.id || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(test.id)) failures.push(issue("failure", `invalid test id: ${test.id}`, p.testManifest));
      if (!["unit", "eval"].includes(test.kind)) failures.push(issue("failure", `invalid test kind for ${test.id}: ${test.kind}`, p.testManifest));
      if (!test.command) failures.push(issue("failure", `test ${test.id} is missing command`, p.testManifest));
    }
  }

  const judgeIds = await validateJudges(p.judges, failures, warnings);

  if (await exists(p.evalManifest)) {
    const manifest = await readJson<Record<string, unknown>>(p.evalManifest);
    if (manifest.schema_version !== 1) failures.push(issue("failure", "eval manifest schema_version must be 1", p.evalManifest));
    if ((manifest.defaults as Record<string, unknown> | undefined)?.runner !== "app_server") {
      failures.push(issue("failure", "eval manifest defaults.runner must be app_server", p.evalManifest));
    }
  }

  if (!(await exists(p.cases))) {
    warnings.push(issue("warning", "no eval cases folder yet", p.cases));
    return;
  }
  const caseDirs = (await fs.readdir(p.cases, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  if (!caseDirs.length) warnings.push(issue("warning", "no eval cases yet", p.cases));
  const seenIds = new Set<string>();
  for (const dirent of caseDirs) {
    await validateCase(path.join(p.cases, dirent.name), dirent.name, seenIds, testIds, judgeIds, failures, warnings);
  }

  if ((await exists(path.join(root, "scripts"))) && (await hasFiles(path.join(root, "scripts")))) {
    const manifest = (await exists(p.testManifest)) ? await readJson<TestManifest>(p.testManifest) : { tests: [] };
    if (!manifest.tests.some((test) => test.kind === "unit")) {
      warnings.push(issue("warning", "runtime scripts are present; add or recommend unit tests in .meta-skill/tests/manifest.json", path.join(root, "scripts")));
    }
  }
}

async function validateCase(
  caseDir: string,
  folder: string,
  seenIds: Set<string>,
  testIds: Set<string>,
  judgeIds: Set<string>,
  failures: Issue[],
  warnings: Issue[]
): Promise<void> {
  try {
    caseIdentity(folder);
  } catch (error) {
    failures.push(issue("failure", error instanceof Error ? error.message : String(error), caseDir));
  }
  const caseMd = path.join(caseDir, "case.md");
  if (!(await exists(caseMd))) {
    failures.push(issue("failure", "case is missing case.md", caseMd));
    return;
  }

  let item;
  try {
    item = await readCase(caseDir, folder);
  } catch (error) {
    failures.push(issue("failure", error instanceof Error ? error.message : String(error), caseMd));
    return;
  }
  if (seenIds.has(item.id)) failures.push(issue("failure", `duplicate case id: ${item.id}`, caseMd));
  seenIds.add(item.id);
  if (!item.metadata.title) warnings.push(issue("warning", "case title is empty", caseMd));

  if (!item.criteria.expected_behavior) failures.push(issue("failure", "case criteria.expected_behavior is required", caseMd));
  if (!Array.isArray(item.criteria.assertions) || !item.criteria.assertions.length) failures.push(issue("failure", "case criteria.assertions must include at least one assertion", caseMd));
  for (const testId of item.criteria.tests || []) {
    if (!testIds.has(testId)) failures.push(issue("failure", `criteria references missing test id: ${testId}`, caseMd));
  }
  for (const judge of item.criteria.judges || []) {
    if (!judgeIds.has(judge.id)) failures.push(issue("failure", `criteria references missing judge id: ${judge.id}`, caseMd));
    if (judge.threshold?.overall_min !== undefined && (judge.threshold.overall_min < 1 || judge.threshold.overall_min > 5)) {
      failures.push(issue("failure", `judge threshold overall_min must be 1-5 for ${judge.id}`, caseMd));
    }
  }
  if (!(item.criteria.tests || []).length) warnings.push(issue("warning", `${item.id} has no deterministic tests`, caseMd));
  if (!(item.criteria.judges || []).length) warnings.push(issue("warning", `${item.id} has no judges and is manual-review only`, caseMd));

  const declared = new Set((item.metadata.fixtures || []).map((fixture) => fixture.path));
  const fixtureFiles = await listFixtureFiles(path.join(caseDir, "fixtures"));
  for (const fixture of declared) {
    const resolved = path.resolve(caseDir, fixture);
    const relative = path.relative(caseDir, resolved);
    if (!fixture.startsWith("fixtures/")) failures.push(issue("failure", `fixture path must live under fixtures/: ${fixture}`, caseMd));
    if (relative.startsWith("..") || path.isAbsolute(relative)) failures.push(issue("failure", `fixture path escapes case folder: ${fixture}`, caseMd));
    if (!(await exists(resolved))) failures.push(issue("failure", `declared fixture does not exist: ${fixture}`, caseMd));
  }
  for (const fixture of fixtureFiles) {
    if (!declared.has(fixture)) failures.push(issue("failure", `fixture is present but undeclared: ${fixture}`, caseMd));
  }
}

async function listFixtureFiles(fixturesDir: string): Promise<string[]> {
  if (!(await exists(fixturesDir))) return [];
  const root = path.dirname(fixturesDir);
  const files: string[] = [];
  async function walk(dir: string): Promise<void> {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  await walk(fixturesDir);
  return files.sort();
}

async function validateJudges(judgesDir: string, failures: Issue[], warnings: Issue[]): Promise<Set<string>> {
  const ids = new Set<string>();
  if (!(await exists(judgesDir))) return ids;
  const files = (await fs.readdir(judgesDir, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
  for (const file of files) {
    const full = path.join(judgesDir, file.name);
    const text = await fs.readFile(full, "utf8");
    const parsed = parseMarkdownFrontmatter(text);
    if (!parsed.id) failures.push(issue("failure", "judge frontmatter missing id", full));
    if (parsed.id) ids.add(parsed.id);
    if (!["rubric", "pass_fail"].includes(parsed.type || "")) failures.push(issue("failure", `judge ${file.name} type must be rubric or pass_fail`, full));
    if (parsed.type === "rubric" && parsed.scale !== "1-5") failures.push(issue("failure", `rubric judge ${file.name} must use scale 1-5`, full));
    if (!/##?\s+Output/i.test(text)) warnings.push(issue("warning", `judge ${file.name} should define structured output guidance`, full));
    if (!/example|calibration/i.test(text)) warnings.push(issue("warning", `judge ${file.name} has no examples yet`, full));
  }
  return ids;
}

function parseMarkdownFrontmatter(text: string): Record<string, string> {
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return {};
  const result: Record<string, string> = {};
  for (const line of text.slice(4, end).split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match) result[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
  }
  return result;
}

async function runManifestTests(
  root: string,
  manifest: TestManifest,
  kind: "unit" | "eval",
  runEnv?: { runId: string; runRoot: string; projectRoot: string }
): Promise<LintReport["tests"]> {
  const rows: LintReport["tests"] = [];
  for (const test of manifest.tests || []) {
    if (test.kind !== kind) continue;
    try {
      const { stdout, stderr } = await execAsync(test.command, {
        cwd: root,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
        env: runEnv
          ? {
              ...process.env,
              META_SKILL_RUN_ID: runEnv.runId,
              META_SKILL_RUN_ROOT: runEnv.runRoot,
              META_SKILL_PROJECT_ROOT: runEnv.projectRoot
            }
          : process.env
      });
      rows.push({ id: test.id, kind: test.kind, status: "passed", command: test.command, output: `${stdout}${stderr}`.trim() });
    } catch (error) {
      const output = error && typeof error === "object" && "stdout" in error ? `${(error as { stdout?: string }).stdout || ""}${(error as { stderr?: string }).stderr || ""}`.trim() : String(error);
      rows.push({ id: test.id, kind: test.kind, status: "failed", command: test.command, output });
    }
  }
  return rows;
}

async function hasFiles(dir: string): Promise<boolean> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.some((entry) => entry.isFile());
}

function issue(severity: "failure" | "warning", message: string, filePath?: string): Issue {
  return { severity, message, path: filePath };
}

function formatIssue(item: Issue): string {
  return item.path ? `${item.message} (${item.path})` : item.message;
}
