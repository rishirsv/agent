import { toBodyRuns } from './bullets.js';
import { buildThemedChartOptions, pickDataLabelColor, resolveChartType } from './chart.js';
import { estimateSourceTextHeight, footerSafeTopForMaster } from './layout.js';
import {
  resolveBodyTextStyle,
  resolveSourceTextStyle,
  resolveStraplineTextStyle,
  resolveTextBoxOptions,
} from './theme.js';

function sanitizeLines(lines) {
  if (Array.isArray(lines)) return lines.map((line) => String(line || '').trim()).filter(Boolean);
  const single = String(lines || '').trim();
  return single ? [single] : [];
}

export function addStraplineBlock(slide, text, box, { theme = null, style = {}, textBox = {} } = {}) {
  if (!slide || !text || !box) return false;
  slide.addText(String(text), {
    ...box,
    ...resolveStraplineTextStyle(theme),
    ...style,
    ...resolveTextBoxOptions(theme, textBox),
    valign: 'top',
  });
  return true;
}

export function addBodyBlock(
  slide,
  body,
  box,
  { theme = null, bodyStyle = 'bullets', style = {}, textBox = {} } = {},
) {
  if (!slide || !box) return false;
  slide.addText(toBodyRuns(body, bodyStyle, { theme }), {
    ...box,
    ...resolveBodyTextStyle(theme),
    ...style,
    ...resolveTextBoxOptions(theme, textBox),
    valign: 'top',
  });
  return true;
}

export function addFootnoteBlock(
  slide,
  {
    lines,
    box,
    theme = null,
    masterName = null,
    footerSafeTopByMaster = null,
    minHeight = null,
    maxHeight = 0.44,
    style = {},
    textBox = {},
  } = {},
) {
  if (!slide || !box) return false;
  const safeLines = sanitizeLines(lines);
  if (safeLines.length === 0) return false;
  const text = safeLines.join('\n');
  const sourceStyle = { ...resolveSourceTextStyle(theme), ...style };
  const resolvedMinHeight = Number.isFinite(minHeight) ? minHeight : box.h;
  const desiredH = Math.max(
    resolvedMinHeight,
    estimateSourceTextHeight(text, box.w, {
      fontSize: sourceStyle.fontSize,
      maxHeight,
    }),
  );
  const safeTop = footerSafeTopForMaster(masterName, footerSafeTopByMaster);
  const y = safeTop ? Math.max(box.y, safeTop - desiredH) : box.y;
  const h = safeTop ? Math.max(0.1, Math.min(desiredH, safeTop - y)) : desiredH;
  const resolvedTextBox = resolveTextBoxOptions(theme, textBox);
  const hasTextBoxMargin = Object.prototype.hasOwnProperty.call(textBox || {}, 'margin');
  const hasStyleMargin = Object.prototype.hasOwnProperty.call(style || {}, 'margin');
  if (!hasTextBoxMargin && hasStyleMargin) {
    // Respect explicit margin overrides provided in style when textBox does not set margin.
    resolvedTextBox.margin = style.margin;
  }

  slide.addText(text, {
    x: box.x,
    y,
    w: box.w,
    h,
    ...sourceStyle,
    ...resolvedTextBox,
    valign: 'top',
  });
  return true;
}

export function addChartBlock(
  pptx,
  slide,
  chart,
  box,
  styles,
  {
    legendPos = 'r',
    showValue = true,
    useLightLabels = false,
    lightLabelColor = 'FFFFFF',
    darkLabelColor = '000000',
    seriesLabelBg = null,
    dataBorder = null,
    extraOptions = null,
  } = {},
) {
  if (!pptx || !slide || !chart || !chart.type || !Array.isArray(chart.data) || chart.data.length === 0 || !box) {
    return false;
  }

  const chartType = String(chart.type || 'bar').toLowerCase();
  const opts = {
    ...buildThemedChartOptions(styles, { legendPos, showValue }),
    ...(useLightLabels ? { dataLabelColor: lightLabelColor } : { dataLabelColor: darkLabelColor }),
    ...(useLightLabels && seriesLabelBg ? { dataLabelBkgrdColors: [seriesLabelBg] } : {}),
    ...(dataBorder ? { dataBorder } : {}),
    ...(extraOptions && typeof extraOptions === 'object' ? extraOptions : {}),
    ...(chart.opts || {}),
  };

  if (chartType === 'pie' || chartType === 'doughnut') {
    opts.dataLabelColor = pickDataLabelColor(opts.chartColors, darkLabelColor);
  }

  slide.addChart(resolveChartType(pptx, chartType, chartType), chart.data, {
    ...box,
    ...opts,
  });
  return true;
}

export function addTableBlock(
  slide,
  table,
  box,
  { renderTable, renderOptions = {} } = {},
) {
  if (!slide || !table || !box || typeof renderTable !== 'function') return null;
  return renderTable(slide, table, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    ...renderOptions,
  });
}
