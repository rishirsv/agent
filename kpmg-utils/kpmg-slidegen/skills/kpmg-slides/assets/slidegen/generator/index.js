import fs from 'node:fs';
import path from 'node:path';

import { parseCliOptions } from './app/cli.js';
import {
  buildPostprocessOptions,
  runPostprocessPipelines,
} from './app/postprocess.js';
import { buildQaReport } from './app/qa-report.js';
import { resolveStrictOverflowStatus } from './app/strict-overflow.js';
import { createSlidesAdapter } from './postprocess/slides-adapter.js';
import { checkDeckOverlaps } from './strict/overlap.js';
import { validateDeckSpecWithTemplate, renderDeck } from './runtime/render-deck.js';
import { loadTemplatePackage } from './runtime/template-package.js';
import {
  recordMissingSlot,
  recordOverlapSummary,
  recordWarning,
  startDiagnostics,
  stopDiagnostics,
} from './runtime/diagnostics.js';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getQaPath(outPath, overridePath) {
  if (overridePath) return overridePath;
  return path.join(path.dirname(outPath), 'qa.json');
}

function writeQaReport(qaPath, qaReport) {
  fs.mkdirSync(path.dirname(qaPath), { recursive: true });
  fs.writeFileSync(qaPath, JSON.stringify(qaReport, null, 2));
}

function didStrictChecksFail(qaReport = {}) {
  return (qaReport?.checks || []).some(
    (check) =>
      check?.blocking &&
      ['overlap', 'visual_overflow'].includes(check?.id) &&
      ['fail', 'error'].includes(String(check?.status || '')),
  );
}

export async function generateToFile(deckSpec, outPath, options = {}) {
  const templatePackage =
    options.templatePackage || loadTemplatePackage(options.template || 'kpmg-diligence');
  const qaPath = getQaPath(outPath, options.qaPath);
  startDiagnostics();

  const validation = validateDeckSpecWithTemplate(deckSpec, templatePackage, {
    allowSparse: options.allowSparse,
  });

  if (validation.warnings?.length) {
    for (const warning of validation.warnings) {
      console.warn(warning);
      recordWarning(warning);
    }
  }
  for (const missing of validation?.qa?.missingSlots || []) {
    recordMissingSlot(missing.slideIndex, missing.slideType, missing.slot);
  }

  if (!validation.valid) {
    const diag = stopDiagnostics() || {};
    const qaReport = buildQaReport({
      deckSpec,
      templatePackage,
      outPath,
      qaPath,
      runRoot: options.runRoot || path.dirname(outPath),
      validation,
      renderQa: null,
      overlapReport: null,
      postprocess: null,
      strictRequested: Boolean(options.strict),
      diagnostics: diag,
    });
    writeQaReport(qaPath, qaReport);
    throw new Error(validation.errors.join('\n'));
  }

  const { pptx, qa: renderQa } = renderDeck(deckSpec, templatePackage, {
    allowSparse: options.allowSparse,
    strict: options.strict,
    validationResult: validation,
  });

  let overlapReport = null;
  if (options.enforceOverlap !== false) {
    overlapReport = checkDeckOverlaps(pptx);
    recordOverlapSummary(overlapReport.summary);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await pptx.writeFile({ fileName: outPath, compression: true });

  const postprocessOptions = buildPostprocessOptions(options, outPath, { pathModule: path });
  const adapter = options.postprocessAdapter || createSlidesAdapter();
  const postprocessRequested =
    Boolean(options.strict) ||
    postprocessOptions.withPreview ||
    postprocessOptions.withMontage ||
    postprocessOptions.withVisualOverflow;

  let postprocess = null;
  if (postprocessRequested) {
    const pipeline = runPostprocessPipelines({
      adapter,
      outPath,
      options: postprocessOptions,
      onWarning: (message) => {
        console.warn(message);
        recordWarning(message);
      },
    });
    postprocess = pipeline.postprocess;
    if (pipeline.strictVisualOverflow) {
      postprocess.overflowVisual = pipeline.strictVisualOverflow;
    }
  }

  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: Boolean(options.strict),
    adapter,
    outPath,
    postprocess,
    postprocessOptions,
  });

  const report = stopDiagnostics() || {};
  const qaReport = buildQaReport({
    deckSpec,
    templatePackage,
    outPath,
    qaPath,
    runRoot: options.runRoot || path.dirname(outPath),
    validation: {
      ...validation,
      warnings: [...(validation.warnings || []), ...(renderQa?.warnings || []), ...(report?.warnings || [])],
    },
    renderQa,
    overlapReport,
    postprocess,
    strictRequested: Boolean(options.strict),
    diagnostics: report,
  });

  writeQaReport(qaPath, qaReport);

  return {
    strictFailed: Boolean(options.strict) && didStrictChecksFail(qaReport),
    strictSummary: qaReport,
    qaPath,
  };
}

export async function main(argv = process.argv.slice(2)) {
  let cli;
  try {
    cli = parseCliOptions(argv);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const deckSpec = readJson(cli.inPath);
  const templatePackage = loadTemplatePackage(cli.templateName);

  const result = await generateToFile(deckSpec, cli.outPath, {
    strict: cli.strict,
    enforceOverlap: !cli.skipOverlap,
    template: cli.templateName,
    templatePackage,
    qaPath: cli.qaOutPath,
    runRoot: cli.outDir,
    allowSparse: cli.allowSparse,
    postprocess: cli.postprocess,
  });

  if (cli.strict && result.strictFailed) {
    process.exit(1);
  }

  console.log(`Generated: ${cli.outPath}`);
  console.log(`QA report: ${result.qaPath}`);

  const artifacts = result?.strictSummary?.artifacts || {};
  if (artifacts?.preview?.status === 'pass') {
    console.log(`Preview images: ${artifacts.preview.outputDir}`);
  }
  if (artifacts?.montage?.status === 'pass') {
    console.log(`Montage: ${artifacts.montage.path}`);
  }
  if (artifacts?.overflowVisual?.status) {
    console.log(`Visual overflow: ${artifacts.overflowVisual.status}`);
  }
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main();
}
