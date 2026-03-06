// generator/runtime/paginate.js
//
// Pragmatic, stdlib-only pagination to prevent text overlap.
// We do not have font metrics in a typical headless environment, so we use
// conservative heuristics driven by template geometry.
//
// Goal: never overlap; prefer continuation slides vs. tiny fonts.

import { BRIDGE_DEFAULT_ANALYSIS_BOXES, clampBridgePhaseCount, resolveBridgeAnalysisBoxes } from '../helpers/bridge-layout.js';
import { computeOneColumnLayoutGeometry } from '../helpers/one-column-layout.js';
import { computeTwoColumnLayoutGeometry } from '../helpers/two-column-layout.js';
import { isHeaderLine } from '../helpers/bullets.js';
import {
  CONTENTS_SECTIONS_PER_SLIDE,
  RECOMPUTE_FIELD_CONTENTS_PAGE_RANGES,
} from '../helpers/pagination-constants.js';
import { resolveSlideGeometry } from './template-contracts.js';
import { resolveTheme } from '../helpers/theme.js';
import {
  computeAnalysisWideChart2ColsTextGeometry,
  computeAnalysisWideChartTableTextGeometry,
} from '../helpers/analysis-wide-layout.js';
import { isExcludedFromLogicalPaging, resolveRegistryTypeForSlide } from './slide-registry.js';
import { requireGeometryBox } from './geometry-contract.js';

const TABLE_ROW_DENSITY_LINE_THRESHOLD = 7;
const TABLE_ROW_DENSITY_HEIGHT_THRESHOLD = 0.82;
const includeFooterByMasterCache = new WeakMap();
const validatedPolicyDispatchCache = new WeakSet();

function requireFiniteMetric(name, value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  throw new Error(`Missing required pagination metric "${name}"`);
}

function resolvePaginationMetrics(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  const bodyFontSize = requireFiniteMetric('typeSizes.body', resolvedTheme?.typeSizes?.body);
  return {
    bodyFontSize,
    straplineFontSize: requireFiniteMetric('typeSizes.strapline', resolvedTheme?.typeSizes?.strapline),
    sourceFontSize: requireFiniteMetric('typeSizes.source', resolvedTheme?.typeSizes?.source),
    tableRowHeightCap: requireFiniteMetric('table.rowHeightCap', resolvedTheme?.table?.rowHeightCap),
    bridgeAnalysisBodyFontSize: Math.max(8, bodyFontSize - 1),
  };
}

function clone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

function isTextObject(value) {
  return Boolean(value && typeof value === 'object' && value.text !== undefined);
}

function isBulletObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && value.text !== undefined);
}

function safeStr(s) {
  if (isTextObject(s)) return String(s.text ?? '');
  return String(s ?? '');
}

