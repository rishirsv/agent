import { sanitizeText } from './text.js';
import { resolveTheme } from './theme.js';

const MAX_CALLOUTS = 4;
const CALLOUT_GAP = 0.12;
const CONNECTOR_GAP = 0.12;
const DEFAULT_STYLE = Object.freeze({
  linePt: 1,
  headingSize: 8,
  bodySize: 7.5,
  connectorPt: 0.9,
});

function resolveStyle(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  return {
    lineColor: resolvedTheme.colors.kpmgBlue,
    linePt: DEFAULT_STYLE.linePt,
    fillColor: resolvedTheme.colors.white,
    headingColor: resolvedTheme.colors.black,
    bodyColor: resolvedTheme.colors.black,
    fontFace: resolvedTheme.fonts.body,
    headingSize: DEFAULT_STYLE.headingSize,
    bodySize: DEFAULT_STYLE.bodySize,
    connectorColor: resolvedTheme.colors.kpmgBlue,
    connectorPt: DEFAULT_STYLE.connectorPt,
  };
}

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function clamp(value, min, max) {
  if (!isFiniteNumber(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function isGeometryBox(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      isFiniteNumber(value.x) &&
      isFiniteNumber(value.y) &&
      isFiniteNumber(value.w) &&
      isFiniteNumber(value.h) &&
      value.w > 0 &&
      value.h > 0,
  );
}

function normalizeBodyLines(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return sanitizeText(item);
        if (item && typeof item === 'object' && item.text !== undefined) return sanitizeText(item.text);
        return sanitizeText(item);
      })
      .filter(Boolean);
  }
  const text = sanitizeText(value);
  return text ? [text] : [];
}

export function normalizeCallouts(rawCallouts, { maxCallouts = MAX_CALLOUTS } = {}) {
  if (!Array.isArray(rawCallouts)) return [];
  const out = [];
  for (const item of rawCallouts) {
    if (out.length >= maxCallouts) break;
    if (!item || typeof item !== 'object') continue;
    const heading = sanitizeText(item.heading ?? item.title);
    const body = normalizeBodyLines(item.body);
    if (!heading && body.length === 0) continue;
    out.push({ heading, body });
  }
  return out;
}

function stackBoxes({ x, y, w, h }, count) {
  if (count <= 0) return [];
  if (count === 1) return [{ x, y, w, h }];
  const gapTotal = CALLOUT_GAP * (count - 1);
  const itemH = Math.max(0.55, (h - gapTotal) / count);
  const boxes = [];
  let top = y;
  for (let idx = 0; idx < count; idx += 1) {
    boxes.push({ x, y: top, w, h: itemH });
    top += itemH + CALLOUT_GAP;
  }
  return boxes;
}

function railFromBoxes(boxes) {
  const valid = Array.isArray(boxes) ? boxes.filter(isGeometryBox) : [];
  if (valid.length === 0) return null;
  const first = valid[0];
  let top = first.y;
  let bottom = first.y + first.h;
  for (const box of valid) {
    top = Math.min(top, box.y);
    bottom = Math.max(bottom, box.y + box.h);
  }
  return { x: first.x, y: top, w: first.w, h: Math.max(0.6, bottom - top) };
}

