import { addImageSmart } from '../helpers/media.js';
import { THEME_COMPONENT_KEYS, resolveTextThemePrimitives, resolveTheme, toFiniteNumber } from '../helpers/theme.js';

function buildContacts(rawContacts = []) {
  const normalized = Array.isArray(rawContacts)
    ? rawContacts
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          name: String(item.name || '').trim(),
          role: String(item.role || '').trim(),
          phone: String(item.phone || '').trim(),
          email: String(item.email || '').trim(),
        }))
        .filter((item) => item.name || item.role || item.phone || item.email)
        .slice(0, 3)
    : [];
  return normalized;
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

function normalizeHyperlink(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function addBackCover(pptx, slideSpec = {}, ctx = {}) {
  const { disclaimer, url, contacts: customContacts } = slideSpec;
  const { assets, geometry, masterName, theme, options } = ctx;
  const footerValues = options?.footerValues || {};
  const {
    gradientBackCover,
    closingLogoWhite,
    closingSocialTwitter,
    closingSocialLinkedin,
    closingSocialFacebook,
    closingSocialInstagram,
    closingSocialYoutube,
  } = assets || {};
  const resolvedTheme = resolveTheme(theme);
  const textColor = resolvedTheme.colors.white;
  const headingFont = resolvedTheme.fonts.heading;
  const bodyFont = resolvedTheme.fonts.body;
  const backCoverTokens = resolvedTheme.components?.[THEME_COMPONENT_KEYS.backCover] || {};
  const backCoverFontSizes = backCoverTokens.fontSizes || {};
  const textTokens = resolveTextThemePrimitives(resolvedTheme);
  const contactTokens = backCoverTokens.contacts || {};
  const iconTokens = backCoverTokens.icon || {};
  const legalTokens = backCoverTokens.legal || {};
  const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
  const g = geometry || {};
  if (!g.logoBox || !g.headingBox || !g.disclaimerBox || !g.urlBox) {
    throw new Error('Missing required geometry for slide type "backCover" (logoBox/headingBox/disclaimerBox/urlBox)');
  }

  // Prefer masters for the back-cover full-bleed gradient.
  if (!masterName) {
    addImageSmart(slide, gradientBackCover, { x: 0, y: 0, w: 13.333, h: 7.5, altText: 'Decorative gradient' });
  }

  const logo = closingLogoWhite;
  const socialIcons = [
    closingSocialTwitter,
    closingSocialLinkedin,
    closingSocialFacebook,
    closingSocialInstagram,
    closingSocialYoutube,
  ];
  const contacts = buildContacts(customContacts);
  const legal = legalFooterLines(footerValues);
  const normalizedUrl = normalizeHyperlink(url);
  const defaultWebsiteText = backCoverTokens.defaultWebsiteText || 'www.kpmg.com';

  addImageSmart(slide, logo, { ...g.logoBox, altText: 'KPMG logo' });

  if (contacts.length > 0) {
    slide.addText('The contacts at KPMG in connection with this report are:', {
      ...g.headingBox,
      fontFace: headingFont,
      fontSize: toFiniteNumber(backCoverFontSizes.heading, resolvedTheme.typeSizes.title),
      bold: true,
      color: textColor,
      valign: 'top',
      wrap: true,
    });
  }

  const colW = toFiniteNumber(contactTokens.columnWidth, 2.55);
  const colY = toFiniteNumber(contactTokens.y, 3.03);
  const colXStart = toFiniteNumber(contactTokens.xStart, 1.24);
  const colXGap = toFiniteNumber(contactTokens.xGap, 2.55);
  contacts.forEach((contact, idx) => {
    const x = colXStart + idx * colXGap;
    slide.addText(contact.name, {
      x,
      y: colY,
      w: colW,
      h: 0.22,
      fontFace: bodyFont,
      fontSize: toFiniteNumber(backCoverFontSizes.contactName, resolvedTheme.typeSizes.body),
      color: textColor,
      bold: true,
      margin: textTokens.marginNone,
      valign: 'top',
    });
    slide.addText(`${contact.role}\n${contact.phone}\n${contact.email}`, {
      x,
      y: colY + 0.28,
      w: colW,
      h: 0.74,
      fontFace: bodyFont,
      fontSize: toFiniteNumber(backCoverFontSizes.contactDetails, resolvedTheme.typeSizes.body),
      color: textColor,
      wrap: true,
      margin: textTokens.marginNone,
      valign: 'top',
      breakLine: true,
    });
  });

  const iconXStart = toFiniteNumber(iconTokens.xStart, 1.09);
  const iconXGap = toFiniteNumber(iconTokens.xGap, 0.43);
  const iconY = toFiniteNumber(iconTokens.y, 5.9);
  const iconW = toFiniteNumber(iconTokens.w, 0.36);
  const iconH = toFiniteNumber(iconTokens.h, 0.36);
  socialIcons.forEach((icon, idx) => {
    addImageSmart(slide, icon, {
      x: iconXStart + idx * iconXGap,
      y: iconY,
      w: iconW,
      h: iconH,
      altText: 'Social icon',
    });
  });

  slide.addText(disclaimer || legal.legal1, {
    ...g.disclaimerBox,
    fontFace: bodyFont,
    fontSize: toFiniteNumber(backCoverFontSizes.disclaimer, resolvedTheme.typeSizes.source),
    color: textColor,
    valign: 'top',
    wrap: true,
    margin: textTokens.marginNone,
  });

  const legal2 = legalTokens.line2 || {};
  slide.addText(legal.legal2, {
    x: toFiniteNumber(legal2.x, 1.09),
    y: toFiniteNumber(legal2.y, 6.92),
    w: toFiniteNumber(legal2.w, 10.5),
    h: toFiniteNumber(legal2.h, 0.2),
    fontFace: bodyFont,
    fontSize: toFiniteNumber(backCoverFontSizes.legalBody, resolvedTheme.typeSizes.source),
    color: textColor,
    valign: 'top',
    wrap: true,
    margin: textTokens.marginNone,
  });

  const legalClassification = legalTokens.classification || {};
  slide.addText(legal.classification, {
    x: toFiniteNumber(legalClassification.x, 1.09),
    y: toFiniteNumber(legalClassification.y, 7.36),
    w: toFiniteNumber(legalClassification.w, 3.5),
    h: toFiniteNumber(legalClassification.h, 0.1),
    fontFace: bodyFont,
    fontSize: toFiniteNumber(backCoverFontSizes.classification, resolvedTheme.typeSizes.source),
    color: textColor,
    bold: true,
    margin: textTokens.marginNone,
    valign: 'mid',
  });

  slide.addText(url || defaultWebsiteText, {
    ...g.urlBox,
    fontFace: bodyFont,
    fontSize: resolvedTheme.typeSizes.body,
    color: textColor,
    bold: true,
    underline: Boolean(normalizedUrl),
    ...(normalizedUrl ? { hyperlink: { url: normalizedUrl } } : {}),
    margin: textTokens.marginNone,
    valign: 'top',
  });

  return slide;
}
