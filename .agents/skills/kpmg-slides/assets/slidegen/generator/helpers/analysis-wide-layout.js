import { FOOTER_SAFE_TOP } from './footer.js';
import { clampToMasterFooter, computeStrapShift, footerSafeTopForMaster, shiftBox } from './layout.js';

export const ANALYSIS_WIDE_LAYOUT_DEFAULTS = Object.freeze({
  geometry: {
    title: { x: 1.0919, y: 0.4722, w: 11.1596, h: 0.5833 },
    strapline: { x: 1.0919, y: 1.2899, w: 11.1596, h: 0.5276 },
    leftText: { x: 1.0919, y: 1.6, w: 5.6, h: 5.4 },
    rightChart: { x: 7.0, y: 1.6, w: 5.25, h: 5.0 },
    topText: { x: 1.0919, y: 1.6, w: 11.1596, h: 2.2 },
    bottomChart: { x: 1.0919, y: 3.9, w: 11.1596, h: 3.0 },
  },
});

export function computeAnalysisWideChart2ColsTextGeometry({
  geometry,
  masterName = 'KPMG_WHITE',
  strapline,
  chart = null,
} = {}) {
  const g = geometry || ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry;
  const strapText = strapline;
  const straplineBox = strapText && (g.strapline || ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry.strapline)
    ? (g.strapline || ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry.strapline)
    : null;

  const leftBase = g.leftText || ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry.leftText;
  const rightBase = g.rightChart || ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry.rightChart;
  const yShift = computeStrapShift(straplineBox, Math.min(leftBase.y, rightBase.y));
  const textBox = shiftBox(leftBase, yShift);
  const chartBox = shiftBox(rightBase, yShift);
  const safeTextBox = clampToMasterFooter(textBox, masterName);
  const sourcePad = chart?.source ? 0.3 : 0;
  const safeChartBox = clampToMasterFooter(chartBox, masterName, sourcePad);

  return {
    geometry: g,
    strapText,
    straplineBox,
    safeTextBox,
    safeChartBox,
  };
}

export function computeAnalysisWideChartTableTextGeometry({
  geometry,
  masterName = 'KPMG_WHITE',
  strapline,
  chart,
  table,
  noteSource,
  showSummaryChart = false,
} = {}) {
  const g = geometry || ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry;
  const strapText = strapline;
  const straplineBox = g.strapline || g.bodyBoxes?.[0] || ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry.strapline;

  const topBase =
    g.body ||
    g.rightBody ||
    g.bodyBoxes?.[2] ||
    g.topText ||
    ANALYSIS_WIDE_LAYOUT_DEFAULTS.geometry.topText;
  const yShift = computeStrapShift(straplineBox, topBase.y);
  const hasChartData = Boolean(chart?.type && Array.isArray(chart?.data) && chart.data.length > 0);
  const hasTableData = Boolean(table?.headers && Array.isArray(table?.rows) && table.rows.length > 0);
  const shouldRenderChart = hasChartData;
  const chartBase = shouldRenderChart
    ? hasTableData
      ? showSummaryChart
        ? g.summaryChart || g.chart || g.bottomChart || null
        : g.chart || g.bottomChart || g.summaryChart || null
      : g.table || g.chart || g.bottomChart || g.summaryChart || null
    : null;
  const tableBase = g.table || null;
  const headingBase = g.heading || g.bodyBoxes?.[1] || null;
  const footerSafeTop = footerSafeTopForMaster(masterName) || FOOTER_SAFE_TOP;

  let textBox = shiftBox(topBase, yShift);
  let chartBox = chartBase ? shiftBox(chartBase, yShift) : null;
  let tableBox = tableBase ? shiftBox(tableBase, yShift) : null;

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
    const contentBottom = footerSafeTop - (noteSource && g.note ? 0.22 : 0);
    const available = Math.max(2.8, contentBottom - contentTop);
    const upperH = Math.max(1.35, Math.min(2.0, available * 0.48));
    const lowerY = contentTop + upperH + 0.1;
    const lowerH = Math.max(1.2, available - upperH - 0.1);
    const leftX = Number.isFinite(tableBox?.x) ? tableBox.x : 1.08854;
    const leftW = Number.isFinite(tableBox?.w) ? tableBox.w : 5.50787;
    const rightX = Number.isFinite(textBox?.x) ? textBox.x : 6.73622;
    const rightW = Number.isFinite(textBox?.w) ? textBox.w : 5.50787;

    chartBox = { x: leftX, y: contentTop, w: leftW, h: upperH };
    textBox = { x: rightX, y: contentTop, w: rightW, h: upperH };
    tableBox = { x: leftX, y: lowerY, w: leftW, h: lowerH };
  }

  const safeTextBox = clampToMasterFooter(textBox, masterName);
  const sourcePad = chart?.source ? 0.3 : 0;
  const safeChartBox = chartBox ? clampToMasterFooter(chartBox, masterName, sourcePad) : null;
  const safeTableBox = tableBox ? clampToMasterFooter(tableBox, masterName) : null;

  return {
    geometry: g,
    strapText,
    straplineBox,
    headingBase,
    safeTextBox,
    safeChartBox,
    safeTableBox,
  };
}

