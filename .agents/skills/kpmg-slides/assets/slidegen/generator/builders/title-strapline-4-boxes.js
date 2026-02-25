import { FONTS, COLORS, TYPE_SIZES, TEXT_BOX } from '../tokens.js';
import { toBodyRuns } from '../helpers/bullets.js';
import { addTitle } from '../helpers/title.js';
import { isValidColumnGeometry } from '../helpers/geometry.js';
import { sanitizeText } from '../helpers/text.js';
import {
  clampToMasterFooter,
  computeStrapShift,
  normalizeBodyStyle,
} from '../helpers/layout.js';
import { recordFallback } from '../runtime/diagnostics.js';

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
  textStyles: {
    strapline: { fontFace: FONTS.body, fontSize: TYPE_SIZES.strapline, color: COLORS.kpmgPurple, italic: true, bold: true },
    heading: { fontFace: FONTS.body, fontSize: TYPE_SIZES.body, color: COLORS.kpmgBlue, bold: true },
    body: { fontFace: FONTS.body, fontSize: TYPE_SIZES.body, color: COLORS.black, paraSpaceAfter: 6 },
  },
};

// Check if extracted column geometries represent a true 4-column side-by-side layout.
// The extractor can map unrelated text boxes (title, subtitle, body, footer)
// as "columns"; detect this by checking for distinct x positions.
function isValid4ColumnGeometry(geomColumns) {
  return isValidColumnGeometry(geomColumns, 3);
}

export function addTitleStrapline4TextBoxes(
  pptx,
  { title, strapline, columns, bodyStyle, geometry, masterName } = {},
) {
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

  addTitle(slide, title, g.title || TOKENS.geometry.title);
  let straplineBox = null;
  if (strapText && (g.strapline || TOKENS.geometry.strapline)) {
    straplineBox = g.strapline || TOKENS.geometry.strapline;
    slide.addText(sanitizeText(strapText), {
      ...straplineBox,
      ...TOKENS.textStyles.strapline,
      wrap: TEXT_BOX.wrap,
      margin: TEXT_BOX.marginPt,
      valign: 'top',
    });
  }

  const cols = Array.isArray(columns) ? columns : [];
  const firstColumnY = (g.columns && g.columns[0]?.y) || TOKENS.geometry.columns[0].y;
  const yShift = computeStrapShift(straplineBox, firstColumnY);

  for (let i = 0; i < 4; i++) {
    const col = cols[i] || {};
    const base = (g.columns && g.columns[i]) || TOKENS.geometry.columns[i];
    const geo = { ...base, y: base.y + yShift, h: base.h - yShift };
    const safeGeo = clampToMasterFooter(geo, masterName);
    if (col.heading) {
      slide.addText(String(col.heading), { x: safeGeo.x, y: safeGeo.y, w: safeGeo.w, h: 0.3, ...TOKENS.textStyles.heading, wrap: TEXT_BOX.wrap, margin: TEXT_BOX.marginPt });
      slide.addText(toBodyRuns(col.body, effectiveBodyStyle), {
        x: safeGeo.x,
        y: safeGeo.y + 0.35,
        w: safeGeo.w,
        h: Math.max(0, safeGeo.h - 0.35),
        ...TOKENS.textStyles.body,
        wrap: TEXT_BOX.wrap,
        margin: TEXT_BOX.marginPt,
        valign: 'top',
      });
    } else {
      slide.addText(toBodyRuns(col.body, effectiveBodyStyle), {
        x: safeGeo.x,
        y: safeGeo.y,
        w: safeGeo.w,
        h: safeGeo.h,
        ...TOKENS.textStyles.body,
        wrap: TEXT_BOX.wrap,
        margin: TEXT_BOX.marginPt,
        valign: 'top',
      });
    }
  }

  return slide;
}
