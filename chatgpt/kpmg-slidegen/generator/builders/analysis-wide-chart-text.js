import { FONTS, COLORS, CHART_COLORS, TYPE_SIZES, TEXT_BOX } from '../tokens.js';
import { toBodyRuns } from '../helpers/bullets.js';
import { addTitle } from '../helpers/title.js';
import { pickDataLabelColor } from '../helpers/chart.js';
import {
  clampToMasterFooter,
  computeStrapShift,
  footerSafeTopForMaster,
  normalizeBodyStyle,
  shiftBox,
} from '../helpers/layout.js';
import { addAnalysisTable } from './analysis-narrow-table.js';

const TOKENS = {
  geometry: {
    title: { x: 1.0919, y: 0.4722, w: 11.1596, h: 0.5833 },
    strapline: { x: 1.0919, y: 1.2899, w: 11.1596, h: 0.5276 },
    leftText: { x: 1.0919, y: 1.6, w: 5.6, h: 5.4 },
    rightChart: { x: 7.0, y: 1.6, w: 5.25, h: 5.0 },
    topText: { x: 1.0919, y: 1.6, w: 11.1596, h: 2.2 },
    bottomChart: { x: 1.0919, y: 3.9, w: 11.1596, h: 3.0 },
  },
  textStyles: {
    strapline: { fontFace: FONTS.body, fontSize: TYPE_SIZES.strapline, color: COLORS.kpmgPurple, italic: true, bold: true },
    body: { fontFace: FONTS.body, fontSize: TYPE_SIZES.body, color: COLORS.black, paraSpaceAfter: 6 },
    source: { fontFace: FONTS.body, fontSize: TYPE_SIZES.source, color: COLORS.kpmgBlue, italic: true, paraSpaceAfter: 0 },
  },
};

function addChart(pptx, slide, chart, geo) {
  if (!chart || !chart.type || !chart.data) return;
  const typeMap = {
    bar: pptx.ChartType?.bar || 'bar',
    bar3d: pptx.ChartType?.bar3D || 'bar3D',
    line: pptx.ChartType?.line || 'line',
    pie: pptx.ChartType?.pie || 'pie',
    doughnut: pptx.ChartType?.doughnut || 'doughnut',
    area: pptx.ChartType?.area || 'area',
    scatter: pptx.ChartType?.scatter || 'scatter',
    radar: pptx.ChartType?.radar || 'radar',
  };

  const darkBarTypes = ['bar', 'bar3d', 'area'];
  const useLightLabels = darkBarTypes.includes(chart.type);

  const opts = {
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 7,
    legendFontFace: FONTS.body,
    catAxisLabelFontSize: 7,
    valAxisLabelFontSize: 7,
    catAxisLabelFontFace: FONTS.body,
    valAxisLabelFontFace: FONTS.body,
    dataLabelFontFace: FONTS.body,
    dataLabelFontSize: 7,
    dataLabelColor: useLightLabels ? COLORS.white : COLORS.black,
    dataLabelBkgrdColors: useLightLabels ? [COLORS.kpmgBlue] : undefined,
    showValue: true,
    ...(useLightLabels && chart.type === 'bar' ? { dataLabelPosition: 'inEnd' } : {}),
    // Cleaner due-diligence chart style: no background gridlines.
    valGridLine: { style: 'none' },
    catGridLine: { style: 'none' },
    // Match template: white background (no gray plot-area tint)
    chartArea: { fill: { color: 'FFFFFF' } },
    plotArea: { fill: { color: 'FFFFFF' } },
    dataBorder: { pt: 0.5, color: COLORS.white },
    chartColors: CHART_COLORS,
    ...(chart.opts || {}),
  };

  // For single-series bar/area charts, use one consistent color instead of
  // cycling through the palette (which implies different categories).
  const seriesCount = Array.isArray(chart.data) ? chart.data.length : 0;
  if (seriesCount === 1 && ['bar', 'bar3d', 'area'].includes(chart.type)) {
    opts.chartColors = [CHART_COLORS[0]];
  } else {
    opts.chartColors = CHART_COLORS;
  }

  if (chart.type === 'pie' || chart.type === 'doughnut') {
    opts.dataLabelColor = pickDataLabelColor(opts.chartColors);
  }

  slide.addChart(typeMap[chart.type] || chart.type, chart.data, { ...geo, ...opts });

  if (chart.source) {
    slide.addText(chart.source, {
      x: geo.x,
      y: geo.y + geo.h + 0.05,
      w: geo.w,
      h: 0.2,
      ...TOKENS.textStyles.source,
    });
  }
}

