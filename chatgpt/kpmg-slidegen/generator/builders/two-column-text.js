import { FONTS, COLORS, TYPE_SIZES, TEXT_BOX } from '../tokens.js';
import { toBodyRuns } from '../helpers/bullets.js';
import { addTitle } from '../helpers/title.js';
import { isValidColumnGeometry } from '../helpers/geometry.js';
import { computeDynamicStraplineBox, sanitizeText } from '../helpers/text.js';
import { recordFallback } from '../runtime/diagnostics.js';
import {
  clampToMasterFooter,
  computeStrapShift,
  normalizeBodyStyle,
  shiftBox,
} from '../helpers/layout.js';
import fs from 'node:fs';
import { normalizeImageSource } from '../helpers/media.js';
import { svgToDataUri } from '../helpers/svg.js';

export const TOKENS = {
  geometry: {
    title: { x: 1.0919, y: 0.4722, w: 11.1596, h: 0.5833 },
    strapline: { x: 1.0919, y: 1.2899, w: 11.1596, h: 0.5276 },
    left: { x: 1.0919, y: 1.2899, w: 5.7, h: 5.9101 },
    right: { x: 7.0415, y: 1.2899, w: 5.2, h: 5.9101 },
  },
  textStyles: {
    body: {
      fontFace: FONTS.body,
      fontSize: TYPE_SIZES.body,
      color: COLORS.black,
      align: 'left',
      valign: 'top',
      paraSpaceAfter: 6,
    },
  },
};

function addIconChip(pptx, slide, iconPath, geo) {
  if (!iconPath) return;

  const rawSize = Math.min(Number(geo?.w ?? 0.62), Number(geo?.h ?? 0.62));
  const size = Number.isFinite(rawSize) ? Math.min(1.0, Math.max(0.2, rawSize)) : 0.62;
  const chipX = geo.x + geo.w - size;
  const chipY = geo.y;

  const resolvedIcon =
    typeof iconPath === 'string' && iconPath.toLowerCase().endsWith('.svg') && fs.existsSync(iconPath)
      ? svgToDataUri(fs.readFileSync(iconPath, 'utf8'))
      : iconPath;

  const pad = Math.max(0.02, size * 0.06);
  slide.addImage({
    ...normalizeImageSource(resolvedIcon),
    x: chipX + pad,
    y: chipY + pad,
    w: size - pad * 2,
    h: size - pad * 2,
    sizing: { type: 'contain', w: size - pad * 2, h: size - pad * 2 },
    altText: 'GPT icon',
  });
}

export function addTwoColumnTextWithStrapline(
  pptx,
  { title, strapline, leftBody, rightBody, bodyStyle, geometry, masterName, icon, iconPlacement, style } = {},
) {
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const candidate = geometry || TOKENS.geometry;
  const useExtracted = isValidColumnGeometry([candidate.left, candidate.right], 2);
  const g = useExtracted ? candidate : TOKENS.geometry;
  if (!useExtracted && geometry) {
    recordFallback('twoColumnTextWithStrapline', 'invalid_extracted_columns', {
      left: candidate.left,
      right: candidate.right,
    });
  }

  const titleGeo = g.title || TOKENS.geometry.title;
  const iconMode = iconPlacement || 'rightColumn';
  const iconInTitle = icon && (iconMode === 'titleLeft' || iconMode === 'titleRight');
  const strapText = strapline;
  const effectiveBodyStyle = normalizeBodyStyle(bodyStyle);
  const requestedIconSize = style?.iconSize === undefined ? null : Number(style.iconSize);
  const iconSize = Number.isFinite(requestedIconSize)
    ? Math.min(0.75, Math.max(0.4, requestedIconSize))
    : 0.52;
  const iconPad = 0.16;

  const adjustedTitleGeo = iconInTitle
    ? {
        ...titleGeo,
        x: iconMode === 'titleLeft' ? titleGeo.x + iconSize + iconPad : titleGeo.x,
        w: titleGeo.w - (iconSize + iconPad),
      }
    : titleGeo;

  if (iconInTitle && iconMode === 'titleLeft') {
    addIconChip(pptx, slide, icon, { x: titleGeo.x, y: titleGeo.y + 0.06, w: iconSize, h: iconSize });
  }
  if (iconInTitle && iconMode === 'titleRight') {
    addIconChip(pptx, slide, icon, { x: titleGeo.x + titleGeo.w - iconSize, y: titleGeo.y + 0.06, w: iconSize, h: iconSize });
  }

  let strapBox = null;
  addTitle(slide, title, adjustedTitleGeo);
  if (strapText) {
    const strapBase = g.strapline || TOKENS.geometry.strapline || {
      x: titleGeo.x,
      y: TOKENS.geometry.title.y + TOKENS.geometry.title.h + 0.05,
      w: titleGeo.w,
      h: TOKENS.geometry.strapline.h,
    };
    strapBox = computeDynamicStraplineBox({
      strapline: strapText,
      titleGeo,
      strapBase,
      defaultStrapGeo: TOKENS.geometry.strapline,
      fontSize: style?.straplineFontSize ?? TYPE_SIZES.strapline,
    });
    slide.addText(sanitizeText(strapText), {
      ...strapBox,
      fontFace: FONTS.body,
      fontSize: style?.straplineFontSize ?? TYPE_SIZES.strapline,
      color: COLORS.kpmgPurple,
      italic: true,
      bold: true,
      wrap: TEXT_BOX.wrap,
      margin: TEXT_BOX.marginPt,
      valign: 'top',
    });
  }

  const leftBase = g.left || TOKENS.geometry.left;
  const rightBase = g.right || TOKENS.geometry.right;
  const shift = computeStrapShift(strapBox, Math.min(leftBase.y, rightBase.y));
  const leftGeo = shiftBox(leftBase, shift);
  const rightGeo = shiftBox(rightBase, shift);
  const safeLeftGeo = clampToMasterFooter(leftGeo, masterName);
  const safeRightGeo = clampToMasterFooter(rightGeo, masterName);

  const bodyTextStyle = { ...TOKENS.textStyles.body, fontSize: style?.bodyFontSize ?? TOKENS.textStyles.body.fontSize };
  slide.addText(toBodyRuns(leftBody, effectiveBodyStyle), {
    ...safeLeftGeo,
    ...bodyTextStyle,
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
    valign: 'top',
  });

  // Optional enhancement: `icon` adds an icon chip at the top-right of the right column.
  const iconInRightColumn = Boolean(icon) && !iconInTitle;
  if (iconInRightColumn) addIconChip(pptx, slide, icon, safeRightGeo);
  slide.addText(toBodyRuns(rightBody, effectiveBodyStyle), {
    ...safeRightGeo,
    ...bodyTextStyle,
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
    valign: 'top',
  });

  return slide;
}
