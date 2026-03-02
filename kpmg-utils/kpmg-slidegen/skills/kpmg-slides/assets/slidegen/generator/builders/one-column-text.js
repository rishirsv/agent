import { addTitle } from '../helpers/title.js';
import { normalizeBodyStyle } from '../helpers/layout.js';
import { renderCallouts } from '../helpers/callouts.js';
import {
  resolveBodyTextStyle,
  resolveSourceTextStyle,
  resolveStraplineTextStyle,
  resolveTheme,
} from '../helpers/theme.js';
import { addBodyBlock, addFootnoteBlock, addStraplineBlock } from '../helpers/slide-components.js';
import {
  computeOneColumnLayoutGeometry,
  ONE_COLUMN_LAYOUT_DEFAULTS,
} from '../helpers/one-column-layout.js';

const TOKENS = {
  geometry: ONE_COLUMN_LAYOUT_DEFAULTS.geometry,
};

function resolveTextStyles(theme = null) {
  const resolvedTheme = resolveTheme(theme);
  return {
    strapline: resolveStraplineTextStyle(resolvedTheme),
    body: resolveBodyTextStyle(resolvedTheme),
    source: resolveSourceTextStyle(resolvedTheme),
    typeSizes: resolvedTheme.typeSizes,
  };
}

export function addOneColumnText(pptx, slideSpec = {}, ctx = {}) {
  const { title, strapline, body, source, callouts, bodyStyle } = slideSpec;
  const { geometry, masterName, footerSafeTopByMaster, theme } = ctx;
  const textStyles = resolveTextStyles(theme);
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const {
    geometry: g,
    strapText,
    sourceText,
    strapGeo,
    safeBodyGeo,
    calloutBoxes,
    callouts: resolvedCallouts,
    sourceGeo,
  } = computeOneColumnLayoutGeometry({
    geometry,
    masterName,
    footerSafeTopByMaster,
    strapline,
    source,
    callouts,
    straplineFontSize: textStyles.typeSizes.strapline,
    sourceFontSize: textStyles.typeSizes.source,
  });
  const effectiveBodyStyle = normalizeBodyStyle(bodyStyle);

  addTitle(slide, title, g.title || TOKENS.geometry.title, { theme });
  addStraplineBlock(slide, strapText, strapGeo, { theme, style: textStyles.strapline });
  addBodyBlock(slide, body, safeBodyGeo, { theme, bodyStyle: effectiveBodyStyle, style: textStyles.body });
  renderCallouts(pptx, slide, {
    callouts: resolvedCallouts,
    boxes: calloutBoxes,
    slideType: 'oneColumnText',
    textBox: safeBodyGeo,
    theme,
  });
  if (sourceText) {
    addFootnoteBlock(slide, {
      lines: [sourceText],
      box: sourceGeo,
      theme,
      minHeight: sourceGeo?.h,
      maxHeight: sourceGeo?.h,
      style: textStyles.source,
    });
  }

  return slide;
}
