import { promises as fs } from "node:fs";
import path from "node:path";
import {
  CliError,
  assertSlug,
  createWorkbench,
  ensureDir,
  exists,
  parseSkillFrontmatter,
  readText,
  requirePortableSkill,
  writeText
} from "./project.ts";

export interface CreateSkillOptions {
  target?: string;
  slug?: string;
  title?: string;
  description?: string;
  job?: string;
  project?: boolean;
  force?: boolean;
  runtimeReferences?: string[];
  runtimeScripts?: string[];
  runtimeAssets?: string[];
}

export async function createSkill(options: CreateSkillOptions): Promise<{ path: string; project: boolean; files: string[] }> {
  const slug = options.slug || (options.target ? path.basename(path.resolve(options.target)) : undefined);
  if (!slug) throw new CliError("create requires --slug when no target path is supplied", 2);
  assertSlug(slug);

  const target = path.resolve(options.target || path.join(process.cwd(), slug));
  if ((await exists(target)) && !options.force) {
    const hasSkill = await exists(path.join(target, "SKILL.md"));
    if (hasSkill) throw new CliError(`${target} already contains SKILL.md; pass --force to replace scaffold files`);
  }

  const title = options.title || titleFromSlug(slug);
  const description =
    options.description ||
    `Use when ${slug.replace(/-/g, " ")} is needed as a reusable workflow; not for one-off tasks or publishing.`;
  const job = options.job || `Complete the ${slug.replace(/-/g, " ")} workflow with clear boundaries and useful output.`;

  validateSingleLine("description", description);
  validateSingleLine("title", title);
  validateSingleLine("job", job);

  await ensureDir(target);
  const files: string[] = [];
  await writeText(
    path.join(target, "SKILL.md"),
    `---\nname: ${slug}\ndescription: ${JSON.stringify(description)}\n---\n\n# ${title}\n\n${sentence(job)}\n\n## Workflow\n\n1. Confirm the request matches the trigger boundary.\n2. Gather only the context needed for the reusable workflow.\n3. Produce the smallest complete output that satisfies the user.\n\n## Boundaries\n\n- Ask for missing inputs only when they change the result.\n- Do not package, publish, install, or write to external systems without explicit approval.\n`
  );
  files.push("SKILL.md");

  await ensureDir(path.join(target, "agents"));
  await writeText(
    path.join(target, "agents", "openai.yaml"),
    `name: ${slug}\ndescription: ${JSON.stringify(description)}\n`
  );
  files.push("agents/openai.yaml");

  for (const source of options.runtimeReferences || []) {
    const copied = await copyRuntimeFile(source, target, "references");
    files.push(copied);
  }
  for (const source of options.runtimeScripts || []) {
    const copied = await copyRuntimeFile(source, target, "scripts");
    files.push(copied);
  }
  for (const source of options.runtimeAssets || []) {
    const copied = await copyRuntimeFile(source, target, "assets");
    files.push(copied);
  }

  if (options.project) {
    await createWorkbench(target, { force: options.force });
    files.push(".meta-skill/spec.md", ".meta-skill/evals/evals.json", ".meta-skill/tests/manifest.json");
  }

  return { path: target, project: Boolean(options.project), files };
}

export async function initProject(skillDir: string, options: { force?: boolean } = {}): Promise<{ path: string }> {
  const root = await requirePortableSkill(skillDir);
  await createWorkbench(root, options);
  return { path: root };
}

async function copyRuntimeFile(sourceText: string, targetRoot: string, folder: "references" | "scripts" | "assets"): Promise<string> {
  const source = path.resolve(sourceText);
  const stat = await fs.stat(source).catch(() => undefined);
  if (!stat?.isFile()) {
    throw new CliError(`runtime ${folder.slice(0, -1)} must be an existing file: ${sourceText}`);
  }
  const name = path.basename(source);
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) {
    throw new CliError(`runtime file name may contain only letters, numbers, dots, underscores, and hyphens: ${name}`);
  }
  const relative = path.join(folder, name);
  const destination = path.join(targetRoot, relative);
  await ensureDir(path.dirname(destination));
  if (folder === "assets") {
    await fs.copyFile(source, destination);
  } else {
    await writeText(destination, await readText(source));
  }
  return relative.split(path.sep).join("/");
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function validateSingleLine(label: string, text: string): void {
  if (/[\r\n]|```|^---$/m.test(text)) {
    throw new CliError(`--${label} must be a single-line value without fences or YAML delimiters`);
  }
}

export async function skillName(projectRoot: string): Promise<string> {
  const frontmatter = await parseSkillFrontmatter(path.join(projectRoot, "SKILL.md"));
  return frontmatter.name || path.basename(projectRoot);
}
