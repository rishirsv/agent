import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { resolveVerbosityMetadata } from '../generator/runtime/verbosity-contract.js';
import {
  FIXTURE_MANIFEST_PATH,
  FIXTURE_ROOT,
  PRESET_MANIFEST_PATH,
  PRESET_ROOT,
  REPO_ROOT,
  readJson,
} from './harness/lib.mjs';

const VALID_CLASSES = new Set([
  'golden',
  'regression',
  'stress',
  'scenario',
  'reference-parity',
  'invalid',
]);
const VALID_TEXT_AMOUNTS = new Set(['sm', 'md', 'lg', 'xl']);
const VALID_DENSITY_PROFILES = new Set(['dense', 'denser', 'densest']);

/**
 * Ensure a path exists on disk.
 * @param {string} filePath
 */
function assertExists(filePath) {
  assert.equal(fs.existsSync(filePath), true, `Expected file to exist: ${filePath}`);
}

/**
 * Recursively list deckSpec files inside a directory.
 * @param {string} rootDir
 * @returns {string[]}
 */
function listDeckSpecs(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
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
      if (entry.isFile() && entry.name.endsWith('.deckSpec.json')) out.push(full);
    }
  }
  return out.sort();
}

const fixtureManifest = readJson(FIXTURE_MANIFEST_PATH);
const fixtureEntries = fixtureManifest.fixtures || [];
assert.ok(fixtureEntries.length >= 10, 'Fixture manifest should describe the curated harness set.');

const seenFixtureIds = new Set();
for (const entry of fixtureEntries) {
  assert.ok(entry.id, 'Fixture id is required.');
  assert.equal(seenFixtureIds.has(entry.id), false, `Duplicate fixture id: ${entry.id}`);
  seenFixtureIds.add(entry.id);
  assert.ok(VALID_CLASSES.has(entry.class), `Invalid fixture class for ${entry.id}`);
  assert.ok(Array.isArray(entry.families) && entry.families.length > 0, `Fixture families missing for ${entry.id}`);
  assert.ok(VALID_TEXT_AMOUNTS.has(entry.textAmount), `Invalid textAmount for ${entry.id}`);
  assert.ok(VALID_DENSITY_PROFILES.has(entry.densityProfile), `Invalid densityProfile for ${entry.id}`);
  assert.ok(['pass', 'fail'].includes(entry.expectedOutcome), `Invalid expectedOutcome for ${entry.id}`);
  assert.equal(typeof entry.blockingSafe, 'boolean', `blockingSafe must be boolean for ${entry.id}`);
  assert.ok(entry.origin, `origin missing for ${entry.id}`);

  const deckSpecPath = path.join(FIXTURE_ROOT, entry.deckSpec);
  assertExists(deckSpecPath);
  const deckSpec = readJson(deckSpecPath);
  assert.ok(Array.isArray(deckSpec?.slides) && deckSpec.slides.length > 0, `Fixture deck must contain slides: ${entry.id}`);

  if (entry.expectedOutcome === 'pass') {
    assert.equal(
      deckSpec.metadata.textAmount,
      entry.textAmount,
      `Fixture metadata.textAmount mismatch for ${entry.id}`,
    );
  }
  if (entry.expectedOutcome === 'pass') {
    assert.equal(
      deckSpec.metadata.densityProfile,
      entry.densityProfile,
      `Fixture metadata.densityProfile mismatch for ${entry.id}`,
    );
  }
}

const presetManifest = readJson(PRESET_MANIFEST_PATH);
const presetEntries = presetManifest.presets || [];
assert.deepEqual(
  presetEntries.map((entry) => entry.id).sort(),
  ['concise', 'detailed', 'extensive', 'minimal'],
  'Authoring presets must cover the four supported verbosity tiers.',
);

for (const entry of presetEntries) {
  assert.ok(Array.isArray(entry.aliases) && entry.aliases.length > 0, `Preset aliases missing for ${entry.id}`);
  assert.ok(VALID_TEXT_AMOUNTS.has(entry.textAmount), `Invalid preset textAmount for ${entry.id}`);
  assert.ok(VALID_DENSITY_PROFILES.has(entry.densityProfile), `Invalid preset densityProfile for ${entry.id}`);

  const deckSpecPath = path.join(PRESET_ROOT, entry.deckSpec);
  assertExists(deckSpecPath);
  const deckSpec = readJson(deckSpecPath);
  assert.equal(deckSpec?.metadata?.textAmount, entry.textAmount, `Preset textAmount mismatch for ${entry.id}`);
  assert.equal(
    deckSpec?.metadata?.densityProfile,
    entry.densityProfile,
    `Preset densityProfile mismatch for ${entry.id}`,
  );
  const resolved = resolveVerbosityMetadata(deckSpec.metadata || {});
  assert.equal(resolved.textAmount, entry.textAmount, `Resolved textAmount mismatch for ${entry.id}`);
  assert.equal(resolved.densityProfile, entry.densityProfile, `Resolved densityProfile mismatch for ${entry.id}`);
  assert.deepEqual(resolved.errors || [], [], `Preset verbosity metadata must be explicit for ${entry.id}`);
}

const legacyDeckSpecs = listDeckSpecs(path.join(REPO_ROOT, 'decks')).filter(
  (filePath) => path.dirname(filePath) === path.join(REPO_ROOT, 'decks'),
);
assert.deepEqual(
  legacyDeckSpecs,
  [],
  'Legacy repo-owned deckSpec fixtures should not live at the top level of decks/.',
);

console.log('Fixture lane passed.');