function intersects(a, b) {
  if (!isGeometryBox(a) || !isGeometryBox(b)) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function adjustTextBoxForCallouts(textBox, boxes, { minWidth = 2.6, minHeight = 1.0 } = {}) {
  if (!isGeometryBox(textBox) || !Array.isArray(boxes) || boxes.length === 0) return textBox;
  const overlapping = boxes.filter((box) => intersects(textBox, box));
  if (overlapping.length === 0) return textBox;

  const left = textBox.x;
  const right = textBox.x + textBox.w;
  const top = textBox.y;
  const bottom = textBox.y + textBox.h;
  const union = overlapping.reduce(
    (acc, box) => ({
      left: Math.min(acc.left, box.x),
      right: Math.max(acc.right, box.x + box.w),
      top: Math.min(acc.top, box.y),
      bottom: Math.max(acc.bottom, box.y + box.h),
    }),
    { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity },
  );

  const options = [];
  const rightCut = union.left - CALLOUT_GAP;
  if (rightCut > left + minWidth) {
    options.push({ x: left, y: top, w: rightCut - left, h: bottom - top });
  }
  const leftCut = union.right + CALLOUT_GAP;
  if (leftCut < right - minWidth) {
    options.push({ x: leftCut, y: top, w: right - leftCut, h: bottom - top });
  }
  const topCut = union.bottom + CALLOUT_GAP;
  if (topCut < bottom - minHeight) {
    options.push({ x: left, y: topCut, w: right - left, h: bottom - topCut });
  }

  if (options.length === 0) return textBox;
  options.sort((a, b) => b.w * b.h - a.w * a.h);
  return options[0];
}

export function resolveCalloutLayout({
  callouts,
  textBox,
  preferredBoxes = [],
} = {}) {
  const normalized = normalizeCallouts(callouts);
  if (normalized.length === 0) {
    return { callouts: [], calloutBoxes: [], adjustedTextBox: textBox || null };
  }

  const rail = railFromBoxes(preferredBoxes);
  if (!rail) {
    return { callouts: normalized, calloutBoxes: [], adjustedTextBox: textBox || null };
  }

  const desired = normalized.length;
  const validPreferred = preferredBoxes.filter(isGeometryBox);
  const calloutBoxes = validPreferred.length >= desired ? validPreferred.slice(0, desired) : stackBoxes(rail, desired);
  const adjustedTextBox = adjustTextBoxForCallouts(textBox, calloutBoxes, {
    minWidth: 2.6,
    minHeight: 1.0,
  });

  return {
    callouts: normalized,
    calloutBoxes,
    adjustedTextBox,
  };
}

function drawLineSegment(pptx, slide, from, to, style) {
  const horizontal = Math.abs(from.y - to.y) < 0.001;
  const vertical = Math.abs(from.x - to.x) < 0.001;
  if (!horizontal && !vertical) return;
  const x = horizontal ? Math.min(from.x, to.x) : from.x;
  const y = vertical ? Math.min(from.y, to.y) : from.y;
  const w = horizontal ? Math.abs(from.x - to.x) : 0;
  const h = vertical ? Math.abs(from.y - to.y) : 0;
  if (w < 0.01 && h < 0.01) return;
  slide.addShape(pptx.ShapeType.line, {
    x,
    y,
    w,
    h,
    line: { color: style.connectorColor, pt: style.connectorPt },
  });
}

function drawLeader(pptx, slide, anchor, box, style) {
  if (!anchor || !isGeometryBox(box)) return;
  const boxTargetY = clamp(anchor.y, box.y + 0.06, box.y + box.h - 0.06);
  const boxEdgeX = anchor.x <= box.x ? box.x : box.x + box.w;
  const elbowX = anchor.x <= box.x ? boxEdgeX - CONNECTOR_GAP : boxEdgeX + CONNECTOR_GAP;

  drawLineSegment(pptx, slide, anchor, { x: elbowX, y: anchor.y }, style);
  drawLineSegment(pptx, slide, { x: elbowX, y: anchor.y }, { x: elbowX, y: boxTargetY }, style);
  drawLineSegment(pptx, slide, { x: elbowX, y: boxTargetY }, { x: boxEdgeX, y: boxTargetY }, style);
}

function autoAnchor({ index, count, slideType, textBox, chartBox, tableBox, tableMeta }) {
  const ratio = (index + 1) / (count + 1);

  if (slideType === 'analysisWideChartTableText' && isGeometryBox(tableBox)) {
    const rowCenters = Array.isArray(tableMeta?.rowCenters) ? tableMeta.rowCenters : [];
    const targetRow = rowCenters.length
      ? rowCenters[Math.max(0, Math.min(rowCenters.length - 1, Math.round((rowCenters.length - 1) * ratio)))]
      : tableBox.y + tableBox.h * ratio;
    return { x: tableBox.x + tableBox.w, y: targetRow };
  }

  if (slideType === 'analysisWideChart2ColsText' && isGeometryBox(chartBox)) {
    return { x: chartBox.x, y: chartBox.y + chartBox.h * ratio };
  }

  if (isGeometryBox(textBox)) {
    return { x: textBox.x + textBox.w, y: textBox.y + textBox.h * ratio };
  }

  return null;
}

function toBodyRuns(lines = []) {
  const runs = [];
  for (let idx = 0; idx < lines.length; idx += 1) {
    const text = sanitizeText(lines[idx]);
    if (!text) continue;
    runs.push({
      text,
      options: {
        breakLine: idx < lines.length - 1,
        paraSpaceAfter: idx < lines.length - 1 ? 2 : 0,
        lineSpacing: 9,
      },
    });
  }
  return runs;
}

function toCalloutRuns(callout = {}, style) {
  const runs = [];
  const heading = sanitizeText(callout.heading);
  const bodyRuns = toBodyRuns(callout.body);
  if (heading) {
    runs.push({
      text: heading,
      options: {
        bold: true,
        color: style.headingColor,
        fontSize: style.headingSize,
        breakLine: bodyRuns.length > 0,
        paraSpaceAfter: 2,
        lineSpacing: 9,
      },
    });
  }
  runs.push(...bodyRuns);
  return runs;
}

export function renderCallouts(
  pptx,
  slide,
  {
    callouts = [],
    boxes = [],
    slideType,
    textBox,
    chartBox,
    tableBox,
    tableMeta,
    theme = null,
  } = {},
) {
  if (!pptx || !slide || !Array.isArray(callouts) || !Array.isArray(boxes)) return;
  const style = resolveStyle(theme);
  const count = Math.min(callouts.length, boxes.length, MAX_CALLOUTS);

  for (let idx = 0; idx < count; idx += 1) {
    const callout = callouts[idx];
    const box = boxes[idx];
    if (!callout || !isGeometryBox(box)) continue;

    const anchor = autoAnchor({
      index: idx,
      count,
      slideType,
      textBox,
      chartBox,
      tableBox,
      tableMeta,
    });
    drawLeader(pptx, slide, anchor, box, style);

    const calloutRuns = toCalloutRuns(callout, style);
    if (calloutRuns.length === 0) continue;

    slide.addText(calloutRuns, {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      fontFace: style.fontFace,
      fontSize: style.bodySize,
      color: style.bodyColor,
      line: { color: style.lineColor, pt: style.linePt },
      fill: { color: style.fillColor },
      margin: [3, 4, 3, 4],
      wrap: true,
      fit: 'shrink',
      valign: 'top',
    });
  }
}
