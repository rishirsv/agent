import { addTitle } from '../helpers/title.js';
import { isValidColumnGeometry } from '../helpers/geometry.js';
import { sanitizeText } from '../helpers/text.js';
import {
  resolveBodyTextStyle,
  resolveHeadingTextStyle,
  resolveStraplineTextStyle,
  resolveTextBoxOptions,
  resolveTheme,
} from '../helpers/theme.js';
import {
  clampToMasterFooter,
  computeStrapShift,
  normalizeBodyStyle,
} from '../helpers/layout.js';
import { recordFallback } from '../runtime/diagnostics.js';
import { addBodyBlock, addStraplineBlock } from '../helpers/slide-components.js';

const TOKENS = {
  geometry: {
    title: { x: 1.0919, y: 0.4722, w: 11.1596, h: 0.5833 },
    strapline: { x: 1.0919, y: 1.2899, w: 11.1596, h: 0.5276 },
    columns: [
      { x: 1.0919, y: 1.2899, w: 2.6, h: 5.9101 },
      { x: 3.9, y: 1.2899, w: 2.6, h: 5.9101 },
      { x: 6.7, y: 1.2899, w: 2.6, h: 5.9101 },
      { x: 9.5, y: 1.2899, w: 2.6, h: 5.9101 },
    ],
  },
};

function resolveTextStyles(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  return {
    strapline: resolveStraplineTextStyle(resolvedTheme),
    heading: resolveHeadingTextStyle(resolvedTheme),
    body: resolveBodyTextStyle(resolvedTheme),
  };
}

// Check if extracted column geometries represent a true 4-column side-by-side layout.
// The extractor can map unrelated text boxes (title, subtitle, body, footer)
// as "columns"; detect this by checking for distinct x positions.
function isValid4ColumnGeometry(geomColumns) {
  return isValidColumnGeometry(geomColumns, 3);
}

export function addTitleStrapline4TextBoxes(
  pptx,
  slideSpec = {},
  ctx = {},
) {
  const { title, strapline, columns, bodyStyle } = slideSpec;
  const { geometry, masterName, footerSafeTopByMaster, theme } = ctx;
  const textStyles = resolveTextStyles(theme);
  const textBox = resolveTextBoxOptions(theme);
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const strapText = strapline;
  const effectiveBodyStyle = normalizeBodyStyle(bodyStyle);

  // Validate geometry — fall back to hardcoded 4-column layout if the extracted
  // geometry doesn't represent actual side-by-side columns.
  const useExtracted = geometry && isValid4ColumnGeometry(geometry.columns);
  const g = useExtracted ? geometry : TOKENS.geometry;
  if (!useExtracted && geometry) {
    recordFallback('titleStrapline4TextBoxes', 'invalid_extracted_columns', {
      columns: geometry.columns,
    });
  }

  addTitle(slide, title, g.title || TOKENS.geometry.title, { theme });
  let straplineBox = null;
  if (strapText && (g.strapline || TOKENS.geometry.strapline)) {
    straplineBox = g.strapline || TOKENS.geometry.strapline;
    addStraplineBlock(slide, sanitizeText(strapText), straplineBox, { theme, style: textStyles.strapline });
  }

  const cols = Array.isArray(columns) ? columns : [];
  const firstColumnY = (g.columns && g.columns[0]?.y) || TOKENS.geometry.columns[0].y;
  const yShift = computeStrapShift(straplineBox, firstColumnY);

  for (let i = 0; i < 4; i++) {
    const col = cols[i] || {};
    const base = (g.columns && g.columns[i]) || TOKENS.geometry.columns[i];
    const geo = { ...base, y: base.y + yShift, h: base.h - yShift };
    const safeGeo = clampToMasterFooter(geo, masterName, 0, footerSafeTopByMaster);
    if (col.heading) {
      slide.addText(String(col.heading), { x: safeGeo.x, y: safeGeo.y, w: safeGeo.w, h: 0.3, ...textStyles.heading, ...textBox });
      addBodyBlock(slide, col.body, {
        x: safeGeo.x,
        y: safeGeo.y + 0.35,
        w: safeGeo.w,
        h: Math.max(0, safeGeo.h - 0.35),
      }, {
        theme,
        bodyStyle: effectiveBodyStyle,
        style: textStyles.body,
      });
    } else {
      addBodyBlock(slide, col.body, {
        x: safeGeo.x,
        y: safeGeo.y,
        w: safeGeo.w,
        h: safeGeo.h,
      }, {
        theme,
        bodyStyle: effectiveBodyStyle,
        style: textStyles.body,
      });
    }
  }

  return slide;
}
