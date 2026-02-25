import path from 'node:path';
import { COLORS, FONTS } from '../tokens.js';
import { getImageDimensions, normalizeImageSource } from '../helpers/media.js';
import { sanitizeText } from '../helpers/text.js';
import { resolveTemplateAssetsDir } from '../runtime/template-roots.js';

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const TOKENS = {
  colors: {
    accent1: COLORS.primary,
    white: COLORS.white,
  },
  fonts: {
    title: FONTS.heading,
    subtitle: FONTS.body,
  },
  geometry: {
    // inches
    logo: { x: 1.0919, y: 0.406, w: 1.0, h: 0.4 },
    title: { x: 1.0919, y: 1.5927, w: 4.044, h: 3.7486 },
    subtitle: { x: 1.0919, y: 5.4745, w: 4.044, h: 0.8858 },
    photoBox: { x: 5.3762, y: 1.592, w: 6.8715, h: 4.7743 }
  },
  textStyles: {
    coverTitle: {
      fontFace: FONTS.heading,
      fontSize: 40,
      bold: true,
      color: 'FFFFFF',
      align: 'left',
      valign: 'top',
      margin: 0,
      fit: 'none'
    },
    coverSubtitle: {
      fontFace: FONTS.body,
      fontSize: 14,
      color: 'FFFFFF',
      align: 'left',
      valign: 'bottom',
      margin: 0,
      fit: 'none'
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSETS (use file paths or data URIs)
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_ASSETS_DIR = resolveTemplateAssetsDir('kpmg-diligence');
const COVER_TITLE_MIN_FONT_SIZE = 30;
const COVER_TITLE_SHRINK_STEP = 1;

export const ASSETS = {
  logoWhite: path.join(TEMPLATE_ASSETS_DIR, 'kpmg-logo-white.png'),
  coverPhoto: path.join(TEMPLATE_ASSETS_DIR, 'cover-photo.jpeg')
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Shared helpers keep image handling consistent across builders.

/**
 * Compute the *scaled image size* (in inches) required to cover a given box.
 * This mirrors the crop-to-cover logic used by PowerPoint.
 */
function calcCoverFitWH(boxW, boxH, imgWpx, imgHpx) {
  const imgRatio = imgHpx / imgWpx;
  const boxRatio = boxH / boxW;

  if (boxRatio > imgRatio) {
    // Box is taller than image => scale by height, crop left/right
    return { w: boxH / imgRatio, h: boxH };
  }

  // Box is wider than image => scale by width, crop top/bottom
  return { w: boxW, h: boxW * imgRatio };
}

function addImageSmart(slide, asset, opts) {
  slide.addImage({ ...normalizeImageSource(asset), ...opts });
}

function normalizeCoverTitle(value) {
  const raw = String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return raw
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function estimateCoverTitleCharsPerLine(boxWInches, fontSizePt) {
  const width = Math.max(1, Number(boxWInches || 1));
  const size = Math.max(8, Number(fontSizePt || 40));
  const estimated = width * 10.8 * (12 / size) * 0.9;
  return Math.max(8, Math.floor(estimated));
}

function estimateCoverTitleMaxLines(boxHInches, fontSizePt) {
  const heightPt = Math.max(0, Number(boxHInches || 0)) * 72;
  const lineHeight = Math.max(10, Number(fontSizePt || 40) * 1.12);
  return Math.max(1, Math.floor(heightPt / lineHeight));
}

function linePenalty(line, { targetLen, maxLen, isLastLine }) {
  const length = line.length;
  const shortFloor = Math.max(6, Math.floor(targetLen * (isLastLine ? 0.6 : 0.45)));
  const majorOverflow = Math.max(0, length - maxLen);
  const majorUnderflow = Math.max(0, shortFloor - length);
  const diff = length - targetLen;
  let penalty = diff * diff;
  if (majorOverflow > 0) penalty += majorOverflow * majorOverflow * 11;
  if (majorUnderflow > 0) penalty += majorUnderflow * majorUnderflow * (isLastLine ? 8 : 4);
  return penalty;
}

function bestLinePartition(words, lineCount, maxLen) {
  const targetLen = (words.join(' ').length / Math.max(1, lineCount));
  const memo = new Map();

  function solve(startIdx, remaining) {
    const key = `${startIdx}:${remaining}`;
    if (memo.has(key)) return memo.get(key);

    if (remaining === 1) {
      const tail = words.slice(startIdx).join(' ');
      const result = {
        score: linePenalty(tail, { targetLen, maxLen, isLastLine: true }),
        lines: [tail],
      };
      memo.set(key, result);
      return result;
    }

    let best = null;
    const maxEndExclusive = words.length - remaining + 1;
    for (let end = startIdx + 1; end <= maxEndExclusive; end += 1) {
      const line = words.slice(startIdx, end).join(' ');
      const headScore = linePenalty(line, { targetLen, maxLen, isLastLine: false });
      const tail = solve(end, remaining - 1);
      const totalScore = headScore + tail.score;
      if (!best || totalScore < best.score) {
        best = { score: totalScore, lines: [line, ...tail.lines] };
      }
    }

    memo.set(key, best);
    return best;
  }

  return solve(0, lineCount);
}

function balanceCoverTitleLines(title, box, fontSizePt) {
  const normalized = normalizeCoverTitle(title);
  if (!normalized) return '';
  const maxLen = estimateCoverTitleCharsPerLine(box?.w, fontSizePt);
  const hasManualBreaks = normalized.includes('\n');
  if (hasManualBreaks) {
    const manualLines = normalized.split('\n');
    const manualFits = manualLines.every((line) => line.length <= maxLen);
    if (manualFits) return normalized;
  }

  const words = normalized.replace(/\n+/g, ' ').split(' ').filter(Boolean);
  if (words.length <= 2) return normalized;
  const maxLines = Math.min(
    words.length,
    6,
    estimateCoverTitleMaxLines(box?.h, fontSizePt),
  );
  const minLines = Math.min(maxLines, 2);

  let best = null;
  for (let lineCount = minLines; lineCount <= maxLines; lineCount += 1) {
    const candidate = bestLinePartition(words, lineCount, maxLen);
    if (!candidate) continue;

    // Favor fewer lines slightly, but strongly avoid an orphaned last line.
    const lastLen = candidate.lines[candidate.lines.length - 1]?.length || 0;
    const orphanFloor = Math.max(6, Math.floor(maxLen * 0.55));
    let score = candidate.score + (lineCount - minLines) * 1.1;
    if (lastLen < orphanFloor) score += (orphanFloor - lastLen) * 10;

    if (!best || score < best.score) {
      best = { score, lines: candidate.lines };
    }
  }

  return best?.lines?.join('\n') || normalized;
}

function coverTitleFits(lines, box, fontSizePt) {
  const safeLines = Array.isArray(lines) ? lines.filter(Boolean) : [];
  if (!safeLines.length) return true;

  const maxLines = estimateCoverTitleMaxLines(box?.h, fontSizePt);
  if (safeLines.length > maxLines) return false;

  const maxLen = estimateCoverTitleCharsPerLine(box?.w, fontSizePt);
  const words = safeLines.join(' ').split(/\s+/).filter(Boolean);
  const longestWordLen = words.reduce((max, word) => Math.max(max, word.length), 0);
  if (longestWordLen > maxLen) return false;

  return safeLines.every((line) => line.length <= maxLen);
}

function fitCoverTitle(title, box, baseFontSize, { minFontSize = COVER_TITLE_MIN_FONT_SIZE, step = COVER_TITLE_SHRINK_STEP } = {}) {
  const normalized = normalizeCoverTitle(title);
  const base = Number(baseFontSize || 40);
  const min = Math.min(base, Math.max(10, Number(minFontSize || COVER_TITLE_MIN_FONT_SIZE)));
  const stepSize = Math.max(1, Number(step || COVER_TITLE_SHRINK_STEP));

  if (!normalized) return { text: '', fontSize: base, autoShrunk: false };

  for (let size = base; size >= min; size -= stepSize) {
    const balanced = balanceCoverTitleLines(normalized, box, size);
    const lines = balanced.split('\n').map((line) => line.trim()).filter(Boolean);
    if (coverTitleFits(lines, box, size)) {
      return {
        text: balanced,
        fontSize: size,
        autoShrunk: size < base,
      };
    }
  }

  return {
    text: balanceCoverTitleLines(normalized, box, min),
    fontSize: min,
    autoShrunk: min < base,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add the Cover slide.
 *
 * `title` may be:
 * - string
 * - rich text array (runs), supported by PptxGenJS: [{ text, options }, ...]
 */
export function addCover(pptx, { title, subtitle, assets, geometry, masterName } = {}) {
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();

  const logoWhite = assets?.logoWhite ?? ASSETS.logoWhite;
  const coverPhoto = assets?.coverPhoto ?? ASSETS.coverPhoto;
  const g = geometry || TOKENS.geometry;

  // Solid blue background (prefer master when provided)
  if (!masterName) slide.background = { color: TOKENS.colors.accent1 };

  // White KPMG logo (top-left)
  addImageSmart(slide, logoWhite, {
    ...(g.logo || TOKENS.geometry.logo),
    altText: 'KPMG logo',
  });

  // Title text box (left)
  const titleBox = g.title || TOKENS.geometry.title;
  const fittedTitle = fitCoverTitle(
    title ?? '',
    titleBox,
    TOKENS.textStyles.coverTitle.fontSize,
  );
  slide.addText(fittedTitle.text, {
    ...titleBox,
    ...TOKENS.textStyles.coverTitle,
    fontSize: fittedTitle.fontSize,
    valign: 'top'
  });

  // Subtitle text box (below title)
  slide.addText(sanitizeText(subtitle ?? ''), {
    ...(g.subtitle || TOKENS.geometry.subtitle),
    ...TOKENS.textStyles.coverSubtitle,
    valign: 'top'
  });

  // Cover photo (right) — crop-to-cover
  const box = g.photoBox || g.photo || TOKENS.geometry.photoBox;
  const { width: imgWpx, height: imgHpx } = getImageDimensions(coverPhoto);
  const full = calcCoverFitWH(box.w, box.h, imgWpx, imgHpx);

  addImageSmart(slide, coverPhoto, {
    x: box.x,
    y: box.y,

    // IMPORTANT:
    // PptxGenJS computes `cover` cropping from the aspect ratio of the *image object*.
    // So: set (w,h) to the scaled image size that preserves the image aspect ratio,
    // and set sizing.(w,h) to the target box to cover.
    w: full.w,
    h: full.h,
    sizing: { type: 'cover', w: box.w, h: box.h },
    altText: 'Cover photograph',
  });

  return slide;
}
