import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { EvalManifest, EventEnvelope, TestManifest } from "./models";

const execFileAsync = promisify(execFile);

export class CliError extends Error {
  constructor(message: string, public exitCode = 1) {
    super(message);
  }
}

export const PORTABLE_FILES = new Set(["SKILL.md"]);
export const PORTABLE_DIRS = new Set(["agents", "references", "scripts", "assets"]);

export function utcNow(): string {
  return new Date().toISOString();
}

export function slugify(text: string, fallback = "item"): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || fallback;
}

export function assertSlug(slug: string, label = "slug"): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new CliError(`${label} must use lowercase letters, numbers, and single hyphens`);
  }
}

export async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(target: string): Promise<void> {
  await fs.mkdir(target, { recursive: true });
}

export async function readText(target: string): Promise<string> {
  return fs.readFile(target, "utf8");
}

export async function writeText(target: string, text: string): Promise<void> {
  await ensureDir(path.dirname(target));
  await fs.writeFile(target, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

export async function readJson<T = unknown>(target: string): Promise<T> {
  try {
    return JSON.parse(await readText(target)) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CliError(`${target}: invalid JSON (${detail})`);
  }
}

export async function writeJson(target: string, value: unknown): Promise<void> {
  await writeText(target, `${JSON.stringify(value, null, 2)}\n`);
}

export async function appendJsonl(target: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(target));
  await fs.appendFile(target, `${JSON.stringify(value)}\n`, "utf8");
}

export async function touch(target: string): Promise<void> {
  await ensureDir(path.dirname(target));
  await fs.appendFile(target, "");
}

export interface Frontmatter {
  name?: string;
  description?: string;
}

export async function parseSkillFrontmatter(skillMd: string): Promise<Frontmatter> {
  const text = await readText(skillMd);
  if (!text.startsWith("---\n")) {
    return {};
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) {
    return {};
  }
  const raw = text.slice(4, end).split(/\r?\n/);
  const parsed: Frontmatter = {};
  for (const line of raw) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const value = match[2].replace(/^['"]|['"]$/g, "").trim();
    if (key === "name") parsed.name = value;
    if (key === "description") parsed.description = value;
  }
  return parsed;
}

export function projectPaths(projectRoot: string) {
  const root = path.resolve(projectRoot);
  const meta = path.join(root, ".meta-skill");
  return {
    root,
    skillMd: path.join(root, "SKILL.md"),
    meta,
    spec: path.join(meta, "spec.md"),
    evals: path.join(meta, "evals"),
    evalManifest: path.join(meta, "evals", "evals.json"),
    scenarios: path.join(meta, "evals", "scenarios"),
    judges: path.join(meta, "evals", "judges"),
    runs: path.join(meta, "evals", "runs"),
    tests: path.join(meta, "tests"),
    testManifest: path.join(meta, "tests", "manifest.json"),
    unitTests: path.join(meta, "tests", "unit"),
    evalTests: path.join(meta, "tests", "eval"),
    versions: path.join(meta, "versions"),
    release: path.join(meta, "versions", "release"),
    releaseSkill: path.join(meta, "versions", "release", "skill"),
    reviews: path.join(meta, "reviews"),
    plans: path.join(meta, "plans"),
    sessions: path.join(meta, "sessions")
  };
}

export async function requirePortableSkill(projectRoot: string): Promise<string> {
  const root = path.resolve(projectRoot);
  if (!(await exists(path.join(root, "SKILL.md")))) {
    throw new CliError(`portable skill root must contain SKILL.md: ${root}`);
  }
  return root;
}

export async function createWorkbench(projectRoot: string, options: { force?: boolean } = {}): Promise<void> {
  const root = await requirePortableSkill(projectRoot);
  const p = projectPaths(root);
  const frontmatter = await parseSkillFrontmatter(p.skillMd);
  const skillName = frontmatter.name || path.basename(root);

  await ensureDir(p.meta);
  await ensureDir(p.scenarios);
  await ensureDir(p.judges);
  await ensureDir(p.runs);
  await ensureDir(p.unitTests);
  await ensureDir(p.evalTests);
  await ensureDir(p.versions);
  await ensureDir(p.releaseSkill);
  await ensureDir(p.reviews);
  await ensureDir(p.plans);
  await ensureDir(p.sessions);

  if (options.force || !(await exists(p.spec))) {
    await writeText(
      p.spec,
      `# ${skillName} Meta Skill Spec\n\n## Purpose\n\nRecord why this skill exists, the workflow boundary, and the release/eval intent.\n\n## Boundaries\n\n- Portable payload lives at the project root.\n- Authoring workbench state lives under \`.meta-skill/\`.\n\n## Open Questions\n\n- None recorded yet.\n`
    );
  }

  if (options.force || !(await exists(p.evalManifest))) {
    const manifest: EvalManifest = {
      schema_version: 1,
      skill_name: skillName,
      suite: {
        name: "default",
        description: "Behavior, routing, gates, and known failure-mode coverage."
      },
      scenarios: { path: "scenarios" },
      defaults: { runner: "app_server", run_source: "working_payload", timeout_ms: 120000 }
    };
    await writeJson(p.evalManifest, manifest);
  }

  if (options.force || !(await exists(p.testManifest))) {
    const tests: TestManifest = { schema_version: 1, tests: [] };
    await writeJson(p.testManifest, tests);
  }
}

export async function listPortablePayloadFiles(skillRoot: string): Promise<string[]> {
  const root = path.resolve(skillRoot);
  const entries: string[] = [];
  if (!(await exists(path.join(root, "SKILL.md")))) {
    throw new CliError(`portable payload is missing SKILL.md: ${root}`);
  }

  async function walk(relativeDir: string): Promise<void> {
    const absoluteDir = path.join(root, relativeDir);
    for (const dirent of await fs.readdir(absoluteDir, { withFileTypes: true })) {
      const relative = path.join(relativeDir, dirent.name);
      if (relative === ".meta-skill" || relative.startsWith(`.meta-skill${path.sep}`)) continue;
      if (!relativeDir && !(PORTABLE_FILES.has(dirent.name) || PORTABLE_DIRS.has(dirent.name))) continue;
      if (dirent.isDirectory()) {
        if (!relativeDir && !PORTABLE_DIRS.has(dirent.name)) continue;
        await walk(relative);
      } else if (dirent.isFile()) {
        entries.push(relative);
      }
    }
  }

  await walk("");
  return entries.sort();
}

export async function copyPortablePayload(sourceRoot: string, destinationRoot: string): Promise<string[]> {
  const source = path.resolve(sourceRoot);
  const destination = path.resolve(destinationRoot);
  const files = await listPortablePayloadFiles(source);
  await fs.rm(destination, { recursive: true, force: true });
  for (const relative of files) {
    const sourceFile = path.join(source, relative);
    const destFile = path.join(destination, relative);
    await ensureDir(path.dirname(destFile));
    await fs.copyFile(sourceFile, destFile);
  }
  return files;
}

export async function nextSequencedId(parent: string, label: string): Promise<string> {
  await ensureDir(parent);
  const children = await fs.readdir(parent, { withFileTypes: true });
  const max = children.reduce((acc, child) => {
    if (!child.isDirectory()) return acc;
    const match = /^(\d{3})-/.exec(child.name);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  const prefix = String(max + 1).padStart(3, "0");
  return `${prefix}-${slugify(label, "run").slice(0, 80)}`;
}

export function relativePath(fromDir: string, toPath: string): string {
  const relative = path.relative(fromDir, toPath) || ".";
  return relative.split(path.sep).join("/");
}

export async function gitContext(cwd: string): Promise<{ git_commit: string | null; dirty: boolean | null }> {
  try {
    const { stdout: commit } = await execFileAsync("git", ["rev-parse", "--short", "HEAD"], { cwd });
    const { stdout: status } = await execFileAsync("git", ["status", "--short"], { cwd });
    return { git_commit: commit.trim() || null, dirty: status.trim().length > 0 };
  } catch {
    return { git_commit: null, dirty: null };
  }
}

export async function sha256File(target: string): Promise<string> {
  const bytes = await fs.readFile(target);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function unavailableTokenUsage(reason: string) {
  return {
    input_tokens: { available: false as const, reason },
    output_tokens: { available: false as const, reason },
    total_tokens: { available: false as const, reason }
  };
}

export function eventEnvelope(input: Omit<EventEnvelope, "schema_version" | "created_at"> & { created_at?: string }): EventEnvelope {
  return {
    schema_version: 1,
    created_at: input.created_at || utcNow(),
    ...input
  };
}
