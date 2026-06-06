import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { parseAgentManifestMetadata, parseSkillFrontmatterFull } from "./metadata.ts";
import type { AgentManifestMetadata, SkillFrontmatterFull } from "./metadata.ts";
import { EVAL_PHASES, type Issue, type LintReport } from "./models.ts";
import {
  exists,
  projectPaths,
  requirePortableSkill
} from "./project.ts";
import { evalIdentity, readEval } from "./eval/evals.ts";
import { isValidTestId, listEvalFolders, listDeterministicTests } from "./eval/discovery.ts";
import type { EvalSelector } from "./eval/types.ts";

const execAsync = promisify(exec);

export interface LintOptions {
  json?: boolean;
  executeTests?: boolean;
  evalSelector?: EvalSelector;
}

export async function lintProject(target: string, options: LintOptions = {}): Promise<LintReport> {
  const root = await requirePortableSkill(target);
  const failures: Issue[] = [];
  const warnings: Issue[] = [];
  const tests: LintReport["tests"] = [];
  const p = projectPaths(root);

  await validatePortablePayload(root, failures, warnings);

  if (await exists(p.meta)) {
    await validateWorkbench(root, failures, warnings, options.evalSelector);
  }

  if (options.executeTests !== false) {
    tests.push(...(await runDiscoveredTests(root)));
  }

  return { ok: failures.length === 0 && tests.every((test) => test.status !== "failed"), failures, warnings, tests };
}

export function formatLintReport(report: LintReport): string {
  const lines: string[] = [];
  for (const failure of report.failures) lines.push(`FAIL: ${formatIssue(failure)}`);
  for (const warning of report.warnings) lines.push(`WARN: ${formatIssue(warning)}`);
  for (const test of report.tests) lines.push(`TEST ${test.status.toUpperCase()}: ${test.id}`);
  if (!lines.length) lines.push("OK: no failures or warnings");
  else if (!report.failures.length && report.tests.every((test) => test.status !== "failed")) lines.push(`OK: no failures (${report.warnings.length} warnings)`);
  return lines.join("\n");
}

// agentskills.io SKILL.md frontmatter fields. Anything else is flagged.
const SPEC_FRONTMATTER_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);

async function validatePortablePayload(root: string, failures: Issue[], warnings: Issue[]): Promise<void> {
  const skillMd = path.join(root, "SKILL.md");
  const skillText = await fs.readFile(skillMd, "utf8");
  let frontmatter: SkillFrontmatterFull;
  try {
    frontmatter = await parseSkillFrontmatterFull(skillMd);
  } catch (error) {
    failures.push(issue("failure", error instanceof Error ? error.message : String(error), skillMd));
    return;
  }
  const expected = path.basename(root);
  const body = skillBody(skillText);

  validateName(frontmatter, expected, skillMd, failures, warnings);
  validateDescription(frontmatter, skillMd, failures, warnings);
  validateOptionalFrontmatter(frontmatter, skillMd, failures, warnings);
  validateUnknownKeys(frontmatter, skillMd, warnings);

  if (!body.trim()) failures.push(issue("failure", "SKILL.md body is missing", skillMd));
  if (skillText.split(/\r?\n/).length > 220) warnings.push(issue("warning", "SKILL.md is long; move conditional detail to directly linked references", skillMd));
  await validateRuntimeResourceLinks(root, skillText, warnings);
  await validateLinkIntegrity(root, skillText, failures);
  await validateAgentManifest(root, failures);
}

function validateName(frontmatter: SkillFrontmatterFull, expected: string, skillMd: string, failures: Issue[], warnings: Issue[]): void {
  const name = frontmatter.name;
  if (!name) {
    failures.push(issue("failure", "SKILL.md is missing required frontmatter field 'name'", skillMd));
    return;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    failures.push(issue("failure", "skill name must use lowercase letters, numbers, and single hyphens (no leading, trailing, or consecutive hyphens)", skillMd));
  }
  if (name.length > 64) {
    failures.push(issue("failure", `skill name must be 64 characters or fewer (currently ${name.length})`, skillMd));
  }
  if (name !== expected) {
    warnings.push(issue("warning", `skill name ${name} does not match folder ${expected}`, skillMd));
  }
}

