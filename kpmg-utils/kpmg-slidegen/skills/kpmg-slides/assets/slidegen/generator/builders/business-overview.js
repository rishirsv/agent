import { addTitle } from '../helpers/title.js';
import { toBodyRuns } from '../helpers/bullets.js';
import { sanitizeText } from '../helpers/text.js';
import { normalizeBodyStyle } from '../helpers/layout.js';
import { validateBusinessStructureSpec } from '../helpers/business-structure.js';
import { buildThemedChartOptions, resolveChartType } from '../helpers/chart.js';
import { addChartBlock, addFootnoteBlock } from '../helpers/slide-components.js';
import { resolveTextBoxOptions, resolveTheme } from '../helpers/theme.js';

const DEFAULT_GEOMETRY = Object.freeze({
  title: { x: 1.0919, y: 0.4722, w: 11.1496, h: 0.5833 },
  leftHeading: { x: 1.0885, y: 1.2899, w: 6.2, h: 0.34 },
  leftPanel: { x: 1.01, y: 1.66, w: 6.35, h: 2.95 },
  rightHeading: { x: 7.6, y: 1.2899, w: 4.62, h: 0.34 },
  overviewBody: { x: 7.6, y: 1.66, w: 4.62, h: 4.76 },
  chart: { x: 9.34, y: 5.08, w: 2.88, h: 1.56 },
  source: { x: 1.1008, y: 6.4648, w: 6.0, h: 0.2 },
});

function resolveStyles(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  return {
    fonts: resolvedTheme.fonts,
    colors: {
      primary: resolvedTheme.colors.primary,
      white: resolvedTheme.colors.white,
      black: resolvedTheme.colors.black,
      pink: resolvedTheme.colors.pink,
      kpmgBlue: resolvedTheme.colors.kpmgBlue,
      kpmgCyan: resolvedTheme.colors.kpmgCyan,
      orange: resolvedTheme.colors.orange,
    },
    typeSizes: {
      body: resolvedTheme.typeSizes.body,
      source: resolvedTheme.typeSizes.source,
    },
    chart: {
      palette: resolvedTheme.chart.palette,
      legendFontSize: Number(resolvedTheme.chart.fontSizes.legend || 7),
      labelFontSize: Number(resolvedTheme.chart.fontSizes.axis || resolvedTheme.chart.fontSizes.label || 7),
      dataLabelFontSize: Number(resolvedTheme.chart.fontSizes.dataLabel || 7),
      background: resolvedTheme.colors.chart.background,
    },
  };
}

function toFinite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveGeometry(geometry = {}) {
  const source = geometry && typeof geometry === 'object' ? geometry : {};
  const read = (name) => ({
    x: toFinite(source?.[name]?.x, DEFAULT_GEOMETRY[name].x),
    y: toFinite(source?.[name]?.y, DEFAULT_GEOMETRY[name].y),
    w: toFinite(source?.[name]?.w, DEFAULT_GEOMETRY[name].w),
    h: toFinite(source?.[name]?.h, DEFAULT_GEOMETRY[name].h),
  });
  return {
    title: read('title'),
    leftHeading: read('leftHeading'),
    leftPanel: read('leftPanel'),
    rightHeading: read('rightHeading'),
    overviewBody: read('overviewBody'),
    chart: read('chart'),
    source: read('source'),
  };
}

function addSubheading(slide, text, box, styles) {
  if (!text) return;
  slide.addText(sanitizeText(text), {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fontFace: styles.fonts.body,
    fontSize: styles.typeSizes.body,
    color: styles.colors.primary,
    bold: true,
    margin: 0,
    valign: 'top',
    wrap: true,
  });
}