function isLikelyHeading(s) {
  const t = safeStr(s).trim();
  if (!t) return false;
  if (isHeaderLine(t)) return true;
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

function bulletPrefixForDepth(depth) {
  // Match rendering behavior: deeper level swaps to dash.
  return depth === 2 ? '- ' : '• ';
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
  const lineHeight = Math.max(11, (fontSizePt || 10) + 3);
  // Keep a small top/bottom safety buffer.
  return Math.max(1, Math.floor(hPt / lineHeight) - 1);
}

function chunkBullets(lines, { maxLines, charsPerLine, alreadyNormalized = false }) {
  const sourceItems = Array.isArray(lines) ? lines : (lines ? [lines] : []);
  const items = alreadyNormalized ? sourceItems : normalizeBulletPairs(sourceItems);
  const chunks = [];
  let cur = [];
  let used = 0;

  for (const item of items) {
    const need = estimateBulletNodeLines(item, charsPerLine, 0);
    if (need <= 0) continue;
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

function estimateBulletNodeLines(node, charsPerLine, depth = 0) {
  if (Array.isArray(node)) return 0;

  if (isBulletObject(node)) {
    const text = safeStr(node).trim();
    const isHeader = Boolean(node.header || node.subheader);
    const prefix = isHeader ? '' : bulletPrefixForDepth(depth);
    let linesNeeded = text ? countWrappedLines(`${prefix}${text}`, charsPerLine) : 0;
    if (!isHeader && Array.isArray(node.children)) {
      for (const child of node.children) {
        linesNeeded += estimateBulletNodeLines(child, charsPerLine, depth + 1);
      }
    }
    return linesNeeded;
  }

  const text = safeStr(node).trim();
  if (!text) return 0;
  const prefix = depth > 0 ? bulletPrefixForDepth(depth) : (isLikelyHeading(text) ? '' : bulletPrefixForDepth(0));
  return countWrappedLines(`${prefix}${text}`, charsPerLine);
}

function chunkBulletsByPageBudget(
  lines,
  {
    firstMaxLines,
    continuationMaxLines,
    firstCharsPerLine,
    continuationCharsPerLine,
    alreadyNormalized = false,
  },
) {
  const sourceItems = Array.isArray(lines) ? lines : (lines ? [lines] : []);
  const items = alreadyNormalized ? sourceItems : normalizeBulletPairs(sourceItems);
  const chunks = [];
  let cursor = 0;
  let page = 0;

  while (cursor < items.length) {
    const maxLines = page === 0 ? firstMaxLines : continuationMaxLines;
    const charsPerLine = page === 0 ? firstCharsPerLine : continuationCharsPerLine;
    const chunk = [];
    let used = 0;

    while (cursor < items.length) {
      const need = estimateBulletNodeLines(items[cursor], charsPerLine, 0);
      if (need <= 0) {
        cursor += 1;
        continue;
      }
      if (chunk.length && used + need > maxLines) break;
      // If a single bullet is too large, still include it on its own slide.
      chunk.push(items[cursor]);
      used += need;
      cursor += 1;
    }

    if (chunk.length > 0) {
      chunks.push(chunk);
      page += 1;
      continue;
    }

    // If all remaining entries were non-renderable we are done.
    if (cursor >= items.length) break;

    // Safety valve: consume one item to avoid stalling on malformed input.
    chunks.push([items[cursor]]);
    cursor += 1;
    page += 1;
  }

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

function applyFooterSafe(box, useFooter, footerSafeTop = null) {
  if (!useFooter || !box) return box;
  if (!Number.isFinite(footerSafeTop)) {
    throw new Error('Missing required footer safe-top for pagination');
  }
  const y = typeof box.y === 'number' ? box.y : null;
  const h = typeof box.h === 'number' ? box.h : null;
  if (y === null || h === null) {
    return { ...box, h: Math.max(0.1, (h || 0) - 0.25) };
  }
  const safeH = Math.max(0.1, Math.min(h, footerSafeTop - y));
  return { ...box, h: safeH };
}

function paginateTwoColumn(
  slideSpec,
  geometry,
  {
    bodyFontSize,
    footerSafe = false,
    footerSafeTop = null,
    titleMaxChars = null,
    leftBox = null,
    rightBox = null,
  } = {},
) {
  const g = geometry || {};
  const resolvedLeft = requireGeometryBox(leftBox || g.leftBox, { slideType: 'twoColumnText', key: 'leftBox' });
  const resolvedRight = requireGeometryBox(rightBox || g.rightBox, { slideType: 'twoColumnText', key: 'rightBox' });
  const safeLeft = applyFooterSafe(resolvedLeft, footerSafe, footerSafeTop);
  const safeRight = applyFooterSafe(resolvedRight, footerSafe, footerSafeTop);

  const fontSize = requireFiniteMetric('typeSizes.body', bodyFontSize);
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
  {
    bodyFontSize,
    footerSafe = false,
    footerSafeTop = null,
    titleMaxChars = null,
    bodyBox = null,
    continuationBodyBox = null,
  } = {},
) {
  const g = geometry || {};
  const slideType = String(slideSpec?.type || 'unknown');
  const firstBox = requireGeometryBox(bodyBox || g.bodyBox, { slideType, key: 'bodyBox' });
  const nextBox = continuationBodyBox
    ? requireGeometryBox(continuationBodyBox, { slideType, key: 'bodyBox' })
    : firstBox;
  const safeFirstBox = applyFooterSafe(firstBox, footerSafe, footerSafeTop);
  const safeContinuationBox = applyFooterSafe(nextBox, footerSafe, footerSafeTop);
  const fontSize = requireFiniteMetric('typeSizes.body', bodyFontSize);
  const sourceItems = Array.isArray(slideSpec[fieldName]) ? slideSpec[fieldName] : (slideSpec[fieldName] ? [slideSpec[fieldName]] : []);
  const normalizedItems = normalizeBulletPairs(sourceItems);
  const charsPerLine = estimateCharsPerLine(safeFirstBox.w, fontSize);
  const continuationCharsPerLine = estimateCharsPerLine(safeContinuationBox.w, fontSize);
  const chunks = chunkBulletsByPageBudget(normalizedItems, {
    firstMaxLines: estimateMaxLines(safeFirstBox.h, fontSize),
    continuationMaxLines: estimateMaxLines(safeContinuationBox.h, fontSize),
    firstCharsPerLine: charsPerLine,
    continuationCharsPerLine,
    alreadyNormalized: true,
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

function normalizeColumnBody(body) {
  if (Array.isArray(body)) return body;
  const text = String(body ?? '').trim();
  return text ? [text] : [];
}

function paginateBusinessOverview(slideSpec, geometry, { bodyFontSize, titleMaxChars = null } = {}) {
  const g = geometry || {};
  const bodyBox = requireGeometryBox(g.bodyBox, { slideType: 'businessOverview', key: 'bodyBox' });
  const chartBox = requireGeometryBox(g.chartBox, { slideType: 'businessOverview', key: 'chartBox' });
  const hasChart = Boolean(slideSpec?.chart && Array.isArray(slideSpec?.chart?.data) && slideSpec.chart.data.length > 0);
  const firstPageBodyH = hasChart
    ? Math.max(0.6, Math.min(Number(bodyBox.h), Number(chartBox.y) - Number(bodyBox.y) - 0.08))
    : Number(bodyBox.h);
  const bodyFont = requireFiniteMetric('typeSizes.body', bodyFontSize);

  const chunks = chunkBullets(normalizeColumnBody(slideSpec.overviewBody), {
    maxLines: estimateMaxLines(firstPageBodyH, bodyFont),
    charsPerLine: estimateCharsPerLine(Math.max(0.8, Number(bodyBox.w) - 0.1), bodyFont),
  });

  const pages = Math.max(1, chunks.length);
  const out = [];
  for (let page = 0; page < pages; page += 1) {
    const s = clone(slideSpec);
    s.title = contTitle(slideSpec.title, page, titleMaxChars);
    s.overviewBody = chunks[page] ?? [];
    out.push(s);
  }
  return out;
}

function paginateBridgeAnalysisColumns(slideSpec, geometry, { bodyFontSize, titleMaxChars = null } = {}) {
  const g = geometry || {};
  const columns = Array.isArray(slideSpec.analysisColumns) ? slideSpec.analysisColumns : [];
  const phaseCount = clampBridgePhaseCount(columns.length || g?.analysisBoxes?.length || BRIDGE_DEFAULT_ANALYSIS_BOXES.length);
  const analysisBoxes = resolveBridgeAnalysisBoxes(g.analysisBoxes, phaseCount);
  const effectiveColumns = analysisBoxes.map((_, idx) => columns[idx] || { heading: `Phase ${idx + 1}`, body: [] });
  const resolvedBodyFont = requireFiniteMetric('typeSizes.body', bodyFontSize);
  const analysisBodyFont = Math.max(
    6,
    Number(g?.typography?.analysisBody || Math.max(8, resolvedBodyFont - 1)),
  );
  const headingReserve = Math.max(0.24, (Number(g?.typography?.analysisHeading || resolvedBodyFont) * 1.6) / 72 + 0.1);

  const chunksPerColumn = effectiveColumns.map((column, idx) =>
    chunkBullets(normalizeColumnBody(column.body), {
      maxLines: estimateMaxLines(Math.max(0.4, Number(analysisBoxes[idx]?.h || 1.5) - headingReserve), analysisBodyFont),
      charsPerLine: estimateCharsPerLine(Math.max(0.6, Number(analysisBoxes[idx]?.w || 3.4) - 0.16), analysisBodyFont),
    }),
  );

  const pages = Math.max(1, ...chunksPerColumn.map((chunks) => chunks.length));
  const out = [];
  for (let page = 0; page < pages; page += 1) {
    const s = clone(slideSpec);
    s.title = contTitle(slideSpec.title, page, titleMaxChars);
    s.analysisColumns = effectiveColumns.map((column, idx) => ({
      ...column,
      body: chunksPerColumn[idx][page] ?? [],
    }));
    out.push(s);
  }
  return out;
}

function paginateContentsSections(slideSpec, { titleMaxChars = null } = {}) {
  const sections = Array.isArray(slideSpec?.sections) ? slideSpec.sections : [];
  if (sections.length <= CONTENTS_SECTIONS_PER_SLIDE) return [slideSpec];

  const out = [];
  for (let start = 0; start < sections.length; start += CONTENTS_SECTIONS_PER_SLIDE) {
    const s = clone(slideSpec);
    s.title = contTitle(slideSpec.title, out.length, titleMaxChars);
    s.sections = sections.slice(start, start + CONTENTS_SECTIONS_PER_SLIDE);
    out.push(s);
  }
  return out;
}

function paginateTableRows(
  slideSpec,
  geometry,
  {
    tableRowHeightCap,
    footerSafe = false,
    footerSafeTop = null,
    titleMaxChars = null,
    emitWarning = null,
  } = {},
) {
  const table = slideSpec.table;
  if (!table || !Array.isArray(table.rows) || table.rows.length <= 0) return [slideSpec];

  const g = geometry || {};
  const box = requireGeometryBox(g.tableBox, { slideType: String(slideSpec?.type || 'unknown'), key: 'tableBox' });
  const safeBox = applyFooterSafe(box, footerSafe, footerSafeTop);
  const rowHeightCap = requireFiniteMetric('table.rowHeightCap', tableRowHeightCap);

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
      rowHeight: Math.max(0.22, Math.min(rowHeightCap, unclampedHeight)),
      clamped: unclampedHeight > rowHeightCap,
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
    s.table.headers = headers;
    s.table.rows = table.rows.slice(start, end);
    out.push(s);
  }
  return out;
}

function normalizeSectionKey(value) {
  return String(value || '').trim().toLowerCase();
}

function setRange(map, key, page) {
  if (!key || !Number.isFinite(page) || page <= 0) return;
  const prev = map.get(key);
  if (!prev) {
    map.set(key, { start: page, end: page });
    return;
  }
  map.set(key, { start: Math.min(prev.start, page), end: Math.max(prev.end, page) });
}

function formatPageRange(start, end) {
  if (!Number.isFinite(start) || start <= 0) return '';
  if (!Number.isFinite(end) || end <= 0 || end === start) return `(p. ${start})`;
  return `(p. ${start}-${end})`;
}

function getIncludeFooterByMaster(templatePackage = {}) {
  if (includeFooterByMasterCache.has(templatePackage)) {
    return includeFooterByMasterCache.get(templatePackage);
  }
  const map = new Map();
  const variants = templatePackage?.layouts?.masters?.variants || {};
  for (const variant of Object.values(variants)) {
    if (!variant?.masterName) continue;
    map.set(variant.masterName, Boolean(variant.includeFooter));
  }
  includeFooterByMasterCache.set(templatePackage, map);
  return map;
}

function isDividerSlide(slideSpec = {}, runtimeContext = {}) {
  const type = resolveRegistryTypeForSlide(slideSpec);
  if (!type) return false;
  const entry = runtimeContext?.slideRegistry?.get?.(type);
  return entry?.builderId === 'divider';
}

export function resolveMasterNameForSlide(slideSpec = {}, runtimeContext = {}) {
  const type = resolveRegistryTypeForSlide(slideSpec);
  if (!type) {
    throw new Error('Unable to resolve slide type for master resolution');
  }
  const templateContracts = runtimeContext?.templateContracts;
  if (!templateContracts?.get) {
    throw new Error('Missing required template contracts for master resolution');
  }
  const resolved = templateContracts.resolveForSlide(slideSpec, type);
  if (!resolved?.masterName) throw new Error(`Missing template contract masterName for slide type "${type}"`);
  return resolved.masterName;
}

export function shouldRenderLogicalPageNumber(slideSpec = {}, runtimeContext = {}, resolvedMasterName = null) {
  const type = resolveRegistryTypeForSlide(slideSpec);
  if (!type) return false;
  if (isExcludedFromLogicalPaging(type)) return false;
  const templatePackage = runtimeContext?.template;
  if (!templatePackage) {
    throw new Error('Missing template package in runtime context for logical page calculation');
  }
  const masterName = resolvedMasterName || resolveMasterNameForSlide(slideSpec, runtimeContext);
  return Boolean(getIncludeFooterByMaster(templatePackage).get(masterName));
}

function applyAutoContentsPageRanges(slides = [], runtimeContext = {}) {
  const sectionRangesByNumber = new Map();
  const sectionRangesByTitle = new Map();
  let logicalPage = 0;
  let activeSectionNumber = '';
  let activeSectionTitle = '';

  for (const slide of slides) {
    const isDivider = isDividerSlide(slide, runtimeContext);
    if (isDivider) {
      activeSectionNumber = String(slide?.sectionNumber || '').trim();
      activeSectionTitle = normalizeSectionKey(slide?.sectionTitle);
      continue;
    }
    if (!shouldRenderLogicalPageNumber(slide, runtimeContext)) continue;
    logicalPage += 1;
    if (slide?.type === 'contents') continue;
    if (activeSectionNumber) setRange(sectionRangesByNumber, activeSectionNumber, logicalPage);
    if (activeSectionTitle) setRange(sectionRangesByTitle, activeSectionTitle, logicalPage);
  }

  return slides.map((slide) => {
    if (slide?.type !== 'contents' || !Array.isArray(slide.sections)) return slide;
    const sections = slide.sections.map((section) => {
      const byNumber = sectionRangesByNumber.get(String(section?.number || '').trim());
      const byTitle = sectionRangesByTitle.get(normalizeSectionKey(section?.title));
      const range = byNumber || byTitle;
      if (!range) return section;
      return {
        ...section,
        pageRange: formatPageRange(range.start, range.end),
      };
    });
    return { ...slide, sections };
  });
}

function paginateNoneStrategy({ slideSpec }) {
  return { slides: [slideSpec], originalCount: 0 };
}

function paginateTwoColumnBulletsStrategy({
  slideSpec,
  geometry,
  masterName,
  titleMaxChars,
  runtimeContext,
  footerSafeTopByMaster,
  paginationMetrics,
  resolveMasterFooterSafeTop,
}) {
  const footerSafeTop = resolveMasterFooterSafeTop(masterName, false);
  const twoColLayout = computeTwoColumnLayoutGeometry({
    geometry,
    masterName,
    footerSafeTopByMaster,
    theme: runtimeContext?.theme || null,
    strapline: slideSpec?.strapline,
    straplineFontSize: paginationMetrics.straplineFontSize,
  });
  const slides = paginateTwoColumn(slideSpec, geometry, {
    bodyFontSize: paginationMetrics.bodyFontSize,
    footerSafe: false,
    footerSafeTop,
    titleMaxChars,
    leftBox: twoColLayout?.safeLeftGeo || null,
    rightBox: twoColLayout?.safeRightGeo || null,
  });
  const originalCount =
    (Array.isArray(slideSpec.leftBody) ? slideSpec.leftBody.length : 0) +
    (Array.isArray(slideSpec.rightBody) ? slideSpec.rightBody.length : 0);
  return { slides, originalCount };
}

function resolveOneColumnLayoutBoxes({
  variant,
  slideSpec,
  geometry,
  masterName,
  runtimeContext,
  footerSafeTopByMaster,
  paginationMetrics,
}) {
  if (variant === 'oneColumn') {
    const firstLayout = computeOneColumnLayoutGeometry({
      geometry,
      masterName,
      footerSafeTopByMaster,
      theme: runtimeContext?.theme || null,
      strapline: slideSpec?.strapline,
      source: slideSpec?.source,
      callouts: slideSpec?.callouts,
      straplineFontSize: paginationMetrics.straplineFontSize,
      sourceFontSize: paginationMetrics.sourceFontSize,
    });
    const continuationLayout =
      Array.isArray(slideSpec?.callouts) && slideSpec.callouts.length > 0
        ? computeOneColumnLayoutGeometry({
            geometry,
            masterName,
            footerSafeTopByMaster,
            theme: runtimeContext?.theme || null,
            strapline: slideSpec?.strapline,
            source: slideSpec?.source,
            callouts: [],
            straplineFontSize: paginationMetrics.straplineFontSize,
            sourceFontSize: paginationMetrics.sourceFontSize,
          })
        : null;
    return {
      bodyBox: firstLayout?.safeBodyGeo || null,
      continuationBodyBox: continuationLayout?.safeBodyGeo || firstLayout?.safeBodyGeo || null,
    };
  }

  if (variant === 'analysisWideChart2ColsText' || variant === 'analysisWideChartTableText') {
    const isTableVariant = variant === 'analysisWideChartTableText';
    const firstLayout = isTableVariant
      ? computeAnalysisWideChartTableTextGeometry({
          geometry,
          masterName,
          footerSafeTopByMaster,
          theme: runtimeContext?.theme || null,
          strapline: slideSpec?.strapline,
          chart: slideSpec?.chart,
          table: slideSpec?.table,
          noteSource: slideSpec?.noteSource,
          showSummaryChart: slideSpec?.showSummaryChart,
          callouts: slideSpec?.callouts,
        })
      : computeAnalysisWideChart2ColsTextGeometry({
          geometry,
          masterName,
          footerSafeTopByMaster,
          theme: runtimeContext?.theme || null,
          strapline: slideSpec?.strapline,
          chart: slideSpec?.chart,
          callouts: slideSpec?.callouts,
        });
    const continuationLayout =
      Array.isArray(slideSpec?.callouts) && slideSpec.callouts.length > 0
        ? isTableVariant
          ? computeAnalysisWideChartTableTextGeometry({
              geometry,
              masterName,
              footerSafeTopByMaster,
              theme: runtimeContext?.theme || null,
              strapline: slideSpec?.strapline,
              chart: slideSpec?.chart,
              table: slideSpec?.table,
              noteSource: slideSpec?.noteSource,
              showSummaryChart: slideSpec?.showSummaryChart,
              callouts: [],
            })
          : computeAnalysisWideChart2ColsTextGeometry({
              geometry,
              masterName,
              footerSafeTopByMaster,
              theme: runtimeContext?.theme || null,
              strapline: slideSpec?.strapline,
              chart: slideSpec?.chart,
              callouts: [],
            })
        : null;
    return {
      bodyBox: firstLayout?.safeTextBox || null,
      continuationBodyBox: continuationLayout?.safeTextBox || firstLayout?.safeTextBox || null,
    };
  }

  throw new Error(`Unsupported one-column pagination layoutVariant "${variant}"`);
}

function paginateOneColumnBulletsStrategy({
  slideSpec,
  geometry,
  masterName,
  titleMaxChars,
  runtimeContext,
  footerSafeTopByMaster,
  paginationMetrics,
  policy,
  resolveMasterFooterSafeTop,
}) {
  const footerSafeTop = resolveMasterFooterSafeTop(masterName, false);
  const variant = String(policy?.options?.layoutVariant || '').trim();
  if (!variant) {
    throw new Error(`Missing required options.layoutVariant for one-column pagination policy "${policy?.key || ''}"`);
  }
  const boxes = resolveOneColumnLayoutBoxes({
    variant,
    slideSpec,
    geometry,
    masterName,
    runtimeContext,
    footerSafeTopByMaster,
    paginationMetrics,
  });
  const slides = paginateOneColumnBullets(slideSpec, geometry, 'body', {
    bodyFontSize: paginationMetrics.bodyFontSize,
    footerSafe: false,
    footerSafeTop,
    titleMaxChars,
    bodyBox: boxes.bodyBox,
    continuationBodyBox: boxes.continuationBodyBox,
  });
  const originalCount = Array.isArray(slideSpec.body) ? slideSpec.body.length : 0;
  return { slides, originalCount };
}

function paginateTableRowsStrategy({
  slideSpec,
  geometry,
  masterName,
  titleMaxChars,
  paginationMetrics,
  resolveMasterFooterSafeTop,
  emitTableWarning,
}) {
  const footerSafeTop = resolveMasterFooterSafeTop(masterName, true);
  const slides = paginateTableRows(slideSpec, geometry, {
    tableRowHeightCap: paginationMetrics.tableRowHeightCap,
    footerSafe: true,
    footerSafeTop,
    titleMaxChars,
    emitWarning: emitTableWarning,
  });
  const originalCount = Array.isArray(slideSpec?.table?.rows) ? slideSpec.table.rows.length : 0;
  return { slides, originalCount };
}

function paginateContentsSectionsStrategy({ slideSpec, titleMaxChars }) {
  return {
    slides: paginateContentsSections(slideSpec, { titleMaxChars }),
    originalCount: Array.isArray(slideSpec.sections) ? slideSpec.sections.length : 0,
  };
}

function paginateBridgeAnalysisColumnsStrategy({ slideSpec, geometry, titleMaxChars, paginationMetrics }) {
  const slides = paginateBridgeAnalysisColumns(slideSpec, geometry, {
    titleMaxChars,
    bodyFontSize: paginationMetrics.bridgeAnalysisBodyFontSize,
  });
  const originalCount = Array.isArray(slideSpec.analysisColumns)
    ? slideSpec.analysisColumns.reduce(
        (sum, col) => sum + (Array.isArray(col?.body) ? col.body.length : String(col?.body || '').trim() ? 1 : 0),
        0,
      )
    : 0;
  return { slides, originalCount };
}

function paginateBusinessOverviewStrategy({ slideSpec, geometry, titleMaxChars, paginationMetrics }) {
  const slides = paginateBusinessOverview(slideSpec, geometry, {
    titleMaxChars,
    bodyFontSize: paginationMetrics.bodyFontSize,
  });
  const originalCount = Array.isArray(slideSpec.overviewBody) ? slideSpec.overviewBody.length : 0;
  return { slides, originalCount };
}

const PAGINATION_STRATEGY_HANDLERS = Object.freeze({
  none: paginateNoneStrategy,
  twoColumnBullets: paginateTwoColumnBulletsStrategy,
  oneColumnBullets: paginateOneColumnBulletsStrategy,
  tableRows: paginateTableRowsStrategy,
  contentsSections: paginateContentsSectionsStrategy,
  bridgeAnalysisColumns: paginateBridgeAnalysisColumnsStrategy,
  businessOverview: paginateBusinessOverviewStrategy,
});

function assertPolicyDispatchCoverage(paginationPolicy) {
  if (validatedPolicyDispatchCache.has(paginationPolicy)) return;
  if (typeof paginationPolicy?.keys !== 'function') {
    throw new Error('Missing pagination policy keys() for dispatch coverage validation');
  }
  for (const key of paginationPolicy.keys()) {
    const policy = paginationPolicy.get(key);
    const strategy = String(policy?.strategy || '').trim();
    if (!strategy) {
      throw new Error(`Pagination policy "${key}" missing strategy`);
    }
    if (typeof PAGINATION_STRATEGY_HANDLERS[strategy] !== 'function') {
      throw new Error(`No pagination handler registered for policy "${key}" strategy "${strategy}"`);
    }
  }
  validatedPolicyDispatchCache.add(paginationPolicy);
}

function paginateWithStrategy(strategy, params) {
  const handler = PAGINATION_STRATEGY_HANDLERS[strategy];
  if (typeof handler !== 'function') {
    throw new Error(`Unsupported pagination strategy "${strategy}"`);
  }
  return handler(params);
}

export function paginateDeckSpec(deckSpec, runtimeContext = {}) {
  const spec = deckSpec && typeof deckSpec === 'object' ? deckSpec : { slides: [] };
  const slides = Array.isArray(spec.slides) ? spec.slides : [];
  const out = {
    ...spec,
    slides: [],
    slideTrace: [],
    paginationDecisions: [],
    overflowEvents: [],
    tableWarnings: [],
    recomputeFields: [],
  };
  const recomputeFields = new Set();

  const templateContracts = runtimeContext?.templateContracts;
  const slideRegistry = runtimeContext?.slideRegistry;
  const paginationPolicy = runtimeContext?.paginationPolicy;
  const footerSafeTopByMaster = runtimeContext?.footerSafeTopByMaster || null;
  if (!templateContracts?.get) throw new Error('Missing required template contracts in pagination runtime context');
  if (!slideRegistry?.get) throw new Error('Missing required slide registry in pagination runtime context');
  if (!paginationPolicy?.get) throw new Error('Missing required pagination policy in pagination runtime context');
  assertPolicyDispatchCoverage(paginationPolicy);

  const paginationMetrics = resolvePaginationMetrics(runtimeContext?.theme || null);

  function resolveMasterFooterSafeTop(masterName, requireSafeTop = false) {
    if (!footerSafeTopByMaster || typeof footerSafeTopByMaster !== 'object') {
      if (!requireSafeTop) return null;
      throw new Error(`Missing footer safe-top configuration for master "${masterName}"`);
    }
    const value = footerSafeTopByMaster[masterName];
    if (value === null || value === undefined) {
      if (!requireSafeTop) return null;
      throw new Error(`Missing footer safe-top value for master "${masterName}"`);
    }
    return requireFiniteMetric(`footerSafeTopByMaster.${masterName}`, value);
  }

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

  function applyContinuationDropFields(pagedSlides, policy) {
    const dropFields = Array.isArray(policy?.dropFields) ? policy.dropFields : [];
    if (dropFields.length === 0 || !Array.isArray(pagedSlides)) return pagedSlides;
    for (let idx = 1; idx < pagedSlides.length; idx += 1) {
      const slide = pagedSlides[idx];
      for (const field of dropFields) {
        if (field in slide) delete slide[field];
      }
    }
    return pagedSlides;
  }

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex += 1) {
    const slideSpec = slides[slideIndex];
    const rawType = slideSpec?.type;
    const type = resolveRegistryTypeForSlide(slideSpec);
    if (!rawType || !type) {
      throw new Error(`slides[${slideIndex}] missing valid slide type for pagination`);
    }

    const registryEntry = slideRegistry.get(type);
    if (!registryEntry) {
      throw new Error(`Missing slide-registry entry for slide type "${type}"`);
    }
    const policyKey = String(registryEntry?.paginationPolicyKey || '').trim();
    const policy = paginationPolicy.get(policyKey);
    if (!policy) {
      throw new Error(`Missing pagination policy "${policyKey}" for slide type "${type}"`);
    }
    for (const field of policy.recomputeFields || []) recomputeFields.add(field);
    const geom = resolveSlideGeometry(templateContracts, type);
    const contract = templateContracts.get(type);
    if (!contract) {
      throw new Error(`Unknown layout type "${type}" in template layouts.json`);
    }
    const titleMaxChars = Number(contract?.slots?.title?.maxChars || 0) || null;
    const mode = policy.mode;
    const masterName = resolveMasterNameForSlide(slideSpec, runtimeContext);

    const pagedResult = paginateWithStrategy(policy.strategy, {
      slideSpec,
      geometry: geom,
      titleMaxChars,
      masterName,
      policy,
      runtimeContext,
      paginationMetrics,
      footerSafeTopByMaster,
      resolveMasterFooterSafeTop,
      emitTableWarning: (warning) => recordTableWarning(slideIndex, rawType, warning),
    });
    if (!Array.isArray(pagedResult?.slides)) {
      throw new Error(
        `Pagination strategy "${policy.strategy}" returned invalid slides array for type "${rawType}"`,
      );
    }
    const paged = pagedResult.slides;
    const originalCount = Number.isFinite(Number(pagedResult?.originalCount))
      ? Number(pagedResult.originalCount)
      : 0;

    applyContinuationDropFields(paged, policy);
    recordSplit(slideIndex, rawType, mode, originalCount, paged.length, { policyKey: policy.key });
    const outputOffset = out.slides.length;
    paged.forEach((pagedSlide, pageIndex) => {
      out.slideTrace.push({
        inputSlideIndex: slideIndex,
        outputSlideIndex: outputOffset + pageIndex,
        slideType: pagedSlide?.type || rawType,
        sourceSlideType: rawType,
        pagination: {
          mode,
          policyKey: policy.key,
          pageIndex,
          pageCount: paged.length,
          split: paged.length > 1,
          originalCount,
        },
      });
    });
    out.slides.push(...paged);
  }

  if (recomputeFields.has(RECOMPUTE_FIELD_CONTENTS_PAGE_RANGES)) {
    out.slides = applyAutoContentsPageRanges(out.slides, runtimeContext);
  }
  out.recomputeFields = [...recomputeFields].sort();

  return out;
}