function validateDescription(frontmatter: SkillFrontmatterFull, skillMd: string, failures: Issue[], warnings: Issue[]): void {
  const description = frontmatter.description;
  if (!description) {
    failures.push(issue("failure", "SKILL.md is missing required frontmatter field 'description'", skillMd));
    return;
  }
  if (description.length > 1024) {
    failures.push(issue("failure", `description must be 1024 characters or fewer (currently ${description.length})`, skillMd));
  } else if (description.length > 500) {
    warnings.push(issue("warning", `description is long (${description.length} chars); aim for under 500`, skillMd));
  }
  if (!/\b(use when|when|asked to|for)\b/i.test(description)) {
    warnings.push(issue("warning", "description should include trigger context", skillMd));
  }
  if (!/\bnot for\b/i.test(description)) {
    warnings.push(issue("warning", "description should include a nearby 'not for' boundary", skillMd));
  }
  if (readsLikeWorkflow(description)) {
    warnings.push(issue("warning", "description reads like a workflow sequence; describe when to use the skill, not its steps (the body holds the procedure)", skillMd));
  }
}

// design.md "dangerous shortcut": a description that lists steps can make the
// agent follow the description instead of loading the body.
function readsLikeWorkflow(description: string): boolean {
  if (/\bstep\s*\d/i.test(description)) return true;
  if (/\bfirst\b[^.]*\bthen\b/i.test(description)) return true;
  return (description.match(/\bthen\b/gi)?.length ?? 0) >= 2;
}

function validateOptionalFrontmatter(frontmatter: SkillFrontmatterFull, skillMd: string, failures: Issue[], warnings: Issue[]): void {
  const { compatibility, allowedTools, license, metadata } = frontmatter;
  if (compatibility !== undefined) {
    if (!compatibility.length) failures.push(issue("failure", "compatibility must be 1-500 characters when present", skillMd));
    else if (compatibility.length > 500) failures.push(issue("failure", `compatibility must be 500 characters or fewer (currently ${compatibility.length})`, skillMd));
  }
  if (allowedTools !== undefined && !allowedTools.trim()) {
    warnings.push(issue("warning", "allowed-tools is present but empty", skillMd));
  }
  if (license !== undefined && !license.trim()) {
    warnings.push(issue("warning", "license is present but empty", skillMd));
  }
  if (metadata) {
    const nonString = Object.entries(metadata).filter(([, value]) => typeof value !== "string").map(([key]) => key);
    if (nonString.length) {
      warnings.push(issue("warning", `metadata values should be strings; quote: ${nonString.join(", ")}`, skillMd));
    }
  }
}

