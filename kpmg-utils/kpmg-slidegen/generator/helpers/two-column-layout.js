import { computeDynamicStraplineBox } from './text.js';
import { clampToMasterFooter, computeStrapShift, shiftBox } from './layout.js';

export const TWO_COLUMN_LAYOUT_DEFAULTS = Object.freeze({
  geometry: {
    title: { x: 1.0919, y: 0.4722, w: 11.1596, h: 0.5833 },
    strapline: { x: 1.0919, y: 1.2899, w: 11.1596, h: 0.5276 },
    left: { x: 1.0919, y: 1.2899, w: 5.7, h: 5.9101 },
    right: { x: 7.0415, y: 1.2899, w: 5.2, h: 5.9101 },
  },
  typography: {
    straplineFontSize: 10,
  },
});

export function computeTwoColumnLayoutGeometry({
  geometry,
  masterName = 'KPMG_WHITE',
  footerSafeTopByMaster = null,
  strapline,
  straplineFontSize,
} = {}) {
  const g = geometry || TWO_COLUMN_LAYOUT_DEFAULTS.geometry;
  const resolvedStraplineSize = Number.isFinite(straplineFontSize)
    ? Number(straplineFontSize)
    : TWO_COLUMN_LAYOUT_DEFAULTS.typography.straplineFontSize;
  const titleGeo = g.title || TWO_COLUMN_LAYOUT_DEFAULTS.geometry.title;
  const strapText = strapline;
  const strapBase = g.strapline || TWO_COLUMN_LAYOUT_DEFAULTS.geometry.strapline;
  const leftBase = g.left || TWO_COLUMN_LAYOUT_DEFAULTS.geometry.left;
  const rightBase = g.right || TWO_COLUMN_LAYOUT_DEFAULTS.geometry.right;

  const strapBox = strapText
    ? computeDynamicStraplineBox({
        strapline: strapText,
        titleGeo,
        strapBase,
        defaultStrapGeo: TWO_COLUMN_LAYOUT_DEFAULTS.geometry.strapline,
        fontSize: resolvedStraplineSize,
      })
    : null;
  const shift = computeStrapShift(strapBox, Math.min(leftBase.y, rightBase.y));
  const leftGeo = shiftBox(leftBase, shift);
  const rightGeo = shiftBox(rightBase, shift);
  const safeLeftGeo = clampToMasterFooter(leftGeo, masterName, 0, footerSafeTopByMaster);
  const safeRightGeo = clampToMasterFooter(rightGeo, masterName, 0, footerSafeTopByMaster);

  return {
    geometry: g,
    strapText,
    strapBox,
    leftGeo,
    rightGeo,
    safeLeftGeo,
    safeRightGeo,
  };
}
