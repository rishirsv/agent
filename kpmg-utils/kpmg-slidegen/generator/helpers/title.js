/**
 * generator/helpers/title.js — Shared slide title helper
 */

import { calcTextBoxHeight, sanitizeText } from './text.js';
import { resolveTextBoxOptions, resolveTheme, resolveTokenTextStyle } from './theme.js';

/**
 * Render a slide title.
 *
 * @param {object} slide - PptxGenJS slide instance
 * @param {string} titleText - The title string
 * @param {object} geo - { x, y, w, h } geometry for the title text box
 * @param {object} [options] - Optional `{ theme, styleOverrides }`
 */
export function addTitle(slide, titleText, geo, options = {}) {
  if (!titleText) return;
  const { theme = null, styleOverrides = {} } = options;
  const resolvedTheme = resolveTheme(theme);
  const textBox = resolveTextBoxOptions(resolvedTheme);
  const titleStyle = resolveTokenTextStyle(resolvedTheme, 'slideTitle', {
    fontFace: resolvedTheme.fonts.heading,
    fontSize: resolvedTheme.typeSizes.slideTitle,
    color: resolvedTheme.colors.kpmgBlue,
    bold: true,
  });
  const cleanTitle = sanitizeText(titleText);
  const baseGeo = geo || { x: 0, y: 0, w: 10, h: calcTextBoxHeight(titleStyle.fontSize, 1) };
  const safeGeo = baseGeo.h ? baseGeo : { ...baseGeo, h: calcTextBoxHeight(titleStyle.fontSize, 1) };

  slide.addText(cleanTitle, {
    ...safeGeo,
    ...titleStyle,
    valign: 'top',
    ...textBox,
    ...styleOverrides,
  });
}
