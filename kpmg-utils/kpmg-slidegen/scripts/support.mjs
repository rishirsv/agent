import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);

export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

/**
 * Resolve a path from the slidegen repo root.
 * @param {...string} segments
 * @returns {string}
 */
export function resolveRepoPath(...segments) {
  return path.join(REPO_ROOT, ...segments);
}

/**
 * Run a sequence of node scripts relative to the slidegen repo.
 * @param {string[]} scripts
 * @param {string[][]} argLists
 */
export function runNodeScripts(scripts, argLists = []) {
  scripts.forEach((script, index) => {
    const args = Array.isArray(argLists[index]) ? argLists[index] : [];
    const result = spawnSync(process.execPath, [resolveRepoPath(script), ...args], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: '1',
      },
    });
    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  });
}