function renderStructurePanel(slide, structure, panelBox, styles) {
  const panelPadX = 0.12;
  const topTier = structure.topTier || [];
  const midTier = structure.midTier || [];
  const bottomTier = structure.bottomTier || [];
  const hasMid = midTier.length > 0;

  const topY = panelBox.y + 0.5;
  const midY = hasMid ? panelBox.y + 1.62 : null;
  const bottomY = hasMid ? panelBox.y + 2.35 : panelBox.y + 1.96;

  if (structure.perimeter?.enabled) {
    slide.addShape('rect', {
      x: panelBox.x,
      y: panelBox.y,
      w: panelBox.w,
      h: panelBox.h,
      fill: { color: styles.colors.white, transparency: 100 },
      line: { color: styles.colors.pink, pt: 1, dash: 'dash' },
    });

    if (structure.perimeter.label) {
      slide.addText(sanitizeText(structure.perimeter.label), {
        x: panelBox.x + 0.1,
        y: panelBox.y + 0.06,
        w: panelBox.w - 0.2,
        h: 0.14,
        fontFace: styles.fonts.body,
        fontSize: styles.typeSizes.body,
        color: styles.colors.kpmgBlue,
        bold: true,
        margin: 0,
        valign: 'top',
      });
    }

    if (structure.perimeter.subLabel) {
      slide.addText(sanitizeText(structure.perimeter.subLabel), {
        x: panelBox.x + 0.1,
        y: panelBox.y + 0.23,
        w: panelBox.w - 0.2,
        h: 0.14,
        fontFace: styles.fonts.body,
        fontSize: styles.typeSizes.body,
        color: styles.colors.kpmgBlue,
        bold: true,
        margin: 0,
        valign: 'top',
      });
    }
  }

  const tierBoxes = new Map();

  function renderTier(tierName, nodes, y, height) {
    if (!Array.isArray(nodes) || nodes.length === 0 || !Number.isFinite(y)) return;
    const gap = 0.14;
    const count = nodes.length;
    const availableW = panelBox.w - panelPadX * 2 - gap * (count - 1);
    const nodeW = Math.max(0.82, availableW / count);

    nodes.forEach((node, idx) => {
      const x = panelBox.x + panelPadX + idx * (nodeW + gap);
      const fill = tierName === 'bottom' && count === 1 ? styles.colors.kpmgCyan : styles.colors.primary;
      const box = { x, y, w: nodeW, h: height };

      slide.addShape('rect', {
        ...box,
        fill: { color: fill },
        line: { color: fill, pt: 0.6 },
      });

      slide.addText(sanitizeText(node.label), {
        x: x + 0.05,
        y: y + 0.03,
        w: Math.max(0.2, nodeW - 0.1),
        h: Math.max(0.2, height - 0.06),
        fontFace: styles.fonts.body,
        fontSize: styles.typeSizes.body,
        color: styles.colors.white,
        bold: true,
        align: 'center',
        valign: 'mid',
        margin: 0,
        wrap: true,
        fit: 'shrink',
      });

      const showPct = Boolean(node.pct) && !(tierName === 'mid' && count === 1);
      if (showPct) {
        const pctY = tierName === 'bottom' ? y - 0.16 : y + height + 0.02;
        slide.addText(node.pct, {
          x,
          y: pctY,
          w: nodeW,
          h: 0.14,
          fontFace: styles.fonts.body,
          fontSize: styles.typeSizes.body,
          color: styles.colors.black,
          align: 'center',
          margin: 0,
          valign: 'mid',
        });
      }

      tierBoxes.set(`${tierName}:${idx}`, box);
    });
  }

  renderTier('top', topTier, topY, 0.38);
  if (hasMid) renderTier('mid', midTier, midY, 0.58);
  renderTier('bottom', bottomTier, bottomY, 0.48);

  for (const link of structure.links || []) {
    const from = tierBoxes.get(`${link.fromTier}:${link.fromIndex}`);
    const to = tierBoxes.get(`${link.toTier}:${link.toIndex}`);
    if (!from || !to) continue;

    const x1 = from.x + from.w / 2;
    const y1 = from.y + from.h;
    const x2 = to.x + to.w / 2;
    const y2 = to.y;
    const elbowY = y1 + Math.max(0.04, (y2 - y1) * 0.45);

    slide.addShape('line', {
      x: x1,
      y: y1,
      w: 0,
      h: Math.max(0, elbowY - y1),
      line: { color: styles.colors.kpmgBlue, pt: 0.8 },
    });
    slide.addShape('line', {
      x: Math.min(x1, x2),
      y: elbowY,
      w: Math.abs(x2 - x1),
      h: 0,
      line: { color: styles.colors.kpmgBlue, pt: 0.8 },
    });
    slide.addShape('line', {
      x: x2,
      y: Math.min(elbowY, y2),
      w: 0,
      h: Math.abs(y2 - elbowY),
      line: { color: styles.colors.kpmgBlue, pt: 0.8 },
    });
  }
}

