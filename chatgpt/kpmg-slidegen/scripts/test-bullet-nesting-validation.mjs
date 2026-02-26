import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateToFile } from '../generator/index.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const fixturePath = path.join(process.cwd(), 'decks', 'validation-failing-legacy-nested-bullets.deckSpec.json');
const fixtureDeck = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slidegen-bullet-nesting-validation-'));
const outPath = path.join(tmpDir, 'deck.pptx');
const qaPath = path.join(tmpDir, 'qa.json');
const templatePackage = loadTemplatePackage('kpmg-diligence');

let thrown = null;
try {
  await generateToFile(fixtureDeck, outPath, {
    templatePackage,
    qaPath,
    strict: false,
    enforceOverlap: false,
  });
} catch (error) {
  thrown = error;
}

assert.ok(thrown instanceof Error, 'Expected generation to fail for legacy nested bullet fixture');
assert.equal(fs.existsSync(qaPath), true, 'Expected QA report to be written on validation failure');

const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
assert.equal(qa?.valid, false, 'Expected invalid QA report');
assert.equal(qa?.outputSlideCount, 0, 'Expected no rendered slides for validation failure');
assert.equal(qa?.summary?.status, 'fail', 'Expected failure summary status');
assert.ok(Array.isArray(qa?.errors) && qa.errors.length > 0, 'Expected validation errors');
assert.ok(
  qa.errors.some((item) => String(item).includes('legacy nested array')),
  'Expected legacy nested array validation error',
);

console.log('Bullet nesting validation regression passed.');
console.log(`Fixture: ${fixturePath}`);
console.log(`QA: ${qaPath}`);
