import fs from 'node:fs';
import path from 'node:path';

/**
 * List preview PNGs from a preview directory in slide order.
 * @param {string|null|undefined} previewDir
 * @returns {string[]}
 */
export function listPreviewImages(previewDir) {
  if (!previewDir || !fs.existsSync(previewDir)) return [];
  return fs
    .readdirSync(previewDir)
    .filter((name) => /^slide-\d+\.png$/i.test(name))
    .sort((a, b) => {
      const ai = Number(a.match(/\d+/)?.[0] || 0);
      const bi = Number(b.match(/\d+/)?.[0] || 0);
      return ai - bi;
    })
    .map((name) => path.join(previewDir, name));
}
