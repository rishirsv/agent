// generator/runtime/paginate.js
//
// Pragmatic, stdlib-only pagination to prevent text overlap.
// We do not have font metrics in a typical headless environment, so we use
// conservative heuristics driven by template geometry.
//
// Goal: never overlap; prefer continuation slides vs. tiny fonts.

import { FOOTER_SAFE_TOP } from '../helpers/footer.js';
import { TYPE_SIZES } from '../tokens.js';
import { computeOneColumnLayoutGeometry } from '../helpers/one-column-layout.js';
import { computeTwoColumnLayoutGeometry } from '../helpers/two-column-layout.js';
import {
  computeAnalysisWideChart2ColsTextGeometry,
  computeAnalysisWideChartTableTextGeometry,
} from '../helpers/analysis-wide-layout.js';
const BODY_FONT_SIZE = 10;
const TABLE_ROW_HEIGHT_CAP = 0.9;
const TABLE_ROW_DENSITY_LINE_THRESHOLD = 7;
const TABLE_ROW_DENSITY_HEIGHT_THRESHOLD = 0.82;

function clone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

function isTextObject(value) {
  return Boolean(value && typeof value === 'object' && value.text !== undefined);
}

function safeStr(s) {
  if (isTextObject(s)) return String(s.text ?? '');
  return String(s ?? '');
}

function isLikelyHeading(s) {
  const t = safeStr(s).trim();
  if (!t) return false;
  // Short, no sentence punctuation is often a heading line in the migrated V1 content.
  if (t.length > 48) return false;
  if (/[.!?]$/.test(t)) return false;
  if (t.includes('—') || t.includes(':')) return false;
  // Avoid numeric-heavy strings being treated as headings.
  const digits = (t.match(/\d/g) || []).length;
  if (digits >= 4) return false;
  return true;
}

function normalizeBulletPairs(items) {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    if (isTextObject(current)) {
      out.push(current);
      continue;
    }
    const a = safeStr(current).trim();
    if (!a) continue;
    const next = items[i + 1];
    const b = !isTextObject(next) ? safeStr(next).trim() : '';
    if (b && isLikelyHeading(a) && b.length >= 60) {
      out.push(`${a}: ${b}`);
      i += 1;
      continue;
    }
    out.push(a);
  }
  return out;
}

function countWrappedLines(text, charsPerLine) {
  const s = safeStr(text).replace(/\r/g, '');
  const parts = s.split('\n');
  let lines = 0;
  for (const p of parts) {
    const n = Math.max(1, Math.ceil(p.length / Math.max(1, charsPerLine)));
    lines += n;
  }
  return lines;
}

function estimateCharsPerLine(boxWInches, fontSizePt) {
  // Roughly: at 12pt Arial, ~12 chars/inch is a safe-ish conservative value.
  // Scale inversely with font size, then pad down a bit to avoid underestimating wraps.
  const base = 12;
  const scaled = (boxWInches || 0) * base * (12 / Math.max(6, fontSizePt || 12));
  return Math.max(12, Math.floor(scaled * 0.9));
}

function estimateMaxLines(boxHInches, fontSizePt) {
  // Convert to points (72 pt/in). Use a slightly generous line-height to avoid overlap.
  const hPt = (boxHInches || 0) * 72;
  // Our decks use 10pt body with PowerPoint-like spacing.
  const lineHeight = Math.max(11, (fontSizePt || BODY_FONT_SIZE) + 3);
  // Keep a small top/bottom safety buffer.
  return Math.max(1, Math.floor(hPt / lineHeight) - 1);
}

function chunkBullets(lines, { maxLines, charsPerLine }) {
  const items = normalizeBulletPairs(Array.isArray(lines) ? lines : (lines ? [lines] : []));
  const chunks = [];
  let cur = [];
  let used = 0;

  for (const item of items) {
    const t = safeStr(item).trim();
    if (!t) continue;
    const isHeader = isTextObject(item) && item.header;
    const prefix = isHeader ? '' : '• ';
    const need = countWrappedLines(`${prefix}${t}`, charsPerLine);
    if (cur.length && used + need > maxLines) {
      chunks.push(cur);
      cur = [];
      used = 0;
    }
    // If a single bullet is too large, still include it on its own slide.
    cur.push(item);
    used += need;
  }
  if (cur.length) chunks.push(cur);
  return chunks.length ? chunks : [[]];
}

function contTitle(title, pageIdx, maxChars = null) {
  const t = safeStr(title).trim();
  if (!t) return t;
  if (pageIdx === 0) return t;
  const continued = `${t} (cont.)`;
  if (Number.isFinite(maxChars) && maxChars > 0 && continued.length > maxChars) {
    // Respect hard title limits; prefer keeping original title over forced wrap.
    return t;
  }
  return continued;
}

