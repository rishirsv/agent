/**
 * generator/helpers/bullets.js — Native PptxGenJS bullet API
 *
 * Returns TextProps[] for bullet lists with per-run styling.
 *
 * Notes:
 * - PptxGenJS allows rich text arrays: [{ text, options }, ...]
 * - We use `breakLine: true` to end each bullet paragraph.
 * - We only apply `bullet` on the first run of each paragraph so we can bold
 *   leading labels like "Mobile payments:" without bolding the whole bullet.
 */

import { BULLETS, COLORS } from '../tokens.js';

export function toBulletRuns(lines) {
  if (!lines) return '';
  if (typeof lines === 'string') return lines;
  if (!Array.isArray(lines)) return String(lines ?? '');

  function safeText(t) {
    return String(t ?? '');
  }

  function parseBoldLabel(text) {
    const t = safeText(text).trim();
    const m = t.match(/^([^:]{1,60}):\s+(.+)$/);
    if (!m) return null;
    const label = m[1].trim();
    const rest = m[2].trim();
    if (!label || !rest) return null;
    // Keep this conservative so we don't bold long sentences.
    if (label.length > 40) return null;
    return { label, rest };
  }

  function isHeaderLine(text) {
    const t = safeText(text).trim();
    if (!t) return false;
    if (t.endsWith(':')) return true;
    const dashSplit = t.split(/[—–]/);
    if (dashSplit.length === 2) {
      const left = dashSplit[0].trim();
      const right = dashSplit[1].trim();
      if (!left || !right) return false;
      if (t.length > 70) return false;
      if (/[.:;]/.test(t)) return false;
      return true;
    }
    return false;
  }

  function bulletParaRuns(text, { indentLevel = 0, baseStyle = {} } = {}) {
    const parsed = parseBoldLabel(text);

    const paraOpts = {
      bullet: { indent: BULLETS.indentPt },
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
          ...(gapBefore ? { paraSpaceBefore: 14 } : {}),
          ...(!gapBefore ? { paraSpaceBefore: BULLETS.paraSpaceBeforePt } : {}),
          paraSpaceAfter: BULLETS.paraSpaceAfterPt,
          breakLine: true,
        },
      },
    ];
  }

  const runs = [];
  let prdHeaderCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const item = lines[i];
    if (Array.isArray(item)) {
      // Nested bullets (level 1)
      for (const sub of item) {
        const isRich = typeof sub === 'object' && sub !== null && sub.text !== undefined;
        const baseStyle = isRich
          ? {
              ...(sub.bold !== undefined ? { bold: sub.bold } : {}),
              ...(sub.italic !== undefined ? { italic: sub.italic } : {}),
              ...(sub.color !== undefined ? { color: sub.color } : {}),
            }
          : {};
        runs.push(...bulletParaRuns(isRich ? sub.text : safeText(sub), { indentLevel: 1, baseStyle }));
      }
      continue;
    }

    if (typeof item === 'object' && item !== null && item.text !== undefined) {
      if (item.header || item.subheader) {
        runs.push(...headerRuns(item.text));
        continue;
      }
      const baseStyle = {
        ...(item.bold !== undefined ? { bold: item.bold } : {}),
        ...(item.italic !== undefined ? { italic: item.italic } : {}),
        ...(item.color !== undefined ? { color: item.color } : {}),
      };
      runs.push(...bulletParaRuns(item.text, { indentLevel: 0, baseStyle }));
      continue;
    }

    if (isHeaderLine(item)) {
      const clean = safeText(item).trim();
      const isPrdHeader = ['Problem:', 'How we solve it:', 'Outcome / ROI:'].includes(clean);
      const gapBefore = isPrdHeader && prdHeaderCount > 0;
      if (isPrdHeader) prdHeaderCount += 1;
      runs.push(...headerRuns(item, { gapBefore }));
      continue;
    }

    runs.push(...bulletParaRuns(item, { indentLevel: 0 }));
  }

  return runs;
}

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

  for (const item of lines) {
    if (Array.isArray(item)) {
      for (const sub of item) {
        if (sub && typeof sub === 'object' && sub.text !== undefined) {
          addParagraph(sub.text, toInlineStyle(sub));
        } else {
          addParagraph(sub);
        }
      }
      continue;
    }
    if (item && typeof item === 'object' && item.text !== undefined) {
      const style = item.header || item.subheader ? { bold: true, color: COLORS.kpmgBlue } : toInlineStyle(item);
      addParagraph(item.text, style);
      continue;
    }
    addParagraph(item);
  }

  return runs;
}

export function toBodyRuns(lines, bodyStyle = 'bullets') {
  return String(bodyStyle || '').toLowerCase() === 'paragraphs'
    ? toParagraphRuns(lines)
    : toBulletRuns(lines);
}
