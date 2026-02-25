import path from 'node:path';

import { parsePositiveInt } from './postprocess.js';

/**
 * Parse CLI argv into a key/value argument map.
 * @param {string[]} argv
 * @returns {Map<string, string|boolean>}
 */
function parseArgMap(argv = []) {
  const args = new Map();
  for (let i = 0; i < argv.length; i++) {
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
 * Parse and validate generation CLI args.
 * @param {string[]} argv
 * @returns {object}
 */
export function parseCliOptions(argv = []) {
  const args = parseArgMap(argv);
  const inPath = args.get('in');
  const outPath = args.get('out');

  if (!inPath || !outPath) {
    throw new Error(
      'Usage: node generator/index.js --in <deck.json> --out <out.pptx> [--qa-out <out.qa.json>] [--allow-sparse] [--strict] [--skip-overlap] [--template <name>] [--with-preview] [--with-montage] [--with-visual-overflow] [--preview-width <px>] [--preview-height <px>] [--montage-cols <n>] [--montage-label-mode <number|filename|none>] [--visual-overflow-pad-px <px>]',
    );
  }

  const montageLabelMode = String(args.get('montage-label-mode') || 'number');
  if (!['number', 'filename', 'none'].includes(montageLabelMode)) {
    throw new Error('Invalid --montage-label-mode. Expected one of: number, filename, none');
  }

  const strict = Boolean(args.get('strict'));

  return {
    inPath,
    outPath,
    qaOutPath: args.get('qa-out'),
    templateName: args.get('template') || 'kpmg-diligence',
    allowSparse: Boolean(args.get('allow-sparse')),
    strict,
    skipOverlap: Boolean(args.get('skip-overlap')),
    postprocess: {
      withPreview: Boolean(args.get('with-preview')),
      withMontage: Boolean(args.get('with-montage')),
      withVisualOverflow: Boolean(args.get('with-visual-overflow')),
      previewWidth: parsePositiveInt(args.get('preview-width'), 1600),
      previewHeight: parsePositiveInt(args.get('preview-height'), 900),
      previewOutputDir: args.get('preview-dir') || path.join(path.dirname(outPath), 'preview'),
      montageOutputFile: args.get('montage-out') || path.join(path.dirname(outPath), 'montage.png'),
      montageCols: parsePositiveInt(args.get('montage-cols'), 5),
      montageLabelMode,
      visualOverflowPadPx: parsePositiveInt(args.get('visual-overflow-pad-px'), 100),
    },
  };
}