function applyFooterSafe(box, useFooter) {
  if (!useFooter || !box) return box;
  const y = typeof box.y === 'number' ? box.y : null;
  const h = typeof box.h === 'number' ? box.h : null;
  if (y === null || h === null) {
    return { ...box, h: Math.max(0.1, (h || 0) - 0.25) };
  }
  const safeH = Math.max(0.1, Math.min(h, FOOTER_SAFE_TOP - y));
  return { ...box, h: safeH };
}

function paginateTwoColumn(
  slideSpec,
  geometry,
  { footerSafe = false, fallbackLeft, fallbackRight, titleMaxChars = null, leftBox = null, rightBox = null } = {},
) {
  const g = geometry || {};
  const resolvedLeft = leftBox || g.left || g.leftBody || g.leftText || fallbackLeft || { w: 5.5, h: 5.0, y: 1.5 };
  const resolvedRight = rightBox || g.right || g.rightBody || g.rightText || fallbackRight || { w: 5.5, h: 5.0, y: 1.5 };
  const safeLeft = applyFooterSafe(resolvedLeft, footerSafe);
  const safeRight = applyFooterSafe(resolvedRight, footerSafe);

  const fontSize = BODY_FONT_SIZE;
  const leftChunks = chunkBullets(slideSpec.leftBody, {
    maxLines: estimateMaxLines(safeLeft.h, fontSize),
    charsPerLine: estimateCharsPerLine(safeLeft.w, fontSize),
  });
  const rightChunks = chunkBullets(slideSpec.rightBody, {
    maxLines: estimateMaxLines(safeRight.h, fontSize),
    charsPerLine: estimateCharsPerLine(safeRight.w, fontSize),
  });

  const pages = Math.max(leftChunks.length, rightChunks.length);
  const out = [];
  for (let p = 0; p < pages; p++) {
    const s = clone(slideSpec);
    s.title = contTitle(slideSpec.title, p, titleMaxChars);
    s.leftBody = leftChunks[p] ?? [];
    s.rightBody = rightChunks[p] ?? [];
    out.push(s);
  }
  return out;
}

function paginateOneColumnBullets(
  slideSpec,
  geometry,
  fieldName,
  { footerSafe = false, fallbackBox, titleMaxChars = null, bodyBox = null } = {},
) {
  const g = geometry || {};
  const box = bodyBox || g.body || g.topText || g.leftText || fallbackBox || { w: 11.0, h: 5.0, y: 1.6 };
  const safeBox = applyFooterSafe(box, footerSafe);
  const fontSize = BODY_FONT_SIZE;
  const chunks = chunkBullets(slideSpec[fieldName], {
    maxLines: estimateMaxLines(safeBox.h, fontSize),
    charsPerLine: estimateCharsPerLine(safeBox.w, fontSize),
  });

  const out = [];
  for (let p = 0; p < chunks.length; p++) {
    const s = clone(slideSpec);
    s.title = contTitle(slideSpec.title, p, titleMaxChars);
    s[fieldName] = chunks[p];
    out.push(s);
  }
  return out;
}

