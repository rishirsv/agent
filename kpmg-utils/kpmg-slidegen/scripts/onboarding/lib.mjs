import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { generateToFile } from '../../generator/index.js';
import { createSlidesAdapter } from '../../generator/postprocess/slides-adapter.js';
import { getSlideRegistry } from '../../generator/runtime/slide-registry.js';
import {
  cloneTemplatePackage,
  loadTemplatePackage,
} from '../../generator/runtime/template-package.js';
import { REPO_ROOT } from '../support.mjs';

export { REPO_ROOT };

export const ONBOARDING_LAYOUT_ROOT =
  process.env.ONBOARDING_LAYOUT_ROOT || path.join(REPO_ROOT, 'onboarding', 'layouts');
export const ONBOARDING_OUTPUT_ROOT =
  process.env.ONBOARDING_OUTPUT_ROOT || path.join(REPO_ROOT, 'outputs', 'onboarding');
export const ONBOARDING_POLICY_ROOT = path.join(REPO_ROOT, 'onboarding', 'policies');
export const GOLDEN_ALL_LAYOUTS_PATH = path.join(
  REPO_ROOT,
  'fixtures',
  'harness',
  'golden',
  'all-layouts',
  'deckSpec.json',
);
export const DIFF_THRESHOLDS_PATH = path.join(
  ONBOARDING_POLICY_ROOT,
  'diff-thresholds.json',
);
export const FAMILY_POLICIES_PATH = path.join(
  ONBOARDING_POLICY_ROOT,
  'families.json',
);
export const ONBOARDED_REGISTRY_INDEX_PATH = path.join(
  REPO_ROOT,
  'generator',
  'runtime',
  'onboarded-registry.index.json',
);
export const ONBOARDED_REGISTRY_MODULE_PATH = path.join(
  REPO_ROOT,
  'generator',
  'runtime',
  'onboarded-registry.generated.js',
);
export const DEFAULT_PREVIEW_WIDTH = 1600;
export const DEFAULT_PREVIEW_HEIGHT = 900;
export const DEFAULT_VISUAL_OVERFLOW_PAD_PX = 100;

/**
 * Parse CLI args into a stable flag map.
 *
 * @param {string[]} argv
 * @returns {Map<string, string|boolean>}
 */
export function parseArgMap(argv = []) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args.set(key, next);
      i += 1;
    } else {
      args.set(key, true);
    }
  }
  return args;
}

/**
 * Read JSON from disk.
 *
 * @param {string} filePath
 * @returns {any}
 */
export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Write JSON with a trailing newline.
 *
 * @param {string} filePath
 * @param {any} value
 */
export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Write text with a parent directory guard.
 *
 * @param {string} filePath
 * @param {string} value
 */
export function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

/**
 * Ensure a directory exists.
 *
 * @param {string} dirPath
 */
export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Normalize a PNG to the fixed comparison canvas used by onboarding.
 *
 * @param {object} params
 * @returns {string}
 */
export function normalizePng({
  inputPath,
  outputPath,
  width = DEFAULT_PREVIEW_WIDTH,
  height = DEFAULT_PREVIEW_HEIGHT,
}) {
  const normalizeScript = path.join(REPO_ROOT, 'scripts', 'onboarding', 'normalize_png.py');
  ensureDir(path.dirname(outputPath));
  const normalize = spawnSync(
    'python3',
    [
      normalizeScript,
      '--input',
      inputPath,
      '--output',
      outputPath,
      '--width',
      String(width),
      '--height',
      String(height),
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    },
  );
  if (normalize.status !== 0) {
    throw new Error(
      `Failed to normalize PNG.\n${normalize.stdout || ''}\n${normalize.stderr || ''}`.trim(),
    );
  }
  return outputPath;
}

/**
 * Validate and normalize a layout id.
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeLayoutId(raw) {
  const value = String(raw || '').trim();
  if (!/^[a-z][a-zA-Z0-9]+$/.test(value)) {
    throw new Error(
      'Expected --layout-id to be camelCase and start with a lowercase letter.',
    );
  }
  return value;
}

/**
 * Convert a layout id to PascalCase for export names.
 *
 * @param {string} value
 * @returns {string}
 */
