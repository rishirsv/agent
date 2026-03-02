/**
 * generator/helpers/media.js — Shared image utilities
 */

import fs from 'node:fs';
import { svgToDataUri } from './svg.js';

/**
 * Check if a string is a data URI.
 * @param {string} value
 * @returns {boolean}
 */
function isDataUri(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

/**
 * Detect a raw SVG string.
 * @param {string} value
 * @returns {boolean}
 */
function isSvgString(value) {
  return typeof value === 'string' && value.includes('<svg');
}

/**
 * Normalize an image source to a PptxGenJS-compatible object.
 * @param {string|Buffer} source
 * @returns {{data?: string|Buffer, path?: string}}
 */
export function normalizeImageSource(source) {
  if (Buffer.isBuffer(source)) return { data: source };
  if (isDataUri(source)) return { data: source };
  if (isSvgString(source)) return { data: svgToDataUri(source) };
  return { path: source };
}

function toFinite(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeImagePlacement(options = {}) {
  const out = { ...options };
  for (const key of ['x', 'y', 'w', 'h']) {
    const numeric = toFinite(options[key], null);
    if (numeric === null) delete out[key];
    else out[key] = numeric;
  }

  if (out.sizing && typeof out.sizing === 'object') {
    const sizing = { ...out.sizing };
    const sx = toFinite(sizing.x, null);
    const sy = toFinite(sizing.y, null);
    const sw = toFinite(sizing.w, null);
    const sh = toFinite(sizing.h, null);
    if (sx === null) delete sizing.x;
    else sizing.x = sx;
    if (sy === null) delete sizing.y;
    else sizing.y = sy;
    sizing.w = sw ?? out.w;
    sizing.h = sh ?? out.h;
    out.sizing = sizing;
  }

  return out;
}

export function addImageSmart(slide, asset, options = {}) {
  if (!slide || !asset) return;
  slide.addImage({
    ...normalizeImageSource(asset),
    ...normalizeImagePlacement(options),
  });
}

/**
 * Read an image source into a buffer for probing.
 * @param {string|Buffer} source
 * @returns {{buffer: Buffer, type: string}}
 */
function readInputAsBuffer(source) {
  if (!source) throw new Error('Image source is empty');
  if (Buffer.isBuffer(source)) return { buffer: source, type: 'buffer' };
  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const type = 'dataUri';
      const comma = source.indexOf(',');
      const payload = comma !== -1 ? source.slice(comma + 1) : source;
      try {
        return { buffer: Buffer.from(payload, 'base64'), type };
      } catch {
        try {
          return { buffer: Buffer.from(decodeURIComponent(payload), 'utf8'), type };
        } catch {
          return { buffer: Buffer.from(payload, 'utf8'), type };
        }
      }
    }
    if (source.includes('<svg')) {
      return { buffer: Buffer.from(source, 'utf8'), type: 'rawSvg' };
    }
    return { buffer: fs.readFileSync(source), type: 'path' };
  }
  throw new Error('Unsupported image source type');
}

function isPng(buf) {
  return (
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

function isJpeg(buf) {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isGif(buf) {
  return (
    buf.length >= 10 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x39 || buf[4] === 0x37) &&
    buf[5] === 0x61
  );
}

function isWebp(buf) {
  return (
    buf.length >= 16 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  );
}

function isSvg(buf) {
  const head = buf.slice(0, 200).toString('utf8');
  return head.includes('<svg');
}

function readPngSize(buf) {
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height, type: 'png' };
}

function readGifSize(buf) {
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  return { width, height, type: 'gif' };
}

function readWebpSize(buf) {
  const riffSize = buf.readUInt32LE(4) + 8;
  let offset = 12;
  while (offset + 8 <= riffSize && offset + 8 <= buf.length) {
    const chunkTag = buf.slice(offset, offset + 4).toString('ascii');
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkTag === 'VP8X') {
      const wMinus1 = buf.readUIntLE(offset + 12, 3);
      const hMinus1 = buf.readUIntLE(offset + 15, 3);
      return { width: wMinus1 + 1, height: hMinus1 + 1, type: 'webp' };
    }
    if (chunkTag === 'VP8 ') {
      const start = offset + 8;
      if (start + 10 < buf.length) {
        const width = buf.readUInt16LE(start + 6) & 0x3fff;
        const height = buf.readUInt16LE(start + 8) & 0x3fff;
        return { width, height, type: 'webp' };
      }
    }
    if (chunkTag === 'VP8L') {
      const start = offset + 8;
      if (start + 5 <= buf.length) {
        const b0 = buf[start + 1];
        const b1 = buf[start + 2];
        const b2 = buf[start + 3];
        const b3 = buf[start + 4];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        return { width, height, type: 'webp' };
      }
    }
    offset += 8 + ((chunkSize + 1) & ~1);
  }
  throw new Error('Unsupported WEBP variant for size detection');
}

