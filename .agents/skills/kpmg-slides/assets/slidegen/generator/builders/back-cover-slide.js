import path from 'node:path';
import { COLORS, FONTS, TYPE_SIZES } from '../tokens.js';
import { normalizeImageSource } from '../helpers/media.js';
import { resolveTemplateAssetsDir } from '../runtime/template-roots.js';

const TEMPLATE_ASSETS_DIR = resolveTemplateAssetsDir('kpmg-diligence');
const DEFAULT_ASSETS = {
  gradientBackCover: path.join(TEMPLATE_ASSETS_DIR, 'gradient_back_cover_300dpi.png'),
  closingLogoWhite: path.join(TEMPLATE_ASSETS_DIR, 'closing-logo-white.png'),
  closingSocialTwitter: path.join(TEMPLATE_ASSETS_DIR, 'closing-social-twitter.png'),
  closingSocialLinkedin: path.join(TEMPLATE_ASSETS_DIR, 'closing-social-linkedin.png'),
  closingSocialFacebook: path.join(TEMPLATE_ASSETS_DIR, 'closing-social-facebook.png'),
  closingSocialInstagram: path.join(TEMPLATE_ASSETS_DIR, 'closing-social-instagram.png'),
  closingSocialYoutube: path.join(TEMPLATE_ASSETS_DIR, 'closing-social-youtube.png'),
};

function addImageSmart(slide, asset, opts) {
  if (!asset) return;
  slide.addImage({ ...normalizeImageSource(asset), ...opts });
}

function resolveAsset(assets = {}, resolveAssetPath, key, fallbackKey = null) {
  return assets?.[key] || (typeof resolveAssetPath === 'function' ? resolveAssetPath(key) : null) || DEFAULT_ASSETS[key] || (fallbackKey ? DEFAULT_ASSETS[fallbackKey] : null);
}

function buildContacts() {
  return [
    {
      name: 'Firstname Lastname',
      role: 'Job Title',
      phone: 'T: +1 000 000 0001',
      email: 'E: firstname.lastname@kpmg.ca',
    },
    {
      name: 'Firstname Lastname',
      role: 'Job Title',
      phone: 'T: +1 000 000 0002',
      email: 'E: firstname.lastname@kpmg.ca',
    },
    {
      name: 'Firstname Lastname',
      role: 'Job Title',
      phone: 'T: +1 000 000 0003',
      email: 'E: firstname.lastname@kpmg.ca',
    },
  ];
}

function legalFooterLines(footerValues = {}) {
  const year = footerValues?.year || new Date().getFullYear();
  const legalEntity = footerValues?.legalEntityName || 'KPMG LLP';
  const jurisdiction = footerValues?.jurisdiction || 'Ontario';
  const legalStructure = footerValues?.legalStructure || 'limited liability partnership';
  const classification = footerValues?.documentClassification || 'KPMG Confidential';
  return {
    legal1:
      `© ${year} ${legalEntity}, an ${jurisdiction} ${legalStructure} and a member firm of the KPMG global organization ` +
      'of independent member firms affiliated with KPMG International Limited is a private English company limited by guarantee and does not provide services to clients. ' +
      'For more detail about our structure please visit kpmg.com/governance.',
    legal2:
      'The KPMG name and logo are trademarks used under license by the independent member firms of the KPMG global organization.',
    classification: `Document Classification: ${classification}`,
  };
}

export function addBackCover(
  pptx,
  { disclaimer, url, assets, geometry, masterName, footerValues, resolveAssetPath } = {},
) {
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const g = geometry || {};

  // Prefer masters for the back-cover full-bleed gradient.
  if (!masterName) {
    const gradient = resolveAsset(assets, resolveAssetPath, 'gradientBackCover');
    addImageSmart(slide, gradient, { x: 0, y: 0, w: 13.333, h: 7.5, altText: 'Decorative gradient' });
  }

  const logo = resolveAsset(assets, resolveAssetPath, 'closingLogoWhite');
  const socialIcons = [
    resolveAsset(assets, resolveAssetPath, 'closingSocialTwitter'),
    resolveAsset(assets, resolveAssetPath, 'closingSocialLinkedin'),
    resolveAsset(assets, resolveAssetPath, 'closingSocialFacebook'),
    resolveAsset(assets, resolveAssetPath, 'closingSocialInstagram'),
    resolveAsset(assets, resolveAssetPath, 'closingSocialYoutube'),
  ].filter(Boolean);
  const contacts = buildContacts();
  const legal = legalFooterLines(footerValues);

  addImageSmart(slide, logo, { x: 1.095, y: 0.45, w: 1.33, h: 0.45, altText: 'KPMG logo' });

  slide.addText('The contacts at KPMG in connection with this report are:', {
    ...(g.heading || { x: 1.095, y: 1.11, w: 10.25, h: 1.05 }),
    fontFace: FONTS.heading,
    fontSize: 30,
    bold: true,
    color: COLORS.white,
    valign: 'top',
    wrap: true,
  });

  const colW = 2.55;
  const colY = 3.03;
  contacts.forEach((contact, idx) => {
    const x = 1.24 + idx * 2.55;
    slide.addText(contact.name, {
      x,
      y: colY,
      w: colW,
      h: 0.22,
      fontFace: FONTS.body,
      fontSize: 13,
      color: COLORS.white,
      bold: true,
      margin: 0,
      valign: 'top',
    });
    slide.addText(`${contact.role}\n${contact.phone}\n${contact.email}`, {
      x,
      y: colY + 0.28,
      w: colW,
      h: 0.74,
      fontFace: FONTS.body,
      fontSize: 11,
      color: COLORS.white,
      wrap: true,
      margin: 0,
      valign: 'top',
      breakLine: true,
    });
  });

  socialIcons.forEach((icon, idx) => {
    addImageSmart(slide, icon, {
      x: 1.09 + idx * 0.43,
      y: 5.9,
      w: 0.36,
      h: 0.36,
      altText: 'Social icon',
    });
  });

  slide.addText(disclaimer || legal.legal1, {
    ...(g.disclaimer || { x: 1.09, y: 6.45, w: 10.65, h: 0.42 }),
    fontFace: FONTS.body,
    fontSize: 9,
    color: COLORS.white,
    valign: 'top',
    wrap: true,
    margin: 0,
  });

  slide.addText(legal.legal2, {
    x: 1.09,
    y: 6.92,
    w: 10.5,
    h: 0.2,
    fontFace: FONTS.body,
    fontSize: 8,
    color: COLORS.white,
    valign: 'top',
    wrap: true,
    margin: 0,
  });

  slide.addText(legal.classification, {
    x: 1.09,
    y: 7.36,
    w: 3.5,
    h: 0.1,
    fontFace: FONTS.body,
    fontSize: 8,
    color: COLORS.white,
    bold: true,
    margin: 0,
    valign: 'mid',
  });

  slide.addText(url || 'www.kpmg.com', {
    ...(g.url || { x: 1.09, y: 7.18, w: 2.3, h: 0.16 }),
    fontFace: FONTS.body,
    fontSize: TYPE_SIZES.body,
    color: COLORS.white,
    bold: true,
    underline: true,
    hyperlink: { url: 'https://kpmg.com' },
    margin: 0,
    valign: 'top',
  });

  return slide;
}