export function toPascalCase(value) {
  const normalized = normalizeLayoutId(value);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Return all stable repo paths for a layout onboarding workspace.
 *
 * @param {string} layoutId
 * @returns {object}
 */
export function getLayoutPaths(layoutId) {
  const normalized = normalizeLayoutId(layoutId);
  const layoutRoot = path.join(ONBOARDING_LAYOUT_ROOT, normalized);
  const outputRoot = path.join(ONBOARDING_OUTPUT_ROOT, normalized);
  return {
    layoutId: normalized,
    layoutRoot,
    sourcePath: path.join(layoutRoot, 'source.json'),
    seedDir: path.join(layoutRoot, 'seed'),
    seedPath: path.join(layoutRoot, 'seed', 'geometry.seed.json'),
    candidateLayoutPath: path.join(layoutRoot, 'candidate.layout.json'),
    candidateBuilderPath: path.join(layoutRoot, 'candidate.builder.js'),
    candidateDeckSpecPath: path.join(layoutRoot, 'candidate.deckSpec.json'),
    outputRoot,
    candidateDir: path.join(outputRoot, 'candidate'),
    candidateDeckPath: path.join(outputRoot, 'candidate', 'deck.pptx'),
    candidateQaPath: path.join(outputRoot, 'candidate', 'qa.json'),
    candidatePreviewDir: path.join(outputRoot, 'candidate', 'preview'),
    candidatePreviewPngPath: path.join(outputRoot, 'candidate', 'preview', 'slide-1.png'),
    candidateMontagePath: path.join(outputRoot, 'candidate', 'montage.png'),
    compareDir: path.join(outputRoot, 'compare'),
    referencePngPath: path.join(outputRoot, 'compare', 'reference.png'),
    candidatePngPath: path.join(outputRoot, 'compare', 'candidate.png'),
    diffPngPath: path.join(outputRoot, 'compare', 'diff.png'),
    diffJsonPath: path.join(outputRoot, 'compare', 'diff.json'),
    scorecardPath: path.join(outputRoot, 'compare', 'scorecard.json'),
  };
}

/**
 * Ensure the workspace and output directories exist for a layout id.
 *
 * @param {string} layoutId
 * @returns {object}
 */
export function ensureLayoutPaths(layoutId) {
  const paths = getLayoutPaths(layoutId);
  [
    paths.layoutRoot,
    paths.seedDir,
    paths.candidateDir,
    paths.candidatePreviewDir,
    paths.compareDir,
  ].forEach(ensureDir);
  return paths;
}

/**
 * Load repo-only onboarding policies.
 *
 * @returns {object}
 */
export function loadFamilyPolicies() {
  return readJson(FAMILY_POLICIES_PATH);
}

/**
 * Load deterministic diff thresholds.
 *
 * @returns {object}
 */
export function loadDiffThresholds() {
  return readJson(DIFF_THRESHOLDS_PATH);
}

/**
 * Return the base family policy or throw.
 *
 * @param {string} family
 * @returns {object}
 */
export function getFamilyPolicy(family) {
  const policies = loadFamilyPolicies();
  const entry = policies?.families?.[family];
  if (!entry) {
    throw new Error(`Unknown onboarding family: ${family}`);
  }
  return entry;
}

/**
 * Load the golden all-layouts deck and return a starter slide for a family.
 *
 * @param {string} family
 * @param {string} layoutId
 * @returns {object}
 */
export function buildStarterSlideFromFamily(family, layoutId) {
  const golden = readJson(GOLDEN_ALL_LAYOUTS_PATH);
  const baseSlide = (golden?.slides || []).find((slide) => slide?.type === family);
  if (!baseSlide) {
    return {
      type: layoutId,
      title: `Draft ${layoutId}`,
      body: ['Replace this placeholder with candidate content.'],
      bodyStyle: 'bullets',
    };
  }
  return {
    ...JSON.parse(JSON.stringify(baseSlide)),
    type: layoutId,
  };
}

/**
 * Build a candidate layout scaffold.
 *
 * @param {object} params
 * @returns {object}
 */
export function buildCandidateLayoutScaffold({ templatePackage, family, layoutId }) {
  if (!family) {
    return {
      schemaVersion: 1,
      type: layoutId,
      family: null,
      description: `Draft layout ${layoutId}`,
      templateLayout: `Draft ${layoutId}`,
      geometry: {},
      slots: {},
      densityTarget: {
        mode: 'balanced',
        minScore: 0.72,
      },
    };
  }

  const baseLayout = templatePackage?.layouts?.types?.[family];
  if (!baseLayout) {
    throw new Error(`Unable to scaffold candidate layout from unknown family: ${family}`);
  }

  return {
    ...JSON.parse(JSON.stringify(baseLayout)),
    schemaVersion: 1,
    type: layoutId,
    family,
    description: `Draft layout ${layoutId} based on ${family}`,
    templateLayout: `Draft ${layoutId}`,
  };
}

/**
 * Build a candidate deckspec scaffold.
 *
 * @param {object} params
 * @returns {object}
 */
export function buildCandidateDeckSpecScaffold({ family, layoutId }) {
  if (!family) {
    return {
      metadata: {
        title: `Draft ${layoutId}`,
        textAmount: 'md',
        allowSparse: true,
      },
      slides: [],
    };
  }

  return {
    metadata: {
      title: `Draft ${layoutId}`,
      textAmount: 'lg',
      allowSparse: true,
    },
    slides: [buildStarterSlideFromFamily(family, layoutId)],
  };
}

/**
 * Build the candidate builder scaffold source.
 *
 * @param {object} params
 * @returns {string}
 */
export function buildCandidateBuilderSource({ family, layoutId }) {
  const pascal = toPascalCase(layoutId);
  if (!family) {
    return `export function build${pascal}() {\n  throw new Error('Select a base family in source.json before rendering this candidate layout.');\n}\n\nexport default build${pascal};\n`;
  }

  const policy = getFamilyPolicy(family);
  const importPath = pathToFileURL(path.join(REPO_ROOT, policy.builderModule)).href;

  return `import { ${policy.builderExport} } from '${importPath}';\n\nexport function build${pascal}(pptx, slideSpec, ctx) {\n  return ${policy.builderExport}(pptx, slideSpec, ctx);\n}\n\nexport default build${pascal};\n`;
}

/**
 * Remove draft-only metadata before writing a canonical template layout entry.
 *
 * @param {object} candidateLayout
 * @returns {object}
 */
export function sanitizeCandidateLayout(candidateLayout) {
  const sanitizedLayout = JSON.parse(JSON.stringify(candidateLayout));
  delete sanitizedLayout.type;
  delete sanitizedLayout.family;
  delete sanitizedLayout.schemaVersion;
  return sanitizedLayout;
}

/**
 * Load a draft builder module from disk.
 *
 * @param {string} filePath
 * @param {string} layoutId
 * @returns {Promise<Function>}
 */
export async function loadDraftBuilder(filePath, layoutId) {
  const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`);
  const pascal = toPascalCase(layoutId);
  const builder =
    mod.default ||
    mod[`build${pascal}`] ||
    mod.builder ||
    null;
  if (typeof builder !== 'function') {
    throw new Error(`Draft builder file does not export a function: ${filePath}`);
  }
  return builder;
}

/**
 * Create an overlaid template package that includes a draft type.
 *
 * @param {object} params
 * @returns {object}
 */
export function buildDraftTemplatePackage({ templatePackage, layoutId, candidateLayout }) {
  return cloneTemplatePackage(templatePackage, {
    layouts: {
      types: {
        [layoutId]: sanitizeCandidateLayout(candidateLayout),
      },
    },
  });
}

/**
 * Build a draft slide registry entry from a base family plus builder.
 *
 * @param {object} params
 * @returns {object}
 */
export function buildDraftRegistryEntry({ family, layoutId, builder }) {
  const baseRegistry = getSlideRegistry();
  const baseEntry = baseRegistry.get(family);
  if (!baseEntry) {
    throw new Error(`Unknown base family in slide registry: ${family}`);
  }
  return {
    ...baseEntry,
    builderId: layoutId,
    builder,
    requiredGeometry: [...(baseEntry.requiredGeometry || [])],
    optionalGeometry: [...(baseEntry.optionalGeometry || [])],
    optionalDefaults: { ...(baseEntry.optionalDefaults || {}) },
    geometryContract: {
      requiredKeys: [...(baseEntry.geometryContract?.requiredKeys || [])],
      optionalKeys: [...(baseEntry.geometryContract?.optionalKeys || [])],
      optionalDefaults: { ...(baseEntry.geometryContract?.optionalDefaults || {}) },
    },
  };
}

/**
 * Capture a reference slide PNG using the same preview adapter as candidate rendering.
 *
 * @param {object} params
 * @returns {string}
 */
export function captureReferenceSlide({
  pptxPath,
  slideNumber,
  referencePngPath,
  width = DEFAULT_PREVIEW_WIDTH,
  height = DEFAULT_PREVIEW_HEIGHT,
}) {
  const adapter = createSlidesAdapter();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kpmg-layout-reference-'));
  try {
    const preview = adapter.renderPreview({
      pptxPath,
      outputDir: tempDir,
      width,
      height,
    });
    if (preview?.status !== 'ok') {
      throw new Error(
        `Failed to render reference preview: ${preview?.reason || 'unknown_reason'}`,
      );
    }
    const sourcePng = path.join(tempDir, `slide-${Number(slideNumber)}.png`);
    if (!fs.existsSync(sourcePng)) {
      throw new Error(`Reference slide ${slideNumber} was not found in rendered preview output.`);
    }
    normalizePng({
      inputPath: sourcePng,
      outputPath: referencePngPath,
      width,
      height,
    });
    return referencePngPath;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Run the optional XML seed extractor for a selected slide.
 *
 * @param {object} params
 */
export function extractGeometrySeed({ pptxPath, slideNumber, seedPath }) {
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'onboarding', 'extract_slide_seed.py');
  ensureDir(path.dirname(seedPath));
  const result = spawnSync(
    'python3',
    [scriptPath, '--pptx', pptxPath, '--slide', String(slideNumber), '--out', seedPath],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: '1',
      },
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `Seed extraction failed.\n${result.stdout || ''}\n${result.stderr || ''}`.trim(),
    );
  }
}

/**
 * Build a stable onboarding source record.
 *
 * @param {object} input
 * @returns {object}
 */
export function buildSourceRecord(input) {
  return {
    schemaVersion: 1,
    layoutId: input.layoutId,
    sourcePptxPath: input.sourcePptxPath,
    sourceSlideNumber: Number(input.sourceSlideNumber),
    family: input.family || null,
    suggestedFamily: input.suggestedFamily || null,
    status: input.status || 'draft',
    extractSeed: Boolean(input.extractSeed),
    approval: input.approval || {
      approved: false,
      approvedBy: null,
      approvedAt: null,
      notes: null,
    },
    artifacts: {
      referencePngPath: input.referencePngPath || null,
      candidateQaPath: input.candidateQaPath || null,
      scorecardPath: input.scorecardPath || null,
    },
  };
}

/**
 * Load the persisted source record for a layout.
 *
 * @param {string} layoutId
 * @returns {object}
 */
export function loadSourceRecord(layoutId) {
  const { sourcePath } = getLayoutPaths(layoutId);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing onboarding source record: ${sourcePath}`);
  }
  return readJson(sourcePath);
}