function readJpegSize(buf) {
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height, type: 'jpeg' };
    }
    const blockLength = buf.readUInt16BE(offset + 2);
    if (!Number.isFinite(blockLength) || blockLength < 2) break;
    offset += 2 + blockLength;
  }
  throw new Error('JPEG size not found');
}

function parseSvgSize(buf) {
  const text = buf.toString('utf8');
  const a = text.indexOf('<svg');
  const b = text.indexOf('</svg>');
  const inner = a !== -1 && b !== -1 ? text.slice(a, b + 6) : text;
  const widthMatch = inner.match(/\bwidth\s*=\s*"([^"]+)"/i);
  const heightMatch = inner.match(/\bheight\s*=\s*"([^"]+)"/i);
  const viewBoxMatch = inner.match(/\bviewBox\s*=\s*"([^"]+)"/i);

  const toPx = (v) => {
    if (!v) return null;
    const m = String(v).trim().match(/([0-9.]+)\s*(px|pt|em|ex|cm|mm|in|%)?/i);
    if (!m) return null;
    const n = parseFloat(m[1]);
    const unit = (m[2] || 'px').toLowerCase();
    const dpi = 96;
    switch (unit) {
      case 'px':
        return n;
      case 'pt':
        return (n * dpi) / 72;
      case 'in':
        return n * dpi;
      case 'cm':
        return (n / 2.54) * dpi;
      case 'mm':
        return (n / 25.4) * dpi;
      case 'em':
      case 'ex':
        return n * 16;
      case '%':
        return null;
      default:
        return n;
    }
  };

  let widthPx = widthMatch ? toPx(widthMatch[1]) : null;
  let heightPx = heightMatch ? toPx(heightMatch[1]) : null;
  if ((!widthPx || !heightPx) && viewBoxMatch) {
    const vb = viewBoxMatch[1].trim().split(/\s+/).map((s) => parseFloat(s));
    if (vb.length === 4) {
      const vbw = vb[2];
      const vbh = vb[3];
      if (!widthPx && vbh) widthPx = vbw;
      if (!heightPx && vbw) heightPx = vbh;
    }
  }
  if (!widthPx || !heightPx) {
    widthPx = widthPx || 100;
    heightPx = heightPx || 100;
  }
  return { width: widthPx, height: heightPx, type: 'svg' };
}

/**
 * Read image dimensions from a path or data source.
 * @param {string|Buffer} source
 * @returns {{width:number,height:number,aspectRatio:number,type:string}}
 */
export function getImageDimensions(source) {
  const { buffer: buf, type } = readInputAsBuffer(source);
  let meta;
  if (isPng(buf)) meta = readPngSize(buf);
  else if (isJpeg(buf)) meta = readJpegSize(buf);
  else if (isGif(buf)) meta = readGifSize(buf);
  else if (isWebp(buf)) meta = readWebpSize(buf);
  else if (isSvg(buf)) meta = parseSvgSize(buf);
  else {
    const suffix = type === 'path' && typeof source === 'string' ? ` (path: ${source})` : '';
    throw new Error(`Unsupported image format for provided source${suffix}`);
  }

  const aspectRatio = meta.width > 0 && meta.height > 0 ? meta.width / meta.height : 1;
  return {
    width: meta.width,
    height: meta.height,
    aspectRatio,
    type: meta.type,
  };
}