function paginateTableRows(
  slideSpec,
  geometry,
  { footerSafe = false, fallbackBox, titleMaxChars = null, emitWarning = null } = {},
) {
  const table = slideSpec.table;
  if (!table || !Array.isArray(table.rows) || table.rows.length <= 0) return [slideSpec];

  const g = geometry || {};
  const box = g.table || fallbackBox || { w: 11.0, h: 3.0, y: 1.9 };
  const safeBox = applyFooterSafe(box, footerSafe);

  const headers = Array.isArray(table.headers) ? table.headers : [];
  const cols = Math.max(1, headers.length || (Array.isArray(table.rows[0]) ? table.rows[0].length : 1));
  const totalW = Number(safeBox.w || 11.0);
  const headerH = 0.32;
  const showTitleBar =
    table.showTitleBar !== false &&
    slideSpec.type !== 'analysisWideChartTableText';
  const titleBarH = showTitleBar ? 0.26 : 0;
  const bodyBudget = Math.max(0.8, Number(safeBox.h || 4.5) - headerH - titleBarH);

  const colW = [];
  if (cols === 1) {
    colW.push(totalW);
  } else if (cols >= 4) {
    const first = Math.min(3.0, Math.max(2.2, totalW * 0.28));
    const rem = Math.max(0.5, totalW - first);
    colW.push(first, ...Array.from({ length: cols - 1 }, () => rem / (cols - 1)));
  } else {
    colW.push(...Array.from({ length: cols }, () => totalW / cols));
  }

  const estimateRowMetrics = (row) => {
    const cells = Array.isArray(row) ? row : [];
    let maxLines = 1;
    for (let idx = 0; idx < cols; idx += 1) {
      const text = String(cells[idx] ?? '').replace(/\r/g, '');
      const charsPerLine = Math.max(6, Math.floor(Math.max(0.4, colW[idx] || 1) * 7.5));
      const lines = text
        .split('\n')
        .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / Math.max(1, charsPerLine))), 0);
      if (lines > maxLines) maxLines = lines;
    }
    const unclampedHeight = maxLines * 0.14 + 0.04;
    return {
      maxLines,
      rowHeight: Math.max(0.22, Math.min(TABLE_ROW_HEIGHT_CAP, unclampedHeight)),
      clamped: unclampedHeight > TABLE_ROW_HEIGHT_CAP,
    };
  };

  const rowMetrics = table.rows.map((row, idx) => ({ index: idx, ...estimateRowMetrics(row) }));
  const rowHeights = rowMetrics.map((row) => row.rowHeight);
  const denseRows = rowMetrics.filter(
    (row) =>
      row.clamped ||
      row.maxLines >= TABLE_ROW_DENSITY_LINE_THRESHOLD ||
      row.rowHeight >= TABLE_ROW_DENSITY_HEIGHT_THRESHOLD,
  );
  if (denseRows.length > 0 && typeof emitWarning === 'function') {
    emitWarning({
      code: 'table_row_density_risk',
      severity: 'warning',
      message: 'Some table rows are dense and may appear cramped in export.',
      details: {
        denseRowCount: denseRows.length,
        maxEstimatedLines: Math.max(...denseRows.map((row) => row.maxLines)),
        sampleRows: denseRows.slice(0, 3).map((row) => row.index + 1),
      },
    });
  }
  const totalBodyH = rowHeights.reduce((sum, h) => sum + h, 0);
  if (totalBodyH <= bodyBudget) return [slideSpec];

  const chunks = [];
  let cursor = 0;
  while (cursor < table.rows.length) {
    let used = 0;
    let end = cursor;
    while (end < table.rows.length) {
      const nextH = rowHeights[end];
      if (end > cursor && used + nextH > bodyBudget) break;
      used += nextH;
      end += 1;
    }
    if (end === cursor) end += 1;
    chunks.push([cursor, end]);
    cursor = end;
  }
  const lastChunk = chunks[chunks.length - 1] || [0, 0];
  const lastChunkRows = Math.max(0, lastChunk[1] - lastChunk[0]);
  if (chunks.length > 1 && lastChunkRows === 1 && typeof emitWarning === 'function') {
    emitWarning({
      code: 'table_pagination_orphan',
      severity: 'warning',
      message: 'Auto-pagination left a single orphan row on the final continuation slide.',
      details: {
        splitInto: chunks.length,
        totalRows: table.rows.length,
        orphanRow: lastChunk[0] + 1,
      },
    });
  }

  const out = [];
  for (const [start, end] of chunks) {
    const s = clone(slideSpec);
    s.title = contTitle(slideSpec.title, out.length, titleMaxChars);
    s.table = {
      headers,
      rows: table.rows.slice(start, end),
    };
    // Keep notes only on the last page to reduce clutter.
    if (end < table.rows.length) delete s.notes;
    out.push(s);
  }
  return out;
}

