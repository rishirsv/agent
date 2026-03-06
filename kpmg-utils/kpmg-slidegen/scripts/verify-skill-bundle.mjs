import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { REPO_ROOT, resolveRepoPath } from './support.mjs';

const SKILL_ROOT = resolveRepoPath('skills', 'kpmg-slides');
const MANIFEST_PATH = path.join(SKILL_ROOT, 'assets', 'bundle-manifest.json');
const SKILL_MD_PATH = path.join(SKILL_ROOT, 'SKILL.md');
const OPENAI_YAML_PATH = path.join(SKILL_ROOT, 'agents', 'openai.yaml');
const SKILL_RUNNER_PATH = path.join(SKILL_ROOT, 'scripts', 'run_kpmg_slides.sh');
const SMOKE_FIXTURE_PATH = path.join(SKILL_ROOT, 'assets', 'templates', 'presets', 'detailed.deckSpec.json');
const BUNDLED_POSTPROCESS_RUNTIME = path.join(SKILL_ROOT, 'assets', 'slidegen', 'generator', 'postprocess', 'slides-runtime');
const REQUIRED_POSTPROCESS_FILES = [
  'render_slides.py',
  'create_montage.py',
  'slides_test.py',
  'ensure_raster_image.py',
];
const SKIP_SMOKE = process.argv.includes('--skip-smoke');

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listFilesRecursively(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      out.push(full);
    }
  }
  return out.sort();
}