/**
 * Persist a source record for a layout.
 *
 * @param {string} layoutId
 * @param {object} sourceRecord
 */
export function writeSourceRecord(layoutId, sourceRecord) {
  const { sourcePath } = getLayoutPaths(layoutId);
  writeJson(sourcePath, sourceRecord);
}

/**
 * Build postprocess options for deterministic candidate rendering.
 *
 * @param {object} paths
 * @param {boolean} withMontage
 * @returns {object}
 */
export function buildCandidatePostprocessOptions(paths, withMontage = false) {
  return {
    withPreview: true,
    withMontage,
    withVisualOverflow: true,
    previewWidth: DEFAULT_PREVIEW_WIDTH,
    previewHeight: DEFAULT_PREVIEW_HEIGHT,
    previewOutputDir: paths.candidatePreviewDir,
    montageOutputFile: paths.candidateMontagePath,
    montageCols: 1,
    montageLabelMode: 'none',
    visualOverflowPadPx: DEFAULT_VISUAL_OVERFLOW_PAD_PX,
  };
}

/**
 * Return blocking checks from a normalized QA report.
 *
 * @param {object} qa
 * @returns {object[]}
 */
export function getBlockingChecks(qa = {}) {
  return (qa?.checks || []).filter((check) => {
    const status = String(check?.status || '').trim();
    return Boolean(check?.blocking) && ['fail', 'error'].includes(status);
  });
}