export function paginateDeckSpec(deckSpec, layouts) {
  const spec = deckSpec && typeof deckSpec === 'object' ? deckSpec : { slides: [] };
  const slides = Array.isArray(spec.slides) ? spec.slides : [];
  const out = {
    ...spec,
    slides: [],
    paginationDecisions: [],
    overflowEvents: [],
    tableWarnings: [],
  };

  function recordSplit(slideIndex, type, mode, originalCount, pages, details = {}) {
    if (pages <= 1) return;
    out.paginationDecisions.push({
      slideIndex,
      slideType: type,
      mode,
      originalCount,
      splitInto: pages,
      ...details,
    });
    out.overflowEvents.push({
      slideIndex,
      slideType: type,
      event: 'auto_split',
      mode,
      originalCount,
      splitInto: pages,
    });
  }

  function recordTableWarning(slideIndex, slideType, warning) {
    if (!warning || typeof warning !== 'object') return;
    out.tableWarnings.push({
      slideIndex,
      slideType,
      code: warning.code || 'table_warning',
      severity: warning.severity || 'warning',
      message: warning.message || 'Table formatting warning.',
      details: warning.details || {},
    });
  }

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
    const slideSpec = slides[slideIndex];
    const type = slideSpec?.type;
    const layout = (layouts && type && layouts[type]) || null;
    const geom = layout?.geometry || null;
    const titleMaxChars = Number(layout?.slots?.title?.maxChars || 0) || null;

    if (!type || !layout) {
      out.slides.push(slideSpec);
      continue;
    }

    if (type === 'twoColumnText') {
      const masterName = slideSpec?.masterName || layout?.masterName || 'KPMG_WHITE';
      const twoColLayout = computeTwoColumnLayoutGeometry({
        geometry: geom,
        masterName,
        strapline: slideSpec?.strapline,
        straplineFontSize: TYPE_SIZES.strapline,
      });
      const paged = paginateTwoColumn(slideSpec, geom, {
        footerSafe: false,
        fallbackLeft: { w: 5.7, h: 5.7, y: 1.5 },
        fallbackRight: { w: 5.2, h: 5.7, y: 1.5 },
        titleMaxChars,
        leftBox: twoColLayout?.safeLeftGeo || null,
        rightBox: twoColLayout?.safeRightGeo || null,
      });
      const originalCount =
        (Array.isArray(slideSpec.leftBody) ? slideSpec.leftBody.length : 0) +
        (Array.isArray(slideSpec.rightBody) ? slideSpec.rightBody.length : 0);
      recordSplit(slideIndex, type, 'two-column-bullets', originalCount, paged.length);
      out.slides.push(...paged);
      continue;
    }

    if (type === 'oneColumnText') {
      const masterName = slideSpec?.masterName || layout?.masterName || 'KPMG_WHITE';
      const oneColLayout = computeOneColumnLayoutGeometry({
        geometry: geom,
        masterName,
        strapline: slideSpec?.strapline,
        source: slideSpec?.source,
        straplineFontSize: TYPE_SIZES.strapline,
        sourceFontSize: TYPE_SIZES.source,
      });
      const paged = paginateOneColumnBullets(slideSpec, geom, 'body', {
        footerSafe: false,
        fallbackBox: { w: 11.1596, h: 5.6, y: 1.6 },
        titleMaxChars,
        bodyBox: oneColLayout?.safeBodyGeo || null,
      });
      const originalCount = Array.isArray(slideSpec.body) ? slideSpec.body.length : 0;
      recordSplit(slideIndex, type, 'one-column-bullets', originalCount, paged.length);
      out.slides.push(...paged);
      continue;
    }

    if (type === 'analysisWideChart2ColsText' || type === 'analysisWideChartTableText') {
      const masterName = slideSpec?.masterName || layout?.masterName || 'KPMG_WHITE';
      const wideLayout =
        type === 'analysisWideChartTableText'
          ? computeAnalysisWideChartTableTextGeometry({
              geometry: geom,
              masterName,
              strapline: slideSpec?.strapline,
              chart: slideSpec?.chart,
              table: slideSpec?.table,
              noteSource: slideSpec?.noteSource,
              showSummaryChart: slideSpec?.showSummaryChart,
            })
          : computeAnalysisWideChart2ColsTextGeometry({
              geometry: geom,
              masterName,
              strapline: slideSpec?.strapline,
              chart: slideSpec?.chart,
            });
      const paged = paginateOneColumnBullets(slideSpec, geom, 'body', {
        footerSafe: false,
        fallbackBox:
          type === 'analysisWideChartTableText'
            ? { w: 11.1596, h: 2.2, y: 1.6 }
            : { w: 5.6, h: 5.4, y: 1.6 },
        titleMaxChars,
        bodyBox: wideLayout?.safeTextBox || null,
      });
      const originalCount = Array.isArray(slideSpec.body) ? slideSpec.body.length : 0;
      recordSplit(slideIndex, type, 'text-with-chart', originalCount, paged.length);
      out.slides.push(...paged);
      continue;
    }

    if (type === 'analysisNarrowTable') {
      const paged = paginateTableRows(slideSpec, geom, {
        footerSafe: true,
        fallbackBox: { w: 11.1596, h: 4.5, y: 1.9 },
        titleMaxChars,
        emitWarning: (warning) => recordTableWarning(slideIndex, type, warning),
      });
      const originalCount = Array.isArray(slideSpec?.table?.rows) ? slideSpec.table.rows.length : 0;
      recordSplit(slideIndex, type, 'table-rows', originalCount, paged.length);
      out.slides.push(...paged);
      continue;
    }

    out.slides.push(slideSpec);
  }

  return out;
}