function parseSkillName(skillMdPath) {
  const raw = fs.readFileSync(skillMdPath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = match[1];
  const nameMatch = fm.match(/^\s*name:\s*([^\n]+)\s*$/m);
  return nameMatch ? nameMatch[1].trim() : null;
}

function parseOpenAiYamlInterface(yamlPath) {
  const raw = fs.readFileSync(yamlPath, 'utf8');
  const display = raw.match(/^\s*display_name:\s*["']?(.+?)["']?\s*$/m)?.[1] || '';
  const shortDesc = raw.match(/^\s*short_description:\s*["']?(.+?)["']?\s*$/m)?.[1] || '';
  const prompt = raw.match(/^\s*default_prompt:\s*["']?(.+?)["']?\s*$/m)?.[1] || '';
  return { display, shortDesc, prompt };
}

function verifyManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing bundle manifest: ${MANIFEST_PATH}. Run: npm run skill:sync`);
  }
  const manifest = readJson(MANIFEST_PATH);
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
  if (entries.length === 0) throw new Error(`Bundle manifest has no entries: ${MANIFEST_PATH}`);

  const mismatches = [];
  for (const entry of entries) {
    const sourcePath = path.join(REPO_ROOT, entry.source);
    const targetPath = path.join(REPO_ROOT, entry.target);
    if (!fs.existsSync(sourcePath)) {
      mismatches.push(`Missing source file: ${entry.source}`);
      continue;
    }
    if (!fs.existsSync(targetPath)) {
      mismatches.push(`Missing synced file: ${entry.target}`);
      continue;
    }
    const sourceHash = sha256(sourcePath);
    const targetHash = sha256(targetPath);
    if (sourceHash !== targetHash || targetHash !== entry.sha256) {
      mismatches.push(`Drift detected: ${entry.target}`);
    }
  }

  if (mismatches.length) {
    throw new Error(
      `Skill bundle drift detected (${mismatches.length} issue(s)). Run: npm run skill:sync\n${mismatches
        .slice(0, 20)
        .join('\n')}`,
    );
  }
}

function verifyNoAbsolutePaths() {
  const textExtensions = new Set([
    '.md',
    '.yaml',
    '.yml',
    '.json',
    '.sh',
    '.mjs',
    '.js',
    '.txt',
  ]);
  const files = listFilesRecursively(SKILL_ROOT).filter((file) => {
    if (path.basename(file) === 'bundle-manifest.json') return false;
    return textExtensions.has(path.extname(file).toLowerCase()) || path.basename(file) === 'SKILL.md';
  });

  const violations = [];
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (raw.includes('/Users/')) violations.push(`${path.relative(REPO_ROOT, filePath)} contains /Users/`);
    if (raw.includes('/code/')) violations.push(`${path.relative(REPO_ROOT, filePath)} contains /code/`);
    const absoluteLiteral = raw.match(/["'`](\/[^"'`\s]+)["'`]/g) || [];
    for (const literal of absoluteLiteral) {
      const value = literal.slice(1, -1);
      if (value === '/usr/bin/env') continue;
      violations.push(`${path.relative(REPO_ROOT, filePath)} has absolute path literal: ${value}`);
    }
  }

  if (violations.length) {
    throw new Error(`Absolute path policy violation(s):\n${violations.slice(0, 30).join('\n')}`);
  }
}

function verifyOpenAiMetadata() {
  if (!fs.existsSync(SKILL_MD_PATH)) throw new Error(`Missing skill file: ${SKILL_MD_PATH}`);
  if (!fs.existsSync(OPENAI_YAML_PATH)) throw new Error(`Missing agents metadata: ${OPENAI_YAML_PATH}`);

  const skillName = parseSkillName(SKILL_MD_PATH);
  if (!skillName) throw new Error('Unable to read skill name from SKILL.md frontmatter.');
  const ui = parseOpenAiYamlInterface(OPENAI_YAML_PATH);
  if (!ui.display || !ui.shortDesc || !ui.prompt) {
    throw new Error('agents/openai.yaml must define display_name, short_description, and default_prompt.');
  }
  if (!ui.prompt.includes(`$${skillName}`)) {
    throw new Error(`agents/openai.yaml default_prompt should reference $${skillName}.`);
  }
}

function verifyBundledPostprocessRuntime() {
  if (!fs.existsSync(BUNDLED_POSTPROCESS_RUNTIME)) {
    throw new Error(
      `Missing bundled postprocess runtime directory: ${path.relative(REPO_ROOT, BUNDLED_POSTPROCESS_RUNTIME)}`,
    );
  }
  const missing = REQUIRED_POSTPROCESS_FILES.filter(
    (name) => !fs.existsSync(path.join(BUNDLED_POSTPROCESS_RUNTIME, name)),
  );
  if (missing.length) {
    throw new Error(
      `Bundled postprocess runtime is incomplete: ${missing.join(', ')}. Run: npm run skill:sync`,
    );
  }
}

function runSmoke() {
  if (!fs.existsSync(SKILL_RUNNER_PATH)) {
    throw new Error(`Missing skill runner script: ${SKILL_RUNNER_PATH}`);
  }
  if (!fs.existsSync(SMOKE_FIXTURE_PATH)) {
    throw new Error(
      `Missing canonical smoke fixture: ${path.relative(REPO_ROOT, SMOKE_FIXTURE_PATH)}`,
    );
  }
  const smokeOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kpmg-slidegen-skill-smoke-'));
  try {
    const smoke = spawnSync(
      'bash',
      [SKILL_RUNNER_PATH, '--in', SMOKE_FIXTURE_PATH, '--out-dir', smokeOutDir],
      {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      PYTHONDONTWRITEBYTECODE: '1',
    },
      },
    );
    if (smoke.status !== 0) {
      throw new Error(`Skill smoke failed.\n${smoke.stdout || ''}\n${smoke.stderr || ''}`.trim());
    }
    const output = (smoke.stdout || '').trim();
    if (output) console.log(output);
  } finally {
    fs.rmSync(smokeOutDir, { recursive: true, force: true });
  }
}

function main() {
  verifyManifest();
  verifyNoAbsolutePaths();
  verifyOpenAiMetadata();
  verifyBundledPostprocessRuntime();
  if (!SKIP_SMOKE) runSmoke();
  console.log('Skill bundle verification passed.');
}

main();