function addHeadingBand(pptx, slide, heading, geo) {
  if (!heading || !geo) return;
  slide.addShape(pptx.ShapeType.rect, {
    ...geo,
    line: { color: COLORS.kpmgBlue, pt: 1 },
    fill: { color: COLORS.kpmgBlue },
  });
  slide.addText(String(heading), {
    x: geo.x + 0.08,
    y: geo.y + 0.02,
    w: Math.max(0.4, geo.w - 0.16),
    h: geo.h,
    fontFace: FONTS.body,
    fontSize: TYPE_SIZES.body,
    color: COLORS.white,
    bold: true,
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
    valign: 'mid',
  });
}

export function addAnalysisWideChart2ColsText(pptx, { title, strapline, body, bodyStyle, chart, geometry, masterName } = {}) {
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const g = geometry || TOKENS.geometry;
  const strapText = strapline;
  const effectiveBodyStyle = normalizeBodyStyle(bodyStyle);
  let straplineBox = null;

  addTitle(slide, title, g.title || TOKENS.geometry.title);
  if (strapText && (g.strapline || TOKENS.geometry.strapline)) {
    straplineBox = g.strapline || TOKENS.geometry.strapline;
    slide.addText(String(strapText), {
      ...straplineBox,
      ...TOKENS.textStyles.strapline,
      wrap: TEXT_BOX.wrap,
      margin: TEXT_BOX.marginPt,
      valign: 'top',
    });
  }

  const leftBase = g.leftText || TOKENS.geometry.leftText;
  const rightBase = g.rightChart || TOKENS.geometry.rightChart;
  const yShift = computeStrapShift(straplineBox, Math.min(leftBase.y, rightBase.y));
  const textBox = shiftBox(leftBase, yShift);
  const chartBox = shiftBox(rightBase, yShift);
  const safeTextBox = clampToMasterFooter(textBox, masterName);
  const sourcePad = chart?.source ? 0.3 : 0;
  const safeChartBox = clampToMasterFooter(chartBox, masterName, sourcePad);

  slide.addText(toBodyRuns(body, effectiveBodyStyle), {
    ...safeTextBox,
    ...TOKENS.textStyles.body,
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
    valign: 'top',
  });
  addChart(pptx, slide, chart, safeChartBox);

  return slide;
}

