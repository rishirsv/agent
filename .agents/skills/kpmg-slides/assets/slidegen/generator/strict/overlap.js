import fs from 'node:fs';
import path from 'node:path';

const TEXT_OVERLAP_ERROR_THRESHOLD = 0.1;
const RECTIFY_DIRECTION_EQUALITY_TOLERANCE = 0.15;

/**
 * Infer a coarse element type from a PptxGenJS slide object.
 * @param {object} obj
 * @returns {string}
 */
export function inferElementType(obj) {
  if (!obj) return 'unknown';
  const data = obj.data || obj.options || {};
  if (obj.type === 'line') return 'line';
  if (obj.type && typeof obj.type === 'string') return obj.type;
  if (obj.text || typeof data.text === 'string') return 'text';
  if (data.path || obj.image) return 'image';
  if (data.chartType) return 'chart';
  if (data.shape || data.line) return 'shape';
  if (data.mediaType) return 'media';
  if (data.table || Array.isArray(data.rows)) return 'table';
  if (data.smartArt) return 'smartart';
  return 'unknown';
}

/**
 * Compare positions of two elements on a slide.
 * @param {object} slide
 * @param {number} firstIndex
 * @param {number} secondIndex
 * @returns {object}
 */
export function compareElementPosition(slide, firstIndex, secondIndex) {
  if (!slide || !Array.isArray(slide._slideObjects)) {
    throw new Error('Invalid slide object passed to compareElementPosition()');
  }
  if (!Number.isInteger(firstIndex) || !Number.isInteger(secondIndex)) {
    throw new Error('Element indices must be integer values.');
  }
  const elements = slide._slideObjects;
  if (
    firstIndex < 0 ||
    firstIndex >= elements.length ||
    secondIndex < 0 ||
    secondIndex >= elements.length
  ) {
    throw new Error('Element index out of bounds for compareElementPosition().');
  }

  // Resolve bounds for the pair.
  const EPS = 1e-4;
  const getBounds = (obj) => {
    const source = obj?.data || obj?.options || {};
    let x = typeof source.x === 'number' ? source.x : 0;
    let y = typeof source.y === 'number' ? source.y : 0;
    let w = typeof source.w === 'number' ? source.w : 0;
    let h = typeof source.h === 'number' ? source.h : 0;
    if (source.sizing && source.sizing.type === 'crop') {
      if (typeof source.sizing.w === 'number') w = source.sizing.w;
      if (typeof source.sizing.h === 'number') h = source.sizing.h;
    }
    return { x, y, w, h, x2: x + w, y2: y + h };
  };

  const boundsA = getBounds(elements[firstIndex]);
  const boundsB = getBounds(elements[secondIndex]);
  const separated =
    boundsA.x2 < boundsB.x - EPS ||
    boundsB.x2 < boundsA.x - EPS ||
    boundsA.y2 < boundsB.y - EPS ||
    boundsB.y2 < boundsA.y - EPS;
  if (separated) {
    return {
      relation: 'disjoint',
      containerIndex: null,
      containedIndex: null,
      aBounds: boundsA,
      bBounds: boundsB,
      intersection: null,
    };
  }

  const aContainsB =
    boundsA.x <= boundsB.x + EPS &&
    boundsA.y <= boundsB.y + EPS &&
    boundsA.x2 >= boundsB.x2 - EPS &&
    boundsA.y2 >= boundsB.y2 - EPS;
  const bContainsA =
    boundsB.x <= boundsA.x + EPS &&
    boundsB.y <= boundsA.y + EPS &&
    boundsB.x2 >= boundsA.x2 - EPS &&
    boundsB.y2 >= boundsA.y2 - EPS;

  const ix1 = Math.max(boundsA.x, boundsB.x);
  const iy1 = Math.max(boundsA.y, boundsB.y);
  const ix2 = Math.min(boundsA.x2, boundsB.x2);
  const iy2 = Math.min(boundsA.y2, boundsB.y2);
  const intersectionWidth = Math.max(0, ix2 - ix1);
  const intersectionHeight = Math.max(0, iy2 - iy1);
  const intersection =
    intersectionWidth > EPS && intersectionHeight > EPS
      ? { x: ix1, y: iy1, w: intersectionWidth, h: intersectionHeight }
      : null;

  if (aContainsB && !bContainsA) {
    return {
      relation: 'contained',
      containerIndex: firstIndex,
      containedIndex: secondIndex,
      aBounds: boundsA,
      bBounds: boundsB,
      intersection,
    };
  }
  if (bContainsA && !aContainsB) {
    return {
      relation: 'contained',
      containerIndex: secondIndex,
      containedIndex: firstIndex,
      aBounds: boundsA,
      bBounds: boundsB,
      intersection,
    };
  }
  if (intersection) {
    return {
      relation: 'overlapping',
      containerIndex: null,
      containedIndex: null,
      aBounds: boundsA,
      bBounds: boundsB,
      intersection,
    };
  }
  return {
    relation: 'touching',
    containerIndex: null,
    containedIndex: null,
    aBounds: boundsA,
    bBounds: boundsB,
    intersection: null,
  };
}

