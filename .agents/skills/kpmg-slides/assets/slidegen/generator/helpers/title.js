/**
 * generator/helpers/title.js — Shared slide title helper
 */

import { FONTS, COLORS, TYPE_SIZES, TEXT_BOX } from '../tokens.js';
import { calcTextBoxHeight, sanitizeText } from './text.js';

/**
 * Render a slide title.
 *
 * @param {object} slide - PptxGenJS slide instance
 * @param {string} titleText - The title string
 * @param {object} geo - { x, y, w, h } geometry for the title text box
 * @param {object} [styleOverrides] - Optional style overrides for the title text
 */
export function addTitle(slide, titleText, geo, styleOverrides = {}) {
  if (!titleText) return;
  const cleanTitle = sanitizeText(titleText);
  const baseGeo = geo || { x: 0, y: 0, w: 10, h: calcTextBoxHeight(TYPE_SIZES.slideTitle, 1) };
  const safeGeo = baseGeo.h ? baseGeo : { ...baseGeo, h: calcTextBoxHeight(TYPE_SIZES.slideTitle, 1) };

  slide.addText(cleanTitle, {
    ...safeGeo,
    fontFace: FONTS.heading,
    fontSize: TYPE_SIZES.slideTitle,
    color: COLORS.kpmgBlue,
    bold: true,
    valign: 'top',
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
    ...styleOverrides,
  });
}
