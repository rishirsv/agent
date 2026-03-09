import fs from 'node:fs';
import path from 'node:path';

import { getSlideRegistry } from '../../generator/runtime/slide-registry.js';
import {
  REPO_ROOT,
  getBlockingChecks,
  getLayoutPaths,
  loadOnboardedRegistryIndex,
  loadSourceRecord,
  parseArgMap,
  readJson,
  sanitizeCandidateLayout,
  toPascalCase,
  writeJson,
  writeOnboardedRegistry,
  writeSourceRecord,
  writeText,
} from './lib.mjs';

const BUILDER_ROOT = path.join(REPO_ROOT, 'generator', 'builders', 'onboarded');
const TEMPLATE_LAYOUTS_PATH = path.join(
  REPO_ROOT,
  'templates',
  'kpmg-diligence',
  'package',
  'layouts.json',
);
const GOLDEN_ALL_LAYOUTS_PATH = path.join(
  REPO_ROOT,
  'fixtures',
  'harness',
  'golden',
  'all-layouts',
  'deckSpec.json',
);
const FIXTURE_MANIFEST_PATH = path.join(
  REPO_ROOT,
  'fixtures',
  'harness',
  'fixtures.manifest.json',
);
const ROOT_SCHEMA_PATH = path.join(REPO_ROOT, 'references', 'deckspec.schema.json');
const ROOT_SLIDE_CONTRACT_PATH = path.join(REPO_ROOT, 'references', 'slide-contract.md');
const ROOT_LAYOUT_POLICY_PATH = path.join(REPO_ROOT, 'references', 'layout-policy.md');

function usage() {
  throw new Error(
    'Usage: node scripts/onboarding/promote-layout.mjs --layout-id <camelCaseId> --approved-by <name> [--approval-notes <text>]',
  );
}

