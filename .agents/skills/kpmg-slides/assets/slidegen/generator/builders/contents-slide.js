import { FONTS, COLORS, TYPE_SIZES, TEXT_BOX } from '../tokens.js';
import { addTitle } from '../helpers/title.js';

const TOKENS = {
  geometry: {
    // 28.31cm x 1.57cm title box for long contents headings.
    title: { x: 1.089, y: 0.472, w: 11.1457, h: 0.6181 },
    topRow: { x: 1.089, y: 1.38, w: 11.153, h: 2.35 },
    bottomRow: { x: 1.089, y: 4.04, w: 11.153, h: 2.35 },
  },
  text: {
    sectionNo: {
      fontFace: FONTS.heading,
      fontSize: 34,
      color: COLORS.kpmgBlue,
      bold: true,
      margin: 0,
      valign: 'top',
    },
    sectionTitle: {
      fontFace: FONTS.body,
      fontSize: 12,
      color: COLORS.kpmgBlue,
      bold: true,
      margin: 0,
      valign: 'top',
    },
    pageRange: {
      fontFace: FONTS.body,
      fontSize: 10,
      color: COLORS.kpmgBlue,
      bold: true,
      margin: 0,
      valign: 'top',
    },
    item: {
      fontFace: FONTS.body,
      fontSize: TYPE_SIZES.body,
      color: COLORS.black,
      margin: 0,
      valign: 'top',
    },
  },
};

function addSectionBlock(pptx, slide, section, geo) {
  if (!section || !geo) return;
  const title = section.title || '';
  const pageRange = section.pageRange || '';
  const items = Array.isArray(section.items) ? section.items : [];

  slide.addText(section.number || '', {
    x: geo.x,
    y: geo.y,
    w: geo.w,
    h: 0.52,
    ...TOKENS.text.sectionNo,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: geo.x,
    y: geo.y + 0.52,
    w: Math.min(0.55, geo.w * 0.35),
    h: 0,
    line: { color: COLORS.kpmgBlue, pt: 1.5 },
  });
  slide.addText(title, {
    x: geo.x,
    y: geo.y + 0.57,
    w: geo.w,
    h: 0.23,
    ...TOKENS.text.sectionTitle,
  });
  if (pageRange) {
    slide.addText(pageRange, {
      x: geo.x,
      y: geo.y + 0.83,
      w: geo.w,
      h: 0.2,
      ...TOKENS.text.pageRange,
    });
  }
  const bodyY = pageRange ? geo.y + 1.12 : geo.y + 0.9;
  slide.addText(items.join('\n'), {
    x: geo.x,
    y: bodyY,
    w: geo.w,
    h: Math.max(0.4, geo.h - (bodyY - geo.y)),
    ...TOKENS.text.item,
    wrap: TEXT_BOX.wrap,
    margin: TEXT_BOX.marginPt,
    breakLine: true,
  });
}

function chunkFive(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return [a.slice(0, 5), a.slice(5, 10)];
}

function sectionBox(col, rowGeo) {
  const gap = 0.18;
  const colW = (rowGeo.w - gap * 4) / 5;
  return { x: rowGeo.x + (colW + gap) * col, y: rowGeo.y, w: colW, h: rowGeo.h };
}

export function addContentsSlide(pptx, { title, sections, geometry, masterName } = {}) {
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const g = geometry || TOKENS.geometry;
  addTitle(slide, title || 'Contents', g.title || TOKENS.geometry.title);

  const [top, bottom] = chunkFive(sections);
  top.forEach((section, idx) =>
    addSectionBlock(pptx, slide, section, sectionBox(idx, g.topRow || TOKENS.geometry.topRow)),
  );
  bottom.forEach((section, idx) =>
    addSectionBlock(pptx, slide, section, sectionBox(idx, g.bottomRow || TOKENS.geometry.bottomRow)),
  );

  return slide;
}
