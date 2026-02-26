/**
 * generator/helpers/bullets.js — Native PptxGenJS bullet API
 *
 * Returns TextProps[] for bullet lists with per-run styling.
 */

import { BULLETS, COLORS } from '../tokens.js';

const DASH_BULLET_DEPTH = 2;
const MAX_BULLET_DEPTH = 3;

function safeText(value) {
  return String(value ?? '');
}

function toInlineStyle(item = {}) {
  return {
    ...(item.bold !== undefined ? { bold: item.bold } : {}),
    ...(item.italic !== undefined ? { italic: item.italic } : {}),
    ...(item.color !== undefined ? { color: item.color } : {}),
  };
}

function parseBoldLabel(text) {
  const t = safeText(text).trim();
  const m = t.match(/^([^:]{1,60}):\s+(.+)$/);
  if (!m) return null;
  const label = m[1].trim();
  const rest = m[2].trim();
  if (!label || !rest) return null;
  // Keep this conservative so we do not bold long sentences.
  if (label.length > 40) return null;
  return { label, rest };
}

function isHeaderLine(text) {
  const t = safeText(text).trim();
  if (!t) return false;
  if (t.endsWith(':')) return true;
  const dashSplit = t.split(/[—–]/);
  if (dashSplit.length !== 2) return false;
  const left = dashSplit[0].trim();
  const right = dashSplit[1].trim();
  if (!left || !right) return false;
  if (t.length > 70) return false;
  if (/[.:;]/.test(t)) return false;
  return true;
}

function clampDepth(depth = 0) {
  const n = Number.isFinite(depth) ? depth : 0;
  return Math.max(0, Math.min(MAX_BULLET_DEPTH, Math.floor(n)));
}

function buildBulletOptions(depth) {
  const bullet = { indent: BULLETS.indentPt };
  if (depth === DASH_BULLET_DEPTH) {
    // Hyphen-minus for deeper nesting level to mirror KPMG reference styling.
    bullet.characterCode = '002D';
  }
  return bullet;
}

function bulletParaRuns(text, { depth = 0, baseStyle = {} } = {}) {
  const parsed = parseBoldLabel(text);
  const indentLevel = clampDepth(depth);
  const paraOpts = {
    bullet: buildBulletOptions(indentLevel),
    ...(indentLevel ? { indentLevel } : {}),
    paraSpaceBefore: BULLETS.paraSpaceBeforePt,
    paraSpaceAfter: BULLETS.paraSpaceAfterPt,
    lineSpacing: BULLETS.lineSpacingPt,
    ...baseStyle,
  };

  if (parsed) {
    return [
      { text: `${parsed.label}:`, options: { ...paraOpts, bold: true } },
      { text: ` ${parsed.rest}`, options: { ...baseStyle, breakLine: true } },
    ];
  }

  return [{ text: safeText(text), options: { ...paraOpts, breakLine: true } }];
}

function headerRuns(text, { gapBefore = false } = {}) {
  const clean = safeText(text).trim();
  if (!clean) return [];
  return [
    {
      text: clean,
      options: {
        bold: true,
        color: COLORS.kpmgBlue,
        ...(gapBefore ? { paraSpaceBefore: 14 } : { paraSpaceBefore: BULLETS.paraSpaceBeforePt }),
        paraSpaceAfter: BULLETS.paraSpaceAfterPt,
        breakLine: true,
      },
    },
  ];
}

function isTextObject(item) {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item) && item.text !== undefined);
}

export function toBulletRuns(lines) {
  if (!lines) return '';
  if (typeof lines === 'string') return lines;
  if (!Array.isArray(lines)) return String(lines ?? '');

  const runs = [];
  let prdHeaderCount = 0;

  function emit(item, { depth = 0, topLevel = false } = {}) {
    if (Array.isArray(item)) return;

    if (isTextObject(item)) {
      if (item.header || item.subheader) {
        runs.push(...headerRuns(item.text));
        return;
      }

      runs.push(...bulletParaRuns(item.text, { depth, baseStyle: toInlineStyle(item) }));
      if (Array.isArray(item.children)) {
        item.children.forEach((child) => emit(child, { depth: depth + 1, topLevel: false }));
      }
      return;
    }

    if (topLevel && isHeaderLine(item)) {
      const clean = safeText(item).trim();
      const isPrdHeader = ['Problem:', 'How we solve it:', 'Outcome / ROI:'].includes(clean);
      const gapBefore = isPrdHeader && prdHeaderCount > 0;
      if (isPrdHeader) prdHeaderCount += 1;
      runs.push(...headerRuns(clean, { gapBefore }));
      return;
    }

    runs.push(...bulletParaRuns(item, { depth }));
  }

  lines.forEach((item) => emit(item, { depth: 0, topLevel: true }));
  return runs;
}

export function toParagraphRuns(lines) {
  if (!lines) return '';
  if (typeof lines === 'string') return lines;
  if (!Array.isArray(lines)) return String(lines ?? '');

  const runs = [];
  const addParagraph = (text, style = {}) => {
    runs.push({
      text: safeText(text),
      options: {
        paraSpaceBefore: BULLETS.paraSpaceBeforePt,
        paraSpaceAfter: BULLETS.paraSpaceAfterPt,
        lineSpacing: BULLETS.lineSpacingPt,
        breakLine: true,
        ...style,
      },
    });
  };

  function emit(item) {
    if (Array.isArray(item)) return;

    if (isTextObject(item)) {
      const style = item.header || item.subheader ? { bold: true, color: COLORS.kpmgBlue } : toInlineStyle(item);
      addParagraph(item.text, style);
      if (Array.isArray(item.children) && !(item.header || item.subheader)) {
        item.children.forEach((child) => emit(child));
      }
      return;
    }

    addParagraph(item);
  }

  lines.forEach((item) => emit(item));
  return runs;
}

export function toBodyRuns(lines, bodyStyle = 'bullets') {
  return String(bodyStyle || '').toLowerCase() === 'paragraphs'
    ? toParagraphRuns(lines)
    : toBulletRuns(lines);
}