function rewriteCandidateBuilderForCanonicalModule(source) {
  const repoFileUrlPrefix = `file://${REPO_ROOT.split(path.sep).join('/')}/generator/`;
  return source
    .replaceAll(repoFileUrlPrefix, '../../')
    .replace(/\.\.\/\.\.\/\.\.\/generator\//g, '../../');
}

function upsertOnboardedRegistryEntry({ layoutId, family }) {
  const registry = getSlideRegistry();
  const baseEntry = registry.get(family);
  if (!baseEntry) {
    throw new Error(`Unknown base family in registry: ${family}`);
  }

  const index = loadOnboardedRegistryIndex();
  const pascal = toPascalCase(layoutId);
  const nextEntry = {
    type: layoutId,
    builderFile: layoutId,
    exportName: `build${pascal}`,
    registryEntry: {
      builderId: layoutId,
      builder: '__BUILDER_REF__',
      master: baseEntry.master,
      requiredGeometry: [...(baseEntry.requiredGeometry || [])],
      optionalGeometry: [...(baseEntry.optionalGeometry || [])],
      optionalDefaults: { ...(baseEntry.optionalDefaults || {}) },
      paginationPolicyKey: baseEntry.paginationPolicyKey,
      validationHooks: [...(baseEntry.validationHooks || [])],
      excludeFromLogicalPaging: Boolean(baseEntry.excludeFromLogicalPaging),
    },
  };

  const merged = (index.entries || []).filter((entry) => entry.type !== layoutId);
  merged.push(nextEntry);
  merged.sort((a, b) => a.type.localeCompare(b.type));
  writeOnboardedRegistry(merged);
}

function upsertTemplateLayout({ layoutId, candidateLayout }) {
  const layouts = readJson(TEMPLATE_LAYOUTS_PATH);
  layouts.types = layouts.types || {};
  layouts.types[layoutId] = sanitizeCandidateLayout(candidateLayout);
  writeJson(TEMPLATE_LAYOUTS_PATH, layouts);
}

function upsertGoldenFixture({ layoutId, candidateDeckSpec }) {
  const golden = readJson(GOLDEN_ALL_LAYOUTS_PATH);
  const starterSlide = JSON.parse(JSON.stringify(candidateDeckSpec?.slides?.[0] || null));
  if (!starterSlide) {
    throw new Error('Candidate deck spec is missing its starter slide.');
  }
  starterSlide.type = layoutId;
  const withoutCurrent = (golden.slides || []).filter((slide) => slide?.type !== layoutId);
  withoutCurrent.push(starterSlide);
  golden.slides = withoutCurrent;
  writeJson(GOLDEN_ALL_LAYOUTS_PATH, golden);
}

function upsertReferenceParityFixture({ layoutId, source, candidateDeckSpec }) {
  const fixtureDir = path.join(
    REPO_ROOT,
    'fixtures',
    'harness',
    'reference-parity',
    layoutId,
  );
  const deckSpecPath = path.join(fixtureDir, 'deckSpec.json');
  const starterSlide = JSON.parse(JSON.stringify(candidateDeckSpec?.slides?.[0] || null));
  if (!starterSlide) {
    throw new Error('Candidate deck spec is missing its starter slide.');
  }
  starterSlide.type = layoutId;
  const deckSpec = {
    metadata: {
      ...(candidateDeckSpec.metadata || {}),
      title: `${toPascalCase(layoutId)} Reference Parity`,
      allowSparse: true,
    },
    slides: [starterSlide],
  };
  writeJson(deckSpecPath, deckSpec);

  const manifest = readJson(FIXTURE_MANIFEST_PATH);
  const fixtureId = `reference-parity-${layoutId}`;
  const fixtureRelPath = path
    .relative(path.join(REPO_ROOT, 'fixtures', 'harness'), deckSpecPath)
    .split(path.sep)
    .join('/');
  const pptxRelPath = path
    .relative(fixtureDir, source.sourcePptxPath)
    .split(path.sep)
    .join('/');
  const nextEntry = {
    id: fixtureId,
    class: 'reference-parity',
    owner: 'slidegen',
    families: [layoutId],
    textAmount: candidateDeckSpec?.metadata?.textAmount || 'lg',
    expectedOutcome: 'pass',
    blockingSafe: false,
    baselineBearing: false,
    origin: 'reference-derived',
    deckSpec: fixtureRelPath,
    reference: {
      pptx: pptxRelPath,
      slideNumber: Number(source.sourceSlideNumber),
      candidateSlideNumber: 1,
    },
  };
  manifest.fixtures = (manifest.fixtures || []).filter((entry) => entry.id !== fixtureId);
  manifest.fixtures.push(nextEntry);
  manifest.fixtures.sort((a, b) => a.id.localeCompare(b.id));
  writeJson(FIXTURE_MANIFEST_PATH, manifest);
}

function upsertSchema({ layoutId, family }) {
  const schema = readJson(ROOT_SCHEMA_PATH);
  const defs = schema.$defs || {};
  const familyEntry = Object.entries(defs).find(
    ([, value]) => value?.properties?.type?.const === family,
  );
  if (!familyEntry) {
    throw new Error(`Unable to find schema definition for family: ${family}`);
  }
  const [familyDefKey, familyDef] = familyEntry;
  const nextDefKey = `slide${toPascalCase(layoutId)}`;
  const nextDef = JSON.parse(JSON.stringify(familyDef));
  nextDef.properties.type.const = layoutId;
  defs[nextDefKey] = nextDef;

  const oneOf = defs.slide?.oneOf || [];
  const refPath = `#/$defs/${nextDefKey}`;
  if (!oneOf.some((entry) => entry?.$ref === refPath)) {
    oneOf.push({ $ref: refPath });
  }
  schema.$defs = defs;
  schema.$defs.slide.oneOf = oneOf;
  writeJson(ROOT_SCHEMA_PATH, schema);
}

function cloneSection(markdown, family, layoutId) {
  const escaped = family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionPattern = new RegExp(
    `### \\\`${escaped}\\\`\\n[\\s\\S]*?(?=\\n### \\\`|\\n## |$)`,
    'm',
  );
  const match = markdown.match(sectionPattern);
  if (!match) {
    throw new Error(`Unable to find slide contract section for family: ${family}`);
  }
  return match[0].replaceAll(`\`${family}\``, `\`${layoutId}\``);
}

function upsertSlideContract({ layoutId, family }) {
  const original = fs.readFileSync(ROOT_SLIDE_CONTRACT_PATH, 'utf8');
  const existingPattern = new RegExp(`### \\\`${layoutId}\\\`\\n`, 'm');
  const nextSection = cloneSection(original, family, layoutId);
  let output = original;
  if (existingPattern.test(original)) {
    const sectionPattern = new RegExp(
      `### \\\`${layoutId}\\\`\\n[\\s\\S]*?(?=\\n### \\\`|\\n## |$)`,
      'm',
    );
    output = original.replace(sectionPattern, nextSection);
  } else {
    output = original.replace('\n## Behavioral Contract Notes', `\n${nextSection}\n\n## Behavioral Contract Notes`);
  }
  writeText(ROOT_SLIDE_CONTRACT_PATH, output);
}

function upsertLayoutPolicy({ layoutId, family }) {
  const original = fs.readFileSync(ROOT_LAYOUT_POLICY_PATH, 'utf8');
  const line = `- \`${layoutId}\`: canonical onboarded layout based on \`${family}\`. Use the same selection heuristics as the base family unless repo docs for this layout say otherwise.`;
  const header = '## Onboarded Canonical Types';
  let output = original;
  if (!original.includes(header)) {
    output = `${original.trim()}\n\n${header}\n\n${line}\n`;
  } else if (!original.includes(line)) {
    output = output.replace(header, `${header}\n\n${line}`);
  }
  writeText(ROOT_LAYOUT_POLICY_PATH, output);
}

const args = parseArgMap(process.argv.slice(2));
const layoutId = args.get('layout-id');
const approvedBy = args.get('approved-by');
const approvalNotes = args.get('approval-notes')
  ? String(args.get('approval-notes'))
  : null;

if (!layoutId || !approvedBy) usage();

const paths = getLayoutPaths(String(layoutId));
const source = loadSourceRecord(String(layoutId));
if (!source.family) {
  throw new Error('Cannot promote a layout without a selected base family.');
}

const qa = readJson(paths.candidateQaPath);
const blockingChecks = getBlockingChecks(qa);
if (blockingChecks.length > 0) {
  throw new Error(
    `Cannot promote because candidate QA has blocking checks: ${blockingChecks
      .map((check) => `${check.id}:${check.status}`)
      .join(', ')}`,
  );
}
const scorecard = readJson(paths.scorecardPath);
if (!scorecard?.pass) {
  throw new Error('Cannot promote because compare scorecard did not pass.');
}
if (!fs.existsSync(paths.referencePngPath) || !fs.existsSync(paths.candidatePngPath)) {
  throw new Error('Cannot promote without reference and candidate PNG artifacts.');
}

const candidateLayout = readJson(paths.candidateLayoutPath);
const candidateDeckSpec = readJson(paths.candidateDeckSpecPath);
const candidateBuilderSource = fs.readFileSync(paths.candidateBuilderPath, 'utf8');
const canonicalBuilderPath = path.join(BUILDER_ROOT, `${layoutId}.js`);
writeText(
  canonicalBuilderPath,
  rewriteCandidateBuilderForCanonicalModule(candidateBuilderSource),
);

upsertOnboardedRegistryEntry({
  layoutId: String(layoutId),
  family: source.family,
});
upsertTemplateLayout({
  layoutId: String(layoutId),
  candidateLayout,
});
upsertGoldenFixture({
  layoutId: String(layoutId),
  candidateDeckSpec,
});
upsertReferenceParityFixture({
  layoutId: String(layoutId),
  source,
  candidateDeckSpec,
});
upsertSchema({
  layoutId: String(layoutId),
  family: source.family,
});
upsertSlideContract({
  layoutId: String(layoutId),
  family: source.family,
});
upsertLayoutPolicy({
  layoutId: String(layoutId),
  family: source.family,
});

writeSourceRecord(String(layoutId), {
  ...source,
  status: 'promoted',
  approval: {
    approved: true,
    approvedBy: String(approvedBy),
    approvedAt: new Date().toISOString(),
    notes: approvalNotes,
  },
});

console.log(`Promoted canonical layout: ${layoutId}`);
console.log(`Builder: ${canonicalBuilderPath}`);
