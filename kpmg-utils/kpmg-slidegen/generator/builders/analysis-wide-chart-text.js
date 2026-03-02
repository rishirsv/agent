import { addTitle } from '../helpers/title.js';
import { renderCallouts } from '../helpers/callouts.js';
import { addBodyBlock, addChartBlock, addStraplineBlock, addTableBlock } from '../helpers/slide-components.js';
import { sanitizeText } from '../helpers/text.js';
import { normalizeBodyStyle } from '../helpers/layout.js';
import { resolveTextBoxOptions, resolveTheme } from '../helpers/theme.js';
import {
  ANALYSIS_WIDE_LAYOUT_DEFAULTS,
  computeAnalysisWideChart2ColsTextGeometry,
  computeAnalysisWideChartTableTextGeometry,
} from '../helpers/analysis-wide-layout.js';
import { addAnalysisTable } from './analysis-narrow-table.js';

const TOKENS = {
  geometry: ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry,
};

function resolveStyles(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  return {
    textStyles: {
      strapline: {
        fontFace: resolvedTheme.fonts.body,
        fontSize: resolvedTheme.typeSizes.strapline,
        color: resolvedTheme.colors.kpmgPurple,
        italic: true,
        bold: true,
      },
      body: {
        fontFace: resolvedTheme.fonts.body,
        fontSize: resolvedTheme.typeSizes.body,
        color: resolvedTheme.colors.black,
        paraSpaceAfter: 6,
      },
      source: {
        fontFace: resolvedTheme.fonts.body,
        fontSize: resolvedTheme.typeSizes.source,
        color: resolvedTheme.colors.kpmgBlue,
        italic: true,
        paraSpaceAfter: 0,
      },
    },
    headingBand: {
      fill: resolvedTheme.colors.kpmgBlue,
      line: resolvedTheme.colors.kpmgBlue,
      textColor: resolvedTheme.colors.white,
      textFont: resolvedTheme.fonts.body,
      textSize: resolvedTheme.typeSizes.body,
    },
    chart: {
      palette: resolvedTheme.chart.palette,
      legendFontSize: Number(resolvedTheme.chart.fontSizes.legend || 7),
      labelFontSize: Number(resolvedTheme.chart.fontSizes.label || 8),
      dataLabelFontSize: Number(resolvedTheme.chart.fontSizes.dataLabel || 7),
      background: resolvedTheme.colors.chart.background,
      fontFace: resolvedTheme.fonts.body,
      lightLabelColor: resolvedTheme.colors.white,
      darkLabelColor: resolvedTheme.colors.black,
      seriesLabelBg: resolvedTheme.colors.kpmgBlue,
      dataBorder: resolvedTheme.colors.white,
    },
    annotation: {
      borderColor: resolvedTheme.colors.kpmgBlue,
      fillColor: resolvedTheme.colors.white,
      titleColor: resolvedTheme.colors.kpmgBlue,
      textColor: resolvedTheme.colors.black,
      titleSize: 7.5,
      textSize: 7.5,
      fontFace: resolvedTheme.fonts.body,
    },
  };
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeChartAnnotations(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const title = sanitizeText(item.title || item.heading);
    const text = sanitizeText(item.text || item.body);
    if (!title && !text) continue;
    const anchor = sanitizeText(item.anchor || 'topRight');
    if (!['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(anchor)) continue;
    out.push({ title, text, anchor });
    if (out.length >= 4) break;
  }
  return out;
}

function chartAnnotationBox(chartGeo, anchor, slotIndex = 0) {
  const boxW = clamp(chartGeo.w * 0.34, 1.6, 2.8);
  const boxH = clamp(chartGeo.h * 0.2, 0.45, 0.72);
  const margin = 0.07;
  const offset = slotIndex * (boxH + 0.04);

  if (anchor === 'topLeft') {
    return { x: chartGeo.x + margin, y: chartGeo.y + margin + offset, w: boxW, h: boxH };
  }
  if (anchor === 'bottomLeft') {
    return { x: chartGeo.x + margin, y: chartGeo.y + chartGeo.h - boxH - margin - offset, w: boxW, h: boxH };
  }
  if (anchor === 'bottomRight') {
    return {
      x: chartGeo.x + chartGeo.w - boxW - margin,
      y: chartGeo.y + chartGeo.h - boxH - margin - offset,
      w: boxW,
      h: boxH,
    };
  }
  return {
    x: chartGeo.x + chartGeo.w - boxW - margin,
    y: chartGeo.y + margin + offset,
    w: boxW,
    h: boxH,
  };
}

function toChartAnnotationRuns(item, annotationStyle) {
  const runs = [];
  if (item.title) {
    runs.push({
      text: item.title,
      options: {
        bold: true,
        color: annotationStyle.titleColor,
        fontSize: annotationStyle.titleSize,
        breakLine: Boolean(item.text),
        paraSpaceAfter: item.text ? 1 : 0,
      },
    });
  }
  if (item.text) {
    runs.push({
      text: item.text,
      options: {
        color: annotationStyle.textColor,
        fontSize: annotationStyle.textSize,
        breakLine: false,
      },
    });
  }
  return runs;
}

function renderChartAnnotations(pptx, slide, chart, chartGeo, styles) {
  if (!pptx || !slide || !chart || !chartGeo) return;
  const annotations = normalizeChartAnnotations(chart.annotations);
  if (annotations.length === 0) return;

  const slotsUsed = new Map();
  for (const item of annotations) {
    const idx = slotsUsed.get(item.anchor) || 0;
    slotsUsed.set(item.anchor, idx + 1);
    const box = chartAnnotationBox(chartGeo, item.anchor, idx);
    const runs = toChartAnnotationRuns(item, styles.annotation);
    if (runs.length === 0) continue;
    slide.addText(runs, {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      fontFace: styles.annotation.fontFace,
      fontSize: styles.annotation.textSize,
      color: styles.annotation.textColor,
      line: { color: styles.annotation.borderColor, pt: 0.8 },
      fill: { color: styles.annotation.fillColor },
      margin: [2, 3, 2, 3],
      wrap: true,
      fit: 'shrink',
      valign: 'top',
    });
  }
}

function addChart(pptx, slide, chart, geo, styles) {
  if (!chart || !chart.type || !chart.data) return;
  const chartType = String(chart.type).toLowerCase();

  const darkBarTypes = ['bar', 'bar3d', 'area'];
  const useLightLabels = darkBarTypes.includes(chartType);
  const palette = styles.chart.palette;

  const seriesCount = Array.isArray(chart.data) ? chart.data.length : 0;
  const chartColors = seriesCount === 1 && ['bar', 'bar3d', 'area'].includes(chartType)
    ? [palette[0]]
    : palette;
  addChartBlock(pptx, slide, chart, geo, styles, {
    legendPos: 'b',
    useLightLabels,
    lightLabelColor: styles.chart.lightLabelColor,
    darkLabelColor: styles.chart.darkLabelColor,
    seriesLabelBg: styles.chart.seriesLabelBg,
    dataBorder: { pt: 0.5, color: styles.chart.dataBorder },
    extraOptions: {
      chartColors,
      ...(useLightLabels && chartType === 'bar' ? { dataLabelPosition: 'inEnd' } : {}),
    },
  });

  if (chart.source) {
    slide.addText(chart.source, {
      x: geo.x,
      y: geo.y + geo.h + 0.05,
      w: geo.w,
      h: 0.2,
      ...styles.textStyles.source,
    });
  }
}

function addHeadingBand(pptx, slide, heading, geo, styles, textBox) {
  if (!heading || !geo) return;
  slide.addShape(pptx.ShapeType.rect, {
    ...geo,
    line: { color: styles.headingBand.line, pt: 1 },
    fill: { color: styles.headingBand.fill },
  });
  slide.addText(String(heading), {
    x: geo.x + 0.08,
    y: geo.y + 0.02,
    w: Math.max(0.4, geo.w - 0.16),
    h: geo.h,
    fontFace: styles.headingBand.textFont,
    fontSize: styles.headingBand.textSize,
    color: styles.headingBand.textColor,
    bold: true,
    ...textBox,
    valign: 'mid',
  });
}

export function addAnalysisWideChart2ColsText(
  pptx,
  slideSpec = {},
  ctx = {},
) {
  const { title, strapline, body, callouts, bodyStyle, chart } = slideSpec;
  const { geometry, masterName, footerSafeTopByMaster, theme } = ctx;
  const styles = resolveStyles(theme);
  const textBox = resolveTextBoxOptions(theme);
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const {
    geometry: g,
    strapText,
    straplineBox,
    callouts: resolvedCallouts,
    calloutBoxes,
    safeTextBox,
    safeChartBox,
  } = computeAnalysisWideChart2ColsTextGeometry({
    geometry,
    masterName,
    footerSafeTopByMaster,
    strapline,
    chart,
    callouts,
  });
  const effectiveBodyStyle = normalizeBodyStyle(bodyStyle);

  addTitle(slide, title, g.title || TOKENS.geometry.title, { theme });
  addStraplineBlock(slide, strapText, straplineBox, { theme, style: styles.textStyles.strapline, textBox });
  addBodyBlock(slide, body, safeTextBox, { theme, bodyStyle: effectiveBodyStyle, style: styles.textStyles.body, textBox });
  addChart(pptx, slide, chart, safeChartBox, styles);
  renderChartAnnotations(pptx, slide, chart, safeChartBox, styles);
  renderCallouts(pptx, slide, {
    callouts: resolvedCallouts,
    boxes: calloutBoxes,
    slideType: 'analysisWideChart2ColsText',
    textBox: safeTextBox,
    chartBox: safeChartBox,
    theme,
  });

  return slide;
}

export function addAnalysisWideChartTableText(
  pptx,
  slideSpec = {},
  ctx = {},
) {
  const {
    title,
    strapline,
    heading,
    body,
    callouts,
    bodyStyle,
    chart,
    table,
    noteSource,
    showSummaryChart = false,
  } = slideSpec;
  const { geometry, masterName, footerSafeTopByMaster, theme } = ctx;
  const styles = resolveStyles(theme);
  const textBox = resolveTextBoxOptions(theme);
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const {
    geometry: g,
    strapText,
    straplineBox,
    headingBase,
    callouts: resolvedCallouts,
    calloutBoxes,
    safeTextBox,
    safeChartBox,
    safeTableBox,
  } = computeAnalysisWideChartTableTextGeometry({
    geometry,
    masterName,
    footerSafeTopByMaster,
    strapline,
    chart,
    table,
    noteSource,
    showSummaryChart,
    callouts,
  });
  const effectiveBodyStyle = normalizeBodyStyle(bodyStyle);

  addTitle(slide, title, g.title || TOKENS.geometry.title, { theme });
  addStraplineBlock(slide, strapText, straplineBox, { theme, style: styles.textStyles.strapline, textBox });
  const hasChartData = Boolean(
    chart?.type && Array.isArray(chart?.data) && chart.data.length > 0,
  );
  const hasTableData = Boolean(
    table?.headers && Array.isArray(table?.rows) && table.rows.length > 0,
  );

  addHeadingBand(pptx, slide, heading, headingBase, styles, textBox);

  let tableMeta = null;
  if (safeTableBox && hasTableData) {
    tableMeta = addTableBlock(slide, table, safeTableBox, {
      renderTable: addAnalysisTable,
      renderOptions: {
        tableTitle: title,
        tableHeading: heading || table?.title || table?.heading || title,
        showTitleBar: false,
        theme,
      },
    });
  }

  addBodyBlock(slide, body, safeTextBox, { theme, bodyStyle: effectiveBodyStyle, style: styles.textStyles.body, textBox });
  if (safeChartBox && hasChartData) {
    addChart(pptx, slide, chart, safeChartBox, styles);
    renderChartAnnotations(pptx, slide, chart, safeChartBox, styles);
  }
  if (noteSource && g.note) {
    slide.addText(String(noteSource), {
      ...g.note,
      ...styles.textStyles.source,
      wrap: textBox.wrap,
      margin: 0,
      valign: 'top',
      breakLine: true,
    });
  }
  renderCallouts(pptx, slide, {
    callouts: resolvedCallouts,
    boxes: calloutBoxes,
    slideType: 'analysisWideChartTableText',
    textBox: safeTextBox,
    chartBox: safeChartBox,
    tableBox: safeTableBox,
    tableMeta,
    theme,
  });

  return slide;
}
