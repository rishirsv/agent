import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { buildRenderContext } from '../generator/runtime/render-context.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';
import { REPO_ROOT } from './support.mjs';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const ctx = buildRenderContext({ templatePackage });
const expectedBuilderCtxKeys = [
  'assets',
  'diagnostics',
  'footerSafeTopByMaster',
  'geometry',
  'masterName',
  'options',
  'template',
  'theme',
];

/**
 * Read JSON from the repo root.
 * @param {string} relPath
 * @returns {any}
 */
function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8'));
}

/**
 * Return sorted unique values.
 * @param {string[]} values
 * @returns {string[]}
 */
function sortedUnique(values) {
  return Array.from(new Set(values)).sort();
}

/**
 * Find items present in expected but missing from actual.
 * @param {string[]} expected
 * @param {string[]} actual
 * @returns {string[]}
 */
function diff(expected, actual) {
  const actualSet = new Set(actual);
  return expected.filter((item) => !actualSet.has(item));
}

/**
 * Determine whether a geometry box is fully defined.
 * @param {any} value
 * @returns {boolean}
 */
function isFiniteBox(value) {
  return Boolean(
    value &&
      Number.isFinite(value.x) &&
      Number.isFinite(value.y) &&
      Number.isFinite(value.w) &&
      Number.isFinite(value.h),
  );
}

/**
 * Determine whether a geometry payload contains at least one finite box.
 * @param {any} value
 * @returns {boolean}
 */
function hasFiniteBox(value) {
  if (isFiniteBox(value)) return true;
  if (Array.isArray(value)) return value.some((item) => hasFiniteBox(item));
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some((item) => hasFiniteBox(item));
}

/**
 * Determine whether a required geometry slot is valid.
 * @param {any} value
 * @returns {boolean}
 */
function hasRequiredGeometryValue(value) {
  if (Array.isArray(value)) return value.length > 0 && value.every((box) => isFiniteBox(box));
  return isFiniteBox(value);
}

const schema = readJson('skills/kpmg-slides/references/deckspec.schema.json');
const templateTypes = sortedUnique(Object.keys(templatePackage?.layouts?.types || {}));
const schemaTypes = sortedUnique(
  Object.entries(schema?.$defs || {})
    .filter(([defName]) => defName !== 'slide')
    .map(([, def]) => def?.properties?.type?.const)
    .filter(Boolean),
);
const registryTypes = ctx.slideRegistry.list().slice().sort();

assert.deepEqual(diff(templateTypes, schemaTypes), [], 'Every template type must appear in the docs schema.');
assert.deepEqual(diff(schemaTypes, templateTypes), [], 'Schema must not document unknown slide types.');
assert.deepEqual(registryTypes, templateTypes, 'Slide registry must cover every template type exactly once.');
assert.ok(templatePackage?.layouts?.masters?.variants, 'Template package must expose master variants.');
assert.ok(templatePackage?.tokens?.dimensions, 'Template package must expose slide dimensions.');

for (const type of registryTypes) {
  const entry = ctx.slideRegistry.get(type);
  assert.ok(entry, `Registry entry missing for ${type}`);
  assert.equal(typeof entry.builder, 'function', `Builder missing for ${type}`);
  assert.ok(entry.builderId, `builderId missing for ${type}`);
  assert.equal(typeof entry.master, 'string', `master missing for ${type}`);
  assert.ok(entry.paginationPolicyKey, `paginationPolicyKey missing for ${type}`);

  const policy = ctx.paginationPolicy.get(entry.paginationPolicyKey);
  assert.ok(policy, `Pagination policy missing for ${type}`);
  assert.match(policy.key, /^.+\.v\d+$/, `Pagination policy key should be versioned for ${type}`);

  const contract = ctx.templateContracts.get(type);
  assert.ok(contract, `Template contract missing for ${type}`);
  assert.equal(
    contract.schemaVersion,
    ctx.templateContracts.schemaVersion,
    `Contract schema version mismatch for ${type}`,
  );

  for (const key of entry.geometryContract.requiredKeys || []) {
    const value = contract?.boxes?.[key];
    assert.ok(hasRequiredGeometryValue(value), `Required geometry key "${key}" missing for ${type}`);
  }

  const resolved = ctx.contracts.resolveForSlide({ type }, type);
  assert.ok(hasFiniteBox(resolved?.geometry), `Resolved geometry should be finite for ${type}`);
  assert.equal(typeof resolved.masterName, 'string', `Resolved masterName should be present for ${type}`);

  const builderCtx = ctx.buildBuilderCtx({
    slideSpec: { type },
    registryType: type,
    options: { ...ctx.options, footerValues: {} },
  });
  assert.deepEqual(
    Object.keys(builderCtx).sort(),
    expectedBuilderCtxKeys,
    `Builder context keys mismatch for ${type}`,
  );
}

console.log('Contract lane passed.');