/**
 * Render a candidate deck through the existing generator APIs plus a draft overlay.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function renderCandidate({
  layoutId,
  withMontage = false,
}) {
  const paths = ensureLayoutPaths(layoutId);
  const source = loadSourceRecord(layoutId);
  if (!source.family) {
    throw new Error('Draft layout has no base family. Set `family` in source.json before rendering.');
  }

  const templatePackage = loadTemplatePackage('kpmg-diligence');
  const candidateLayout = readJson(paths.candidateLayoutPath);
  const candidateDeckSpec = readJson(paths.candidateDeckSpecPath);
  const builder = await loadDraftBuilder(paths.candidateBuilderPath, layoutId);
  const draftTemplatePackage = buildDraftTemplatePackage({
    templatePackage,
    layoutId,
    candidateLayout,
  });
  const draftRegistryEntry = buildDraftRegistryEntry({
    family: source.family,
    layoutId,
    builder,
  });

  const result = await generateToFile(candidateDeckSpec, paths.candidateDeckPath, {
    templatePackage: draftTemplatePackage,
    slideRegistryOverrides: {
      [layoutId]: draftRegistryEntry,
    },
    qaPath: paths.candidateQaPath,
    runRoot: paths.candidateDir,
    allowSparse: Boolean(candidateDeckSpec?.metadata?.allowSparse),
    enforceOverlap: true,
    strict: true,
    postprocess: buildCandidatePostprocessOptions(paths, withMontage),
  });
  const qa = readJson(paths.candidateQaPath);
  const blockingChecks = getBlockingChecks(qa);
  writeSourceRecord(layoutId, {
    ...source,
    artifacts: {
      ...(source.artifacts || {}),
      candidateQaPath: path
        .relative(paths.outputRoot, paths.candidateQaPath)
        .split(path.sep)
        .join('/'),
    },
  });
  if (blockingChecks.length > 0) {
    throw new Error(
      `Candidate render has blocking checks: ${blockingChecks
        .map((check) => `${check.id}:${check.status}`)
        .join(', ')}`,
    );
  }

  return {
    ...result,
    qa,
    paths,
    source,
  };
}

/**
 * Run the compare helper script for reference vs candidate PNGs.
 *
 * @param {object} params
 * @returns {object}
 */