function validateUnknownKeys(frontmatter: SkillFrontmatterFull, skillMd: string, warnings: Issue[]): void {
  const unknown = frontmatter.keys.filter((key) => !SPEC_FRONTMATTER_KEYS.has(key));
  if (unknown.length) {
    warnings.push(issue("warning", `unknown frontmatter key(s): ${unknown.join(", ")}; remove or move under 'metadata'`, skillMd));
  }
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

// Every relative markdown link in live prose (SKILL.md + references/*.md) must
// resolve to a real file inside the packaging unit. Links shown as examples
// live in code fences or backticks and are deliberately excluded.
async function validateLinkIntegrity(root: string, skillText: string, failures: Issue[]): Promise<void> {
  const boundary = await resolveLinkBoundary(root);
  const docs: Array<{ rel: string; dir: string; text: string }> = [{ rel: "SKILL.md", dir: root, text: skillText }];
  const refDir = path.join(root, "references");
  if (await exists(refDir)) {
    const entries = await fs.readdir(refDir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        docs.push({ rel: `references/${entry.name}`, dir: refDir, text: await fs.readFile(path.join(refDir, entry.name), "utf8") });
      }
    }
  }

  const seen = new Set<string>();
  for (const doc of docs) {
    for (const raw of extractProseLinks(doc.text)) {
      const target = normalizeLinkTarget(raw);
      if (!target) continue;
      const key = `${doc.rel}::${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const resolved = path.resolve(doc.dir, target);
      const relToBoundary = path.relative(boundary, resolved);
      if (relToBoundary.startsWith("..") || path.isAbsolute(relToBoundary)) {
        failures.push(issue("failure", `${doc.rel} links outside the packaged payload: ${target}`, path.join(root, doc.rel)));
      } else if (resolved.split(path.sep).includes(".meta-skill")) {
        failures.push(issue("failure", `${doc.rel} links into a .meta-skill workbench, which does not package: ${target}`, path.join(root, doc.rel)));
      } else if (!(await exists(resolved))) {
        failures.push(issue("failure", `${doc.rel} has a broken link: ${target}`, path.join(root, doc.rel)));
      }
    }
  }
}

// Links may resolve anywhere inside the packaging unit. A skill that lives in a
// plugin (marked by .codex-plugin/plugin.json) may reference sibling skills; a
// standalone skill is bounded by its own root.
async function resolveLinkBoundary(skillRoot: string): Promise<string> {
  let dir = path.dirname(skillRoot);
  while (true) {
    if (await exists(path.join(dir, ".codex-plugin", "plugin.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return skillRoot;
    dir = parent;
  }
}

function extractProseLinks(text: string): string[] {
  const prose = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const links: string[] = [];
  const re = /\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(prose)) !== null) links.push(match[1]);
  return links;
}

function normalizeLinkTarget(raw: string): string | null {
  let target = raw.trim();
  if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1).trim();
  const space = target.search(/\s/);
  if (space !== -1) target = target.slice(0, space); // drop a ](path "title")
  target = target.split("#")[0].split("?")[0].replace(/%20/g, " ");
  if (!target) return null; // pure anchor
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null; // URL scheme (http:, mailto:, ...)
  return target;
}

async function validateAgentManifest(root: string, failures: Issue[]): Promise<void> {
  const manifestPath = path.join(root, "agents", "openai.yaml");
  if (!(await exists(manifestPath))) return;
  let metadata: AgentManifestMetadata;
  try {
    metadata = await parseAgentManifestMetadata(manifestPath);
  } catch (error) {
    failures.push(issue("failure", error instanceof Error ? error.message : String(error), manifestPath));
    return;
  }
  if (!(metadata.hasInterface || metadata.hasPolicy || metadata.hasDependencies)) {
    failures.push(issue("failure", "agents/openai.yaml must declare interface, policy, or dependencies metadata; skill name and description belong in SKILL.md frontmatter", manifestPath));
  }
}

async function validateWorkbench(root: string, failures: Issue[], warnings: Issue[], selector: EvalSelector = {}): Promise<void> {
  const p = projectPaths(root);
  if (!(await exists(p.spec))) failures.push(issue("failure", ".meta-skill/spec.md is missing", p.spec));
  else await validateSpecPlaceholders(p.spec, warnings);
  if (!(await exists(p.evalScenarios))) failures.push(issue("failure", ".meta-skill/eval-scenarios.md is missing", p.evalScenarios));

  const testIds = await validateTests(root, p.tests, failures);

  if (!(await exists(p.evals))) {
    warnings.push(issue("warning", "no evals folder yet", p.evals));
    return;
  }
  const wantedEvals = selector.eval?.length ? new Set(selector.eval) : undefined;
  const evalFolders = (await listEvalFolders(p.evals)).filter((folder) => !wantedEvals || wantedEvals.has(folder));
  if (!evalFolders.length) warnings.push(issue("warning", "no evals yet", p.evals));
  const seenIds = new Set<string>();
  for (const folder of evalFolders) {
    await validateEval(path.join(p.evals, folder), folder, seenIds, testIds, failures, warnings);
  }

  if ((await exists(path.join(root, "scripts"))) && (await hasFiles(path.join(root, "scripts")))) {
    const tests = await listDeterministicTests(root, p.tests);
    if (!tests.length) {
      warnings.push(issue("warning", "runtime scripts are present; add or recommend deterministic tests in .meta-skill/tests/", path.join(root, "scripts")));
    }
  }
}

async function validateEval(
  evalDir: string,
  folder: string,
  seenIds: Set<string>,
  testIds: Set<string>,
  failures: Issue[],
  warnings: Issue[]
): Promise<void> {
  try {
    evalIdentity(folder);
  } catch (error) {
    failures.push(issue("failure", error instanceof Error ? error.message : String(error), evalDir));
  }
  const taskMd = path.join(evalDir, "task.md");
  const criteriaJson = path.join(evalDir, "criteria.json");
  const [hasTask, hasCriteria] = await Promise.all([exists(taskMd), exists(criteriaJson)]);
  if (!hasTask) {
    failures.push(issue("failure", "eval is missing task.md", taskMd));
    return;
  }
  if (!hasCriteria) {
    failures.push(issue("failure", "eval is missing criteria.json", criteriaJson));
    return;
  }

  let item;
  try {
    item = await readEval(evalDir, folder);
  } catch (error) {
    failures.push(issue("failure", error instanceof Error ? error.message : String(error), evalDir));
    return;
  }
  if (seenIds.has(item.id)) failures.push(issue("failure", `duplicate eval id: ${item.id}`, taskMd));
  seenIds.add(item.id);
  if (!item.metadata.title) failures.push(issue("failure", "task.md title is required", taskMd));
  if (!item.metadata.capability) failures.push(issue("failure", "task.md capability is required", taskMd));
  if (!item.problemDescription) failures.push(issue("failure", "task.md problem description is required", taskMd));
  if (!item.outputSpecification) failures.push(issue("failure", "task.md output specification is required", taskMd));
  if (!item.task) failures.push(issue("failure", "task.md task is required", taskMd));

  if (!Array.isArray(item.criteria.criteria) || !item.criteria.criteria.length) failures.push(issue("failure", "criteria.json must include at least one criterion", criteriaJson));
  for (const criterion of item.criteria.criteria || []) {
    if (!criterion.criterion) failures.push(issue("failure", "criterion is missing criterion", criteriaJson));
    if (!criterion.question) failures.push(issue("failure", `criterion is missing question: ${criterion.criterion || "(unnamed)"}`, criteriaJson));
    if (!criterion.phase) failures.push(issue("failure", `criterion is missing phase: ${criterion.criterion || "(unnamed)"}`, criteriaJson));
    if (!criterion.dimension) failures.push(issue("failure", `criterion is missing dimension: ${criterion.criterion || "(unnamed)"}`, criteriaJson));
  }
  for (const phase of missingCriteriaPhases(item.criteria.criteria || [])) {
    failures.push(issue("failure", `criteria.json must include at least one ${phase} criterion`, criteriaJson));
  }
  for (const testId of item.criteria.tests || []) {
    if (!testIds.has(testId)) failures.push(issue("failure", `criteria references missing test id: ${testId}`, criteriaJson));
  }
  if (!(item.criteria.tests || []).length) warnings.push(issue("warning", `${item.id} has no deterministic tests`, criteriaJson));

  const declared = new Set((item.metadata.fixtures || []).map((fixture) => fixture.path));
  const fixtureFiles = await listFixtureFiles(path.join(evalDir, "fixtures"));
  for (const fixture of declared) {
    const resolved = path.resolve(evalDir, fixture);
    const relative = path.relative(evalDir, resolved);
    if (!fixture.startsWith("fixtures/")) failures.push(issue("failure", `fixture path must live under fixtures/: ${fixture}`, criteriaJson));
    if (relative.startsWith("..") || path.isAbsolute(relative)) failures.push(issue("failure", `fixture path escapes eval folder: ${fixture}`, criteriaJson));
    if (!(await exists(resolved))) failures.push(issue("failure", `declared fixture does not exist: ${fixture}`, criteriaJson));
  }
  for (const fixture of fixtureFiles) {
    if (!declared.has(fixture)) failures.push(issue("failure", `fixture is present but undeclared: ${fixture}`, criteriaJson));
  }
}

function missingCriteriaPhases(criteria: Array<{ phase?: string }>): string[] {
  const present = new Set(criteria.map((criterion) => criterion.phase).filter(Boolean));
  return EVAL_PHASES.filter((phase) => !present.has(phase));
}

// The spec template ships with <...> placeholders; the skill is not authored
// until they are filled. TODO markers are caught the same way.
async function validateSpecPlaceholders(specPath: string, warnings: Issue[]): Promise<void> {
  const text = await fs.readFile(specPath, "utf8");
  if (/<[^>\n]{2,}>/.test(text) || /\bTODO\b/.test(text)) {
    warnings.push(issue("warning", "spec.md still contains template placeholders (<...> or TODO); fill them before treating the skill as authored", specPath));
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

async function validateTests(root: string, testsDir: string, failures: Issue[]): Promise<Set<string>> {
  if (await exists(testsDir)) {
    const entries = await fs.readdir(testsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        failures.push(issue("failure", `nested test folders are not supported under .meta-skill/tests/: ${entry.name}`, path.join(testsDir, entry.name)));
      }
    }
  }
  const tests = await listDeterministicTests(root, testsDir);
  const ids = new Set<string>();
  for (const test of tests) {
    if (ids.has(test.id)) failures.push(issue("failure", `duplicate test id: ${test.id}`, test.path));
    ids.add(test.id);
    if (!isValidTestId(test.id)) failures.push(issue("failure", `invalid test id: ${test.id}`, test.path));
  }
  return ids;
}

async function runDiscoveredTests(root: string): Promise<LintReport["tests"]> {
  const rows: LintReport["tests"] = [];
  for (const test of await listDeterministicTests(root, path.join(root, ".meta-skill", "tests"))) {
    try {
      const { stdout, stderr } = await execAsync(test.command, {
        cwd: root,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
        env: process.env
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