function addInlineChart(pptx, slide, chart, box, styles) {
  if (!chart || typeof chart !== 'object' || !Array.isArray(chart.data) || chart.data.length === 0) return;
  addChartBlock(pptx, slide, chart, box, styles, { legendPos: 'r' });

  if (chart.source) {
    slide.addText(String(chart.source), {
      x: box.x,
      y: box.y + box.h + 0.02,
      w: box.w,
      h: 0.16,
      fontFace: styles.fonts.body,
      fontSize: styles.typeSizes.source,
      color: styles.colors.kpmgBlue,
      italic: true,
      margin: 0,
      wrap: true,
      valign: 'top',
    });
  }
}

export function addBusinessOverview(
  pptx,
  slideSpec = {},
  ctx = {},
) {
  const {
    title,
    leftHeading,
    rightHeading,
    structure,
    overviewBody,
    chart,
    source,
    note,
    bodyStyle,
  } = slideSpec;
  const { geometry, masterName, footerSafeTopByMaster, theme } = ctx;
  const styles = resolveStyles(theme);
  const textBox = resolveTextBoxOptions(theme);
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const g = resolveGeometry(geometry);

  addTitle(slide, title, g.title, { theme });
  addSubheading(slide, leftHeading || 'Legal chart', g.leftHeading, styles);
  addSubheading(slide, rightHeading || 'Company overview', g.rightHeading, styles);

  const validated = validateBusinessStructureSpec(structure || {});
  if (!validated.normalized) {
    slide.addText(`Business structure invalid: ${validated.errors.join('; ')}`, {
      x: g.leftPanel.x,
      y: g.leftPanel.y,
      w: g.leftPanel.w,
      h: 0.4,
      fontFace: styles.fonts.body,
      fontSize: styles.typeSizes.body,
      color: styles.colors.orange,
      bold: true,
      margin: 0,
      wrap: true,
      valign: 'top',
    });
  } else {
    renderStructurePanel(slide, validated.normalized, g.leftPanel, styles);
  }

  let overviewBox = { ...g.overviewBody };
  if (chart && Array.isArray(chart.data) && chart.data.length > 0) {
    const maxBottom = g.chart.y - 0.08;
    const currentBottom = overviewBox.y + overviewBox.h;
    overviewBox.h = Math.max(0.6, Math.min(currentBottom, maxBottom) - overviewBox.y);
  }

  if (Array.isArray(overviewBody) && overviewBody.length > 0) {
    slide.addText(toBodyRuns(overviewBody, normalizeBodyStyle(bodyStyle), { theme }), {
      x: overviewBox.x,
      y: overviewBox.y,
      w: overviewBox.w,
      h: overviewBox.h,
      fontFace: styles.fonts.body,
      fontSize: styles.typeSizes.body,
      color: styles.colors.black,
      paraSpaceAfter: 6,
      ...textBox,
      valign: 'top',
      fit: 'shrink',
    });
  }

  addInlineChart(pptx, slide, chart, g.chart, styles);
  addFootnoteBlock(slide, {
    lines: [source, note],
    box: g.source,
    theme,
    masterName,
    footerSafeTopByMaster,
    minHeight: g.source.h,
    style: {
      fontFace: styles.fonts.body,
      fontSize: styles.typeSizes.source,
      color: styles.colors.kpmgBlue,
      italic: true,
      margin: 0,
    },
  });

  return slide;
}
