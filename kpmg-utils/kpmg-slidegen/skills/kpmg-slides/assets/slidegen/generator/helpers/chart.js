/**
 * generator/helpers/chart.js — Chart helpers for label contrast
 */

const CHART_TYPE_MAP = Object.freeze({
  bar: 'bar',
  bar3d: 'bar3D',
  line: 'line',
  pie: 'pie',
  doughnut: 'doughnut',
  area: 'area',
  scatter: 'scatter',
  radar: 'radar',
});

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '').trim();
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Choose a high-contrast label color for a palette.
 * @param {string[]} colors
 * @param {string} [fallback='000000']
 * @returns {string}
 */
export function pickDataLabelColor(colors, fallback = '000000') {
  if (!Array.isArray(colors) || colors.length === 0) return fallback;
  const lums = colors
    .map(hexToRgb)
    .filter(Boolean)
    .map(luminance);
  if (!lums.length) return fallback;
  const avg = lums.reduce((a, b) => a + b, 0) / lums.length;
  return avg < 0.5 ? 'FFFFFF' : '000000';
}

export function resolveChartType(pptx, rawType, fallback = 'bar') {
  const type = String(rawType || fallback || 'bar').toLowerCase();
  const mapKey = CHART_TYPE_MAP[type] || type;
  return pptx?.ChartType?.[mapKey] || mapKey;
}

export function buildThemedChartOptions(styles, { legendPos = 'r', showValue = true } = {}) {
  const chartStyle = styles?.chart || {};
  const fontFace = chartStyle.fontFace || styles?.fonts?.body;
  const palette = Array.isArray(chartStyle.palette) ? chartStyle.palette : [];
  const labelFontSize = Number(chartStyle.labelFontSize || chartStyle.axisFontSize || 7);
  return {
    showLegend: true,
    legendPos,
    legendFontFace: fontFace,
    legendFontSize: Number(chartStyle.legendFontSize || 7),
    catAxisLabelFontFace: fontFace,
    valAxisLabelFontFace: fontFace,
    catAxisLabelFontSize: labelFontSize,
    valAxisLabelFontSize: labelFontSize,
    showValue,
    dataLabelFontFace: fontFace,
    dataLabelFontSize: Number(chartStyle.dataLabelFontSize || 7),
    chartColors: palette,
    valGridLine: { style: 'none' },
    catGridLine: { style: 'none' },
    chartArea: { fill: { color: chartStyle.background } },
    plotArea: { fill: { color: chartStyle.background } },
  };
}
