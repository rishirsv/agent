import { runNodeScripts } from './support.mjs';

const lanes = [
  'scripts/test-contracts.mjs',
  'scripts/test-fixtures.mjs',
  'scripts/test-structure.mjs',
  'scripts/test-render.mjs',
  'scripts/test-dist.mjs',
];

runNodeScripts(lanes);

console.log('PR lane passed.');
