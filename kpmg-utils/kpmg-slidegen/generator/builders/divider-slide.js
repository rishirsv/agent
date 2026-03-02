import path from 'node:path';
import { addImageSmart } from '../helpers/media.js';
import { sanitizeText } from '../helpers/text.js';
import {
  THEME_COMPONENT_KEYS,
  resolveTextBoxOptions,
  resolveTheme,
  resolveTokenTextStyle,
} from '../helpers/theme.js';
import { resolveTemplateAssetsDir } from '../runtime/template-roots.js';

export const TOKENS = {
  geometry: {
    gradient: { x: 1.0919466, y: 1.0674245, w: 7.7228631, h: 5.3645833 },
    number: { x: 1.25, y: 1.2, w: 2.6, h: 1.2 },
    title: { x: 1.25, y: 2.6, w: 7.0, h: 2.0 },
  },
};

function resolveTextStyles(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  const componentTokens = resolvedTheme.components?.[THEME_COMPONENT_KEYS.dividerSlide] || {};
  const fontSizes = componentTokens.fontSizes || {};
  const sectionNumber = resolveTokenTextStyle(resolvedTheme, 'sectionNumber', {
    fontFace: resolvedTheme.fonts.heading,
    fontSize: Number(fontSizes.sectionNumber || resolvedTheme.typeSizes.title),
    color: resolvedTheme.colors.white,
    bold: true,
  });
  return {
    sectionNumber: {
      ...sectionNumber,
      align: 'left',
      valign: 'top',
    },
    sectionTitle: {
      fontFace: resolvedTheme.fonts.heading,
      fontSize: Number(fontSizes.sectionTitle || resolvedTheme.typeSizes.h2),
      color: resolvedTheme.colors.white,
      bold: true,
      align: 'left',
      valign: 'top',
    },
  };
}

const TEMPLATE_ASSETS_DIR = resolveTemplateAssetsDir('kpmg-diligence');
const DEFAULT_ASSETS = {
  gradientDivider: path.join(TEMPLATE_ASSETS_DIR, 'gradient_divider_window_300dpi.png'),
};

export function addDivider(
  pptx,
  slideSpec = {},
  ctx = {},
) {
  const { sectionNumber, sectionTitle } = slideSpec;
  const { assets, geometry, masterName, textStyles, theme } = ctx;
  const resolvedStyles = resolveTextStyles(theme);
  const textBox = resolveTextBoxOptions(theme);
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
    ...resolvedStyles.sectionNumber,
    ...(textStyles?.sectionNumber || {}),
    ...textBox,
  });

  // Strip embedded newlines from section titles to prevent awkward mid-phrase wrapping.
  // JSON specs often include \n in titles from the migrator; let the text box reflow naturally.
  const cleanTitle = sanitizeText(sectionTitle ?? '');
  slide.addText(cleanTitle, {
    ...(g.title || TOKENS.geometry.title),
    ...resolvedStyles.sectionTitle,
    ...(textStyles?.sectionTitle || {}),
    wrap: true,
    margin: textBox.margin,
  });

  return slide;
}
