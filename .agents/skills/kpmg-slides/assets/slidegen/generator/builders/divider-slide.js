import path from 'node:path';
import { FONTS, COLORS, TEXT_BOX } from '../tokens.js';
import { normalizeImageSource } from '../helpers/media.js';
import { sanitizeText } from '../helpers/text.js';
import { resolveTemplateAssetsDir } from '../runtime/template-roots.js';

function addImageSmart(slide, asset, opts) {
  slide.addImage({ ...normalizeImageSource(asset), ...opts });
}

export const TOKENS = {
  geometry: {
    gradient: { x: 1.0919466, y: 1.0674245, w: 7.7228631, h: 5.3645833 },
    number: { x: 1.25, y: 1.2, w: 2.6, h: 1.2 },
    title: { x: 1.25, y: 2.6, w: 7.0, h: 2.0 },
  },
  textStyles: {
    sectionNumber: {
      fontFace: FONTS.heading,
      fontSize: 48,
      color: COLORS.white,
      bold: true,
      align: 'left',
      valign: 'top',
    },
    sectionTitle: {
      fontFace: FONTS.heading,
      fontSize: 24,
      color: COLORS.white,
      bold: true,
      align: 'left',
      valign: 'top',
    },
  },
};

const TEMPLATE_ASSETS_DIR = resolveTemplateAssetsDir('kpmg-diligence');
const DEFAULT_ASSETS = {
  gradientDivider: path.join(TEMPLATE_ASSETS_DIR, 'gradient_divider_window_300dpi.png'),
};

export function addDivider(
  pptx,
  { sectionNumber, sectionTitle, assets, geometry, masterName, textStyles } = {},
) {
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();

  const gradientDivider = assets?.gradientDivider ?? DEFAULT_ASSETS.gradientDivider;
  const g = geometry || TOKENS.geometry;

  // Prefer masters for the divider gradient window.
  if (!masterName) {
    addImageSmart(slide, gradientDivider, {
      ...(g.gradient || TOKENS.geometry.gradient),
      altText: 'Decorative gradient',
    });
  }

  slide.addText(sectionNumber ?? '', {
    ...(g.number || TOKENS.geometry.number),
    ...TOKENS.textStyles.sectionNumber,
    ...(textStyles?.sectionNumber || {}),
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
  });

  // Strip embedded newlines from section titles to prevent awkward mid-phrase wrapping.
  // JSON specs often include \n in titles from the migrator; let the text box reflow naturally.
  const cleanTitle = sanitizeText(sectionTitle ?? '');
  slide.addText(cleanTitle, {
    ...(g.title || TOKENS.geometry.title),
    ...TOKENS.textStyles.sectionTitle,
    ...(textStyles?.sectionTitle || {}),
    wrap: true,
    margin: TEXT_BOX.marginPt,
  });

  return slide;
}