export function addAnalysisWideChartTableText(
  pptx,
  { title, strapline, heading, body, bodyStyle, chart, table, noteSource, showSummaryChart = false, geometry, masterName } = {},
) {
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const g = geometry || TOKENS.geometry;
  const strapText = strapline;
  const effectiveBodyStyle = normalizeBodyStyle(bodyStyle);
  let straplineBox = null;

  addTitle(slide, title, g.title || TOKENS.geometry.title);
  straplineBox = g.strapline || g.bodyBoxes?.[0] || TOKENS.geometry.strapline;
  if (strapText && straplineBox) {
    slide.addText(String(strapText), {
      ...straplineBox,
      ...TOKENS.textStyles.strapline,
      wrap: TEXT_BOX.wrap,
      margin: TEXT_BOX.marginPt,
      valign: 'top',
    });
  }

  const topBase = g.body || g.rightBody || g.bodyBoxes?.[2] || g.topText || TOKENS.geometry.topText;
  const yShift = computeStrapShift(straplineBox, topBase.y);
  const hasChartData = Boolean(chart?.type && Array.isArray(chart?.data) && chart.data.length > 0);
  const hasTableData = Boolean(table?.headers && Array.isArray(table?.rows) && table.rows.length > 0);
  // Render charts whenever data is available; flags only influence preferred chart slot.
  const chartBase = hasChartData
    ? hasTableData
      ? (showSummaryChart ? (g.summaryChart || g.chart || g.bottomChart || null) : (g.chart || g.bottomChart || g.summaryChart || null))
      : (g.table || g.chart || g.bottomChart || g.summaryChart || null)
    : null;
  const tableBase = g.table || null;
  const headingBase = g.heading || g.bodyBoxes?.[1] || null;
  const footerSafeTop = footerSafeTopForMaster(masterName);
  let textBox = shiftBox(topBase, yShift);
  let chartBox = chartBase ? shiftBox(chartBase, yShift) : null;
  let tableBox = tableBase ? shiftBox(tableBase, yShift) : null;

  // Some extracted template variants place chart above the heading and push body/table
  // to the bottom half. For this layout we rebalance so chart + text sit directly below
  // the heading band, with table beneath them.
  const headingBottom = headingBase ? headingBase.y + headingBase.h : null;
  const isLegacyBottomAnchoredLayout = Boolean(
    hasChartData &&
      hasTableData &&
      headingBottom !== null &&
      chartBox &&
      textBox &&
      tableBox &&
      chartBox.y + chartBox.h <= headingBottom + 0.05 &&
      textBox.y >= headingBottom + 1.3,
  );
  if (isLegacyBottomAnchoredLayout) {
    const contentTop = headingBottom + 0.06 + yShift;
    const contentBottom = (footerSafeTop || 6.75) - (noteSource && g.note ? 0.22 : 0);
    const available = Math.max(2.8, contentBottom - contentTop);
    const upperH = Math.max(1.35, Math.min(2.0, available * 0.48));
    const lowerY = contentTop + upperH + 0.1;
    const lowerH = Math.max(1.2, available - upperH - 0.1);
    const leftX = Number.isFinite(tableBox.x) ? tableBox.x : 1.08854;
    const leftW = Number.isFinite(tableBox.w) ? tableBox.w : 5.50787;
    const rightX = Number.isFinite(textBox.x) ? textBox.x : 6.73622;
    const rightW = Number.isFinite(textBox.w) ? textBox.w : 5.50787;

    chartBox = { x: leftX, y: contentTop, w: leftW, h: upperH };
    textBox = { x: rightX, y: contentTop, w: rightW, h: upperH };
    tableBox = { x: leftX, y: lowerY, w: leftW, h: lowerH };
  }

  const safeTextBox = clampToMasterFooter(textBox, masterName);
  const sourcePad = chart?.source ? 0.3 : 0;
  const safeChartBox = chartBox ? clampToMasterFooter(chartBox, masterName, sourcePad) : null;
  const safeTableBox = tableBox ? clampToMasterFooter(tableBox, masterName) : null;

  addHeadingBand(pptx, slide, heading, headingBase);

  if (safeTableBox && hasTableData) {
    addAnalysisTable(slide, table, {
      x: safeTableBox.x,
      y: safeTableBox.y,
      w: safeTableBox.w,
      h: safeTableBox.h,
      tableTitle: title,
      tableHeading: heading || table?.title || table?.heading || title,
      showTitleBar: false,
    });
  }

  slide.addText(toBodyRuns(body, effectiveBodyStyle), {
    ...safeTextBox,
    ...TOKENS.textStyles.body,
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
    valign: 'top',
  });
  if (safeChartBox && hasChartData) {
    addChart(pptx, slide, chart, safeChartBox);
  }
  if (noteSource && g.note) {
    slide.addText(String(noteSource), {
      ...g.note,
      ...TOKENS.textStyles.source,
      wrap: TEXT_BOX.wrap,
      margin: 0,
      valign: 'top',
      breakLine: true,
    });
  }

  return slide;
}
