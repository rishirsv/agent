import { computeDynamicStraplineBox, sanitizeText } from './text.js';
import { resolveCalloutLayout } from './callouts.js';
import {
  clampToMasterFooter,
  computeStrapShift,
  estimateSourceTextHeight,
  footerSafeTopForMaster,
  sourceFootprintBelow,
  shiftBox,
} from './layout.js';

export const ONE_COLUMN_LAYOUT_DEFAULTS = Object.freeze({
  geometry: {
    title: { x: 1.0919, y: 0.4722, w: 11.1596, h: 0.5833 },
    strapline: { x: 1.0919, y: 1.2899, w: 11.1596, h: 0.5276 },
    body: { x: 1.0919, y: 1.2899, w: 11.1596, h: 5.9101 },
    source: { x: 1.0919, y: 6.62, w: 11.1596, h: 0.2 },
  },
  sourceLayout: {
    topOffset: 0.03,
    minHeight: 0.2,
    maxHeight: 0.44,
  },
  typography: {
    straplineFontSize: 10,
    sourceFontSize: 6,
  },
});

export function computeOneColumnLayoutGeometry({
  geometry,
  masterName = 'KPMG_WHITE',
  footerSafeTopByMaster = null,
  strapline,
  source,
  callouts = [],
  straplineFontSize,
  sourceFontSize,
} = {}) {
  const g = geometry || ONE_COLUMN_LAYOUT_DEFAULTS.geometry;
  const typography = ONE_COLUMN_LAYOUT_DEFAULTS.typography;
  const resolvedStraplineSize = Number.isFinite(straplineFontSize)
    ? Number(straplineFontSize)
    : typography.straplineFontSize;
  const resolvedSourceSize = Number.isFinite(sourceFontSize)
    ? Number(sourceFontSize)
    : typography.sourceFontSize;
  const strapText = strapline;
  const sourceText = sanitizeText(source);

  let strapGeo = null;
  if (strapText) {
    const titleGeo = g.title || ONE_COLUMN_LAYOUT_DEFAULTS.geometry.title;
    const strapBase = g.strapline || ONE_COLUMN_LAYOUT_DEFAULTS.geometry.strapline;
    strapGeo = computeDynamicStraplineBox({
      strapline: strapText,
        titleGeo,
        strapBase,
        defaultStrapGeo: ONE_COLUMN_LAYOUT_DEFAULTS.geometry.strapline,
        fontSize: resolvedStraplineSize,
      });
  }

  const bodyBase = g.body || ONE_COLUMN_LAYOUT_DEFAULTS.geometry.body;
  const shift = computeStrapShift(strapGeo, bodyBase.y);
  const bodyGeo = shiftBox(bodyBase, shift);
  const sourcePad = sourceText
    ? sourceFootprintBelow(bodyGeo, sourceText, {
        ...ONE_COLUMN_LAYOUT_DEFAULTS.sourceLayout,
        fontSize: resolvedSourceSize,
      })
    : 0;
  const safeBodyGeoBase = clampToMasterFooter(bodyGeo, masterName, sourcePad, footerSafeTopByMaster);
  const calloutLayout = resolveCalloutLayout({
    slideType: 'oneColumnText',
    callouts,
    textBox: safeBodyGeoBase,
    preferredBoxes: g.calloutBoxes,
  });
  let safeBodyGeo = calloutLayout.adjustedTextBox || safeBodyGeoBase;
  if (sourceText) {
    const effectiveSourcePad = sourceFootprintBelow(safeBodyGeo, sourceText, {
      ...ONE_COLUMN_LAYOUT_DEFAULTS.sourceLayout,
      fontSize: resolvedSourceSize,
    });
    safeBodyGeo = clampToMasterFooter(safeBodyGeo, masterName, effectiveSourcePad, footerSafeTopByMaster);
  }

  let sourceGeo = null;
  if (sourceText) {
    const sourceHeight = estimateSourceTextHeight(sourceText, safeBodyGeo.w, {
      ...ONE_COLUMN_LAYOUT_DEFAULTS.sourceLayout,
      fontSize: resolvedSourceSize,
    });
    const safeTop = footerSafeTopForMaster(masterName, footerSafeTopByMaster);
    sourceGeo =
      g.source ||
      (safeTop
        ? {
            ...ONE_COLUMN_LAYOUT_DEFAULTS.geometry.source,
            x: safeBodyGeo.x,
            w: safeBodyGeo.w,
            y: safeTop - sourceHeight,
            h: sourceHeight,
          }
        : {
            ...ONE_COLUMN_LAYOUT_DEFAULTS.geometry.source,
            x: safeBodyGeo.x,
            w: safeBodyGeo.w,
            y: safeBodyGeo.y + ONE_COLUMN_LAYOUT_DEFAULTS.sourceLayout.topOffset,
            h: sourceHeight,
          });
  }

  return {
    geometry: g,
    strapText,
    sourceText,
    strapGeo,
    bodyGeo,
    safeBodyGeo,
    callouts: calloutLayout.callouts,
    calloutBoxes: calloutLayout.calloutBoxes,
    sourceGeo,
  };
}
