import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateToFile } from '../../generator/index.js';
import { listPreviewImages } from '../../generator/app/artifacts.js';
import { loadTemplatePackage } from '../../generator/runtime/template-package.js';
import { createSlidesAdapter } from '../../generator/postprocess/slides-adapter.js';
import { REPO_ROOT } from '../support.mjs';

export { REPO_ROOT };
export const FIXTURE_ROOT = path.join(REPO_ROOT, 'fixtures', 'harness');
export const FIXTURE_MANIFEST_PATH = path.join(FIXTURE_ROOT, 'fixtures.manifest.json');
export const PRESET_ROOT = path.join(REPO_ROOT, 'presets', 'authoring');
export const PRESET_MANIFEST_PATH = path.join(PRESET_ROOT, 'presets.manifest.json');

/**
 * Read JSON from disk.
 * @param {string} filePath
 * @returns {any}
 */
export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Write JSON to disk with a trailing newline.
 * @param {string} filePath
 * @param {any} value
 */
export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Load the canonical fixture manifest.
 * @returns {object}
 */
export function readFixtureManifest() {
  return readJson(FIXTURE_MANIFEST_PATH);
}

/**
 * Load the canonical authoring preset manifest.
 * @returns {object}
 */
export function readPresetManifest() {
  return readJson(PRESET_MANIFEST_PATH);
}

/**
 * Resolve a fixture entry by id.
 * @param {string} fixtureId
 * @returns {object}
 */
export function getFixtureEntry(fixtureId) {
  const manifest = readFixtureManifest();
  const entry = (manifest.fixtures || []).find((item) => item.id === fixtureId);
  if (!entry) throw new Error(`Unknown fixture id: ${fixtureId}`);
  return entry;
}

/**
 * Load a fixture deckSpec and manifest entry.
 * @param {string} fixtureId
 * @returns {{entry: object, deckSpec: object, deckSpecPath: string}}
 */
export function loadFixture(fixtureId) {
  const entry = getFixtureEntry(fixtureId);
  const deckSpecPath = path.join(FIXTURE_ROOT, entry.deckSpec);
  return {
    entry,
    deckSpecPath,
    deckSpec: readJson(deckSpecPath),
  };
}

/**
 * List preview PNGs from a preview directory.
 * @param {string} previewDir
 * @returns {string[]}
 */
export function listPreviewPngs(previewDir) {
  return listPreviewImages(previewDir);
}

/**
 * Create a temp output directory for a harness run.
 * @param {string} prefix
 * @returns {string}
 */
export function makeTempRunDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

/**
 * Generate a fixture and return the output artifact paths.
 * @param {string} fixtureId
 * @param {object} options
 * @returns {Promise<object>}
 */
export async function generateFixture(fixtureId, options = {}) {
  const { entry, deckSpec } = loadFixture(fixtureId);
  const outDir = options.outDir || makeTempRunDir(`slidegen-${fixtureId}`);
  const outPath = path.join(outDir, 'deck.pptx');
  const qaPath = path.join(outDir, 'qa.json');
  const templatePackage = loadTemplatePackage(options.template || 'kpmg-diligence');
  const adapter =
    options.postprocessAdapter ||
    (options.postprocess ? createSlidesAdapter() : null);

  await generateToFile(deckSpec, outPath, {
    templatePackage,
    qaPath,
    runRoot: outDir,
    allowSparse: Boolean(deckSpec?.metadata?.allowSparse),
    enforceOverlap: options.enforceOverlap !== false,
    strict: Boolean(options.strict),
    postprocess: options.postprocess || null,
    postprocessAdapter: options.postprocess ? adapter : undefined,
  });

  return {
    entry,
    outDir,
    outPath,
    qaPath,
    qa: readJson(qaPath),
    adapter,
  };
}