export function compareCandidateImages({
  referencePngPath,
  candidatePngPath,
  diffPngPath,
  diffJsonPath,
  scorecardPath,
}) {
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'onboarding', 'compare_images.py');
  const result = spawnSync(
    'python3',
    [
      scriptPath,
      '--reference',
      referencePngPath,
      '--candidate',
      candidatePngPath,
      '--diff-out',
      diffPngPath,
      '--diff-json-out',
      diffJsonPath,
      '--scorecard-out',
      scorecardPath,
      '--thresholds',
      DIFF_THRESHOLDS_PATH,
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: '1',
      },
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `Image compare failed.\n${result.stdout || ''}\n${result.stderr || ''}`.trim(),
    );
  }
  return {
    diff: readJson(diffJsonPath),
    scorecard: readJson(scorecardPath),
  };
}

/**
 * Rebuild the generated canonical onboarded registry module from an index file.
 *
 * @param {object[]} entries
 * @returns {string}
 */
export function buildOnboardedRegistryModule(entries = []) {
  if (entries.length === 0) {
    return 'export const ONBOARDED_REGISTRY_ENTRIES = Object.freeze({});\n';
  }

  const importLines = entries.map(
    (entry) =>
      `import ${entry.exportName} from '../builders/onboarded/${entry.builderFile}.js';`,
  );

  return `${importLines.join('\n')}\n\nexport const ONBOARDED_REGISTRY_ENTRIES = Object.freeze({\n${entries
    .map((entry) => {
      const entryLiteral = JSON.stringify(entry.registryEntry, null, 2)
        .replace(/"__BUILDER_REF__"/g, entry.exportName);
      return `  ${entry.type}: Object.freeze(${entryLiteral}),`;
    })
    .join('\n')}\n});\n`;
}

/**
 * Load the canonical onboarded registry index.
 *
 * @returns {object}
 */
export function loadOnboardedRegistryIndex() {
  return readJson(ONBOARDED_REGISTRY_INDEX_PATH);
}

/**
 * Persist the canonical onboarded registry index and generated module.
 *
 * @param {object[]} entries
 */
export function writeOnboardedRegistry(entries = []) {
  writeJson(ONBOARDED_REGISTRY_INDEX_PATH, {
    schemaVersion: 1,
    entries,
  });
  fs.writeFileSync(ONBOARDED_REGISTRY_MODULE_PATH, buildOnboardedRegistryModule(entries));
}
