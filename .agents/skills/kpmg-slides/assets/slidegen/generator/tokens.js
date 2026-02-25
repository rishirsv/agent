/**
 * generator/tokens.js — Single source of truth for design tokens
 *
 * All builders import from here instead of hardcoding values.
 */

export const FONTS = {
  heading: 'Arial',
  body: 'Arial',
};

export const COLORS = {
  kpmgBlue: '00338D',
  kpmgDarkBlue: '00338D',
  primary: '1E49E2',
  kpmgPurple: '7213EA',
  kpmgCyan: '00B8F5',
  pink: 'FD349C',
  darkNavy: '0C233C',
  white: 'FFFFFF',
  black: '000000',
  lightGrey: 'E5E5E5',
  green: '00A651',
  mediumBlue: '005EB8',
  orange: 'FF6D00',
};

export const CHART_COLORS = [
  '00338D', // KPMG blue
  '1E49E2', // primary
  '00B8F5', // cyan
  '7213EA', // purple
  'FD349C', // pink
  '0C233C', // dark navy
  '00A651', // green
  '005EB8', // medium blue
  'FF6D00', // orange
];

function cmToPt(cm) {
  // 1 inch = 2.54 cm, 1 inch = 72 pt
  return (Number(cm) / 2.54) * 72;
}

export const TYPE_SIZES = {
  // Per KPMG PPT standard (from user-provided reference deck):
  slideTitle: 32,
  strapline: 10,
  body: 10,
  source: 6,
};

export const TEXT_BOX = {
  // PowerPoint Text Box margins (cm): left 0.2, right 0.25, top 0.13, bottom 0.13
  // PptxGenJS expects points in [top, right, bottom, left] order.
  marginPt: [cmToPt(0.13), cmToPt(0.25), cmToPt(0.13), cmToPt(0.2)],
  wrap: true,
};

// Bullet paragraph styling (match PowerPoint standard paragraph settings)
export const BULLETS = {
  // PowerPoint: Before text 0.63cm, Special: Hanging 0.63cm
  // PptxGenJS exposes bullet indent (points) which maps closest to the hanging indent.
  indentPt: cmToPt(0.63),
  // PowerPoint: Spacing Before 0pt; Spacing After 6pt; Line Spacing Exactly 12pt
  paraSpaceBeforePt: 0,
  paraSpaceAfterPt: 6,
  lineSpacingPt: 12,
};
