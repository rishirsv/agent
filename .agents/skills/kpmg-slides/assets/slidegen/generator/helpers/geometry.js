/**
 * generator/helpers/geometry.js — Geometry credibility checks
 */

/**
 * Check if an array of boxes has enough distinct x positions.
 * @param {Array<{x:number}>} boxes
 * @param {number} [minDistinct=2]
 * @returns {boolean}
 */
export function hasDistinctXPositions(boxes, minDistinct = 2) {
  if (!Array.isArray(boxes) || boxes.length === 0) return false;
  const rounded = boxes.map((b) => Math.round((b?.x ?? 0) * 10));
  const distinct = new Set(rounded);
  return distinct.size >= minDistinct;
}

/**
 * Decide whether extracted geometry looks credible for a column layout.
 * @param {Array<{x:number}>} boxes
 * @param {number} [minDistinct=2]
 * @returns {boolean}
 */
export function isValidColumnGeometry(boxes, minDistinct = 2) {
  if (!Array.isArray(boxes) || boxes.length < minDistinct) return false;
  return hasDistinctXPositions(boxes, minDistinct);
}

/**
 * Clamp a box height so it does not cross a bottom boundary.
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {number} bottom
 * @returns {{x:number,y:number,w:number,h:number}}
 */
export function clampBoxToBottom(box, bottom) {
  if (!box) return box;
  const maxH = Math.max(0, bottom - box.y);
  if (box.h <= maxH) return box;
  return { ...box, h: maxH };
}