/**
 * Inspect a slide for overlap issues.
 * @param {object} slide
 * @param {object} pptx
 * @param {object} options
 * @returns {object}
 */
export function analyzeSlideOverlaps(slide, pptx, options = {}) {
  if (!slide || !Array.isArray(slide._slideObjects)) {
    return { overlaps: [], containment: [], severeCount: 0, warningCount: 0 };
  }
  const opts = {
    muteContainment: options.muteContainment !== undefined ? options.muteContainment : true,
    ignoreLines: options.ignoreLines !== undefined ? options.ignoreLines : false,
    ignoreDecorativeShapes:
      options.ignoreDecorativeShapes !== undefined ? options.ignoreDecorativeShapes : false,
  };

  const slideIndex = Array.isArray(pptx?._slides) ? pptx._slides.indexOf(slide) : -1;
  const slideLabel = slideIndex >= 0 ? `Slide ${slideIndex + 1}` : '(Unknown slide index)';

  const elements = slide._slideObjects.map((obj, i) => {
    const { x = 0, y = 0, w = 0, h = 0, fill, line } = obj.data || obj.options || {};
    const type = inferElementType(obj);
    const isDecorative = (() => {
      if (!opts.ignoreDecorativeShapes) return false;
      const transparency = typeof fill?.transparency === 'number' ? fill.transparency : null;
      const hasOnlyBorder = !!line && (!fill || transparency !== null);
      const fullyTransparent = transparency !== null && transparency >= 99;
      return type === 'shape' && hasOnlyBorder && fullyTransparent;
    })();
    const ignorable = (opts.ignoreLines && type === 'line') || isDecorative;
    return { index: i, type, x, y, w, h, ignorable };
  });

  const overlaps = [];
  const containment = [];
  let severeCount = 0;
  let warningCount = 0;

  // Compare each pair for overlaps and containments.
  for (let i = 0; i < elements.length; i++) {
    const a = elements[i];
    if (a.ignorable) continue;
    for (let j = i + 1; j < elements.length; j++) {
      const b = elements[j];
      if (b.ignorable) continue;
      const comparison = compareElementPosition(slide, a.index, b.index);
      if (comparison.relation === 'overlapping') {
        const EPS = 1e-6;
        const lineRectFalsePositive = (() => {
          const oneIsLine = (a.type === 'line') ^ (b.type === 'line');
          if (!oneIsLine) return false;
          const line = a.type === 'line' ? a : b;
          const rect = a.type === 'line' ? b : a;
          const isDiagonal = line.w > EPS && line.h > EPS;
          const lineSeg = { x1: line.x, y1: line.y, x2: line.x + line.w, y2: line.y + line.h };
          const rectB = { x: rect.x, y: rect.y, x2: rect.x + rect.w, y2: rect.y + rect.h };
          const pointInRect = (px, py, rb) =>
            px >= rb.x - EPS && px <= rb.x2 + EPS && py >= rb.y - EPS && py <= rb.y2 + EPS;
          const segsIntersect = (p1, p2, q1, q2) => {
            const cross = (ax, ay, bx, by) => ax * by - ay * bx;
            const d1x = p2.x - p1.x;
            const d1y = p2.y - p1.y;
            const d2x = q2.x - q1.x;
            const d2y = q2.y - q1.y;
            const denom = cross(d1x, d1y, d2x, d2y);
            if (Math.abs(denom) < EPS) {
              const crossCol = cross(q1.x - p1.x, q1.y - p1.y, d1x, d1y);
              if (Math.abs(crossCol) > EPS) return false;
              const overlapX = !(Math.max(p1.x, p2.x) < Math.min(q1.x, q2.x) - EPS || Math.max(q1.x, q2.x) < Math.min(p1.x, p2.x) - EPS);
              const overlapY = !(Math.max(p1.y, p2.y) < Math.min(q1.y, q2.y) - EPS || Math.max(q1.y, q2.y) < Math.min(p1.y, p2.y) - EPS);
              return overlapX && overlapY;
            }
            const t = cross(q1.x - p1.x, q1.y - p1.y, d2x, d2y) / denom;
            const u = cross(q1.x - p1.x, q1.y - p1.y, d1x, d1y) / denom;
            return t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS;
          };
          const intersectsRect = (seg, rb) => {
            if (pointInRect(seg.x1, seg.y1, rb) || pointInRect(seg.x2, seg.y2, rb)) return true;
            const r1 = { x: rb.x, y: rb.y };
            const r2 = { x: rb.x2, y: rb.y };
            const r3 = { x: rb.x2, y: rb.y2 };
            const r4 = { x: rb.x, y: rb.y2 };
            const p1 = { x: seg.x1, y: seg.y1 };
            const p2 = { x: seg.x2, y: seg.y2 };
            return (
              segsIntersect(p1, p2, r1, r2) ||
              segsIntersect(p1, p2, r2, r3) ||
              segsIntersect(p1, p2, r3, r4) ||
              segsIntersect(p1, p2, r4, r1)
            );
          };
          return isDiagonal && !intersectsRect(lineSeg, rectB);
        })();
        if (lineRectFalsePositive) continue;

        const severeTextOverlap = (() => {
          if (!comparison.intersection) return false;
          const bothText = a.type === 'text' && b.type === 'text';
          if (!bothText) return false;
          const exceedsThreshold = (element) =>
            element.type === 'text' &&
            comparison.intersection.w >= TEXT_OVERLAP_ERROR_THRESHOLD &&
            comparison.intersection.h >= TEXT_OVERLAP_ERROR_THRESHOLD;
          return exceedsThreshold(a) || exceedsThreshold(b);
        })();

        let rectificationSuggestion = '';
        if (comparison.intersection) {
          const overlapW = comparison.intersection.w;
          const overlapH = comparison.intersection.h;
          const maxOverlap = Math.max(overlapW, overlapH);
          if (maxOverlap > 0) {
            const diffRatio = Math.abs(overlapW - overlapH) / maxOverlap;
            const directions = [];
            if (diffRatio <= RECTIFY_DIRECTION_EQUALITY_TOLERANCE) {
              directions.push('horizontally', 'vertically');
            } else if (overlapW < overlapH) {
              directions.push('horizontally');
            } else {
              directions.push('vertically');
            }
            rectificationSuggestion = `Reposition elements ${directions.join(' and ')}.`;
          }
        }

        const entry = {
          slide: slideLabel,
          a,
          b,
          intersection: comparison.intersection,
          severity: severeTextOverlap ? 'severe' : 'warning',
          suggestion: rectificationSuggestion,
        };
        overlaps.push(entry);
        if (severeTextOverlap) severeCount += 1;
        else warningCount += 1;
      } else if (comparison.relation === 'contained' && !opts.muteContainment) {
        containment.push({
          slide: slideLabel,
          containerIndex: comparison.containerIndex,
          containedIndex: comparison.containedIndex,
        });
      }
    }
  }

  return { overlaps, containment, severeCount, warningCount };
}

/**
 * Analyze a deck for overlaps and return a report object.
 * @param {object} pptx
 * @param {object} options
 * @returns {object}
 */
export function checkDeckOverlaps(pptx, options = {}) {
  const slides = Array.isArray(pptx?._slides) ? pptx._slides : [];
  const report = {
    summary: {
      slideCount: slides.length,
      overlapCount: 0,
      severeCount: 0,
      warningCount: 0,
      containmentCount: 0,
    },
    slides: [],
  };

  // Walk each slide and collect overlap diagnostics.
  for (const slide of slides) {
    const result = analyzeSlideOverlaps(slide, pptx, options);
    report.summary.overlapCount += result.overlaps.length;
    report.summary.severeCount += result.severeCount;
    report.summary.warningCount += result.warningCount;
    report.summary.containmentCount += result.containment.length;
    report.slides.push(result);
  }

  return report;
}

/**
 * Write overlap report JSON to disk.
 * @param {object} report
 * @param {string} outPath
 */
export function writeOverlapReport(report, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
}
