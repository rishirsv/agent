import path from 'node:path';

function cleanInputBaseName(inputPath = '') {
  const extless = path.basename(String(inputPath || ''), path.extname(String(inputPath || '')));
  return extless.replace(/\.deckspec$/i, '');
}

function isPlaceholderLike(value = '') {
  return /(\[[^\]]+\]|<[^>]+>|\{[^}]+\})/.test(value);
}

function isGenericStarter(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === 'deck') return true;
  if (normalized.includes('starter')) return true;
  return /^(concise|detailed|extensive)\b/.test(normalized) && normalized.includes('deck');
}

function isMeaningfulTopic(value = '') {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  if (isPlaceholderLike(normalized)) return false;
  if (isGenericStarter(normalized)) return false;
  return true;
}

export function slugifyDeckStem(value = '', fallback = 'deck') {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['"]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase()
    .slice(0, 80)
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function buildSuggestedDeckStem(deckSpec = {}, options = {}) {
  const inputBaseName = cleanInputBaseName(options.inputPath || '');
  const coverTitle = deckSpec?.slides?.find((slide) => slide?.type === 'cover')?.title;
  const firstSlideTitle = deckSpec?.slides?.find((slide) => typeof slide?.title === 'string')?.title;
  const candidates = [
    coverTitle,
    firstSlideTitle,
    deckSpec?.metadata?.title,
    deckSpec?.metadata?.subject,
    inputBaseName,
  ];
  const chosen = candidates.find((candidate) => isMeaningfulTopic(candidate)) || inputBaseName || 'deck';
  return slugifyDeckStem(chosen, 'deck');
}

export function buildSuggestedDeckFilename(deckSpec = {}, options = {}) {
  return `${buildSuggestedDeckStem(deckSpec, options)}.pptx`;
}
