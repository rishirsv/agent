import { promises as fs } from "node:fs";
import path from "node:path";
import { CliError, exists } from "../project.ts";

export interface DiscoveredTest {
  id: string;
  kind: "deterministic";
  path: string;
  command: string;
}

const EVAL_FOLDER_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEST_ID_RE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export function evalIdentity(folder: string): { id: string } {
  if (!EVAL_FOLDER_RE.test(folder)) throw new CliError(`eval folder must use a lowercase hyphen slug: ${folder}`);
  return { id: folder };
}

export function isValidTestId(id: string): boolean {
  return TEST_ID_RE.test(id);
}

export async function listEvalFolders(evalsDir: string): Promise<string[]> {
  if (!(await exists(evalsDir))) return [];
  return (await fs.readdir(evalsDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export async function listDeterministicTests(root: string, dir: string): Promise<DiscoveredTest[]> {
  if (!(await exists(dir))) return [];
  const files: DiscoveredTest[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    const id = path.basename(entry.name, path.extname(entry.name));
    files.push({ id, kind: "deterministic", path: full, command: path.relative(root, full).split(path.sep).join("/") });
  }
  return files.sort((a, b) => a.id.localeCompare(b.id));
}
