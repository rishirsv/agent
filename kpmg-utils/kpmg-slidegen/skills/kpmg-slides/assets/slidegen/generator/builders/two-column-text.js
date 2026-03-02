import { addTitle } from '../helpers/title.js';
import { isValidColumnGeometry } from '../helpers/geometry.js';
import { sanitizeText } from '../helpers/text.js';
import { recordFallback } from '../runtime/diagnostics.js';
import { normalizeBodyStyle } from '../helpers/layout.js';
import { resolveBodyTextStyle, resolveStraplineTextStyle, resolveTheme } from '../helpers/theme.js';
import {
  computeTwoColumnLayoutGeometry,
  TWO_COLUMN_LAYOUT_DEFAULTS,
} from '../helpers/two-column-layout.js';
import { addBodyBlock, addStraplineBlock } from '../helpers/slide-components.js';
import fs from 'node:fs';
import { normalizeImageSource } from '../helpers/media.js';
import { svgToDataUri } from '../helpers/svg.js';

export const TOKENS = {
  geometry: TWO_COLUMN_LAYOUT_DEFAULTS.geometry,
};

function resolveTextStyles(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  return {
    body: {
      ...resolveBodyTextStyle(resolvedTheme),
      align: 'left',
      valign: 'top',
    },
    strapline: resolveStraplineTextStyle(resolvedTheme),
    typeSizes: resolvedTheme.typeSizes,
  };
}

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
  slideSpec = {},
  ctx = {},
) {
  const { title, strapline, leftBody, rightBody, bodyStyle, icon, iconPlacement, style } = slideSpec;
  const { geometry, masterName, footerSafeTopByMaster, theme } = ctx;
  const textStyles = resolveTextStyles(theme);
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
  addTitle(slide, title, adjustedTitleGeo, { theme });
  const layoutGeo = computeTwoColumnLayoutGeometry({
    geometry: g,
    masterName,
    footerSafeTopByMaster,
    strapline: strapText,
    straplineFontSize: style?.straplineFontSize ?? textStyles.typeSizes.strapline,
  });
  strapBox = layoutGeo.strapBox;
  if (strapText && strapBox) {
    addStraplineBlock(slide, sanitizeText(strapText), strapBox, {
      theme,
      style: {
        ...textStyles.strapline,
        fontSize: style?.straplineFontSize ?? textStyles.strapline.fontSize,
      },
    });
  }
  const { safeLeftGeo, safeRightGeo } = layoutGeo;

  const bodyTextStyle = { ...textStyles.body, fontSize: style?.bodyFontSize ?? textStyles.body.fontSize };
  addBodyBlock(slide, leftBody, safeLeftGeo, { theme, bodyStyle: effectiveBodyStyle, style: bodyTextStyle });

  // Optional enhancement: `icon` adds an icon chip at the top-right of the right column.
  const iconInRightColumn = Boolean(icon) && !iconInTitle;
  if (iconInRightColumn) addIconChip(pptx, slide, icon, safeRightGeo);
  addBodyBlock(slide, rightBody, safeRightGeo, { theme, bodyStyle: effectiveBodyStyle, style: bodyTextStyle });

  return slide;
}
