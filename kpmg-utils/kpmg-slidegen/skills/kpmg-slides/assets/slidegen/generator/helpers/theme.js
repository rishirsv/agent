import {
  CHART_COLORS as LEGACY_CHART_COLORS,
  COLORS as LEGACY_COLORS,
  FONTS as LEGACY_FONTS,
  TYPE_SIZES as LEGACY_TYPE_SIZES,
} from '../tokens.js';

const DEFAULT_DIMENSIONS = Object.freeze({ w: 13.333, h: 7.5 });

function cmToPt(cm) {
  return (Number(cm) / 2.54) * 72;
}

const DEFAULT_TEXT_BOX = Object.freeze({
  wrap: true,
  marginPt: [cmToPt(0.13), cmToPt(0.25), cmToPt(0.13), cmToPt(0.2)],
});

export const DEFAULT_THEME_OVERRIDES = Object.freeze({
  spacing: {
    sectionGap: 0.18,
  },
  lines: {
    sectionDividerPt: 1.5,
  },
  components: {
    contents: {
      fontSizes: {
        sectionNo: 34,
        sectionTitle: 12,
        pageRange: 10,
      },
      sectionNumberHeight: 0.52,
      sectionTitleOffsetY: 0.57,
      pageRangeOffsetY: 0.83,
      bodyOffsetWithPageRangeY: 1.12,
      bodyOffsetWithoutPageRangeY: 0.9,
    },
    analysisNarrowTable: {
      fullTableWidth: 11.1596,
      tableChrome: {
        titleBarHeight: 0.24,
        separatorHeight: 0.02,
      },
      fontSizes: {
        tableHeading: 9,
      },
    },
    contentsSlide: {
      sectionGap: 0.18,
    },
    analysisBridge: {
      colors: {
        connector: 'A7A9AC',
        baseline: 'C8CDD3',
      },
    },
    dividerSlide: {
      fontSizes: {
        sectionNumber: 48,
        sectionTitle: 24,
      },
    },
    backCover: {
      defaultWebsiteText: 'www.kpmg.com',
      fontSizes: {
        heading: 30,
        contactName: 13,
        contactDetails: 11,
        disclaimer: 9,
        legalBody: 8,
        classification: 8,
      },
    },
  },
});

function isResolvedTheme(value) {
  return Boolean(value && typeof value === 'object' && value.__resolvedTheme === true);
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return '';
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function safePalette(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  const cleaned = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
  return cleaned.length ? cleaned : [...fallback];
}

function normalizeTextStyle(value = {}) {
  const normalized = {};
  if (typeof value?.fontFace === 'string' && value.fontFace.trim()) normalized.fontFace = value.fontFace.trim();
  const fontSize = firstFiniteNumber(value?.fontSize);
  if (fontSize !== null) normalized.fontSize = fontSize;
  if (typeof value?.color === 'string' && value.color.trim()) normalized.color = value.color.trim();
  if (typeof value?.bold === 'boolean') normalized.bold = value.bold;
  if (typeof value?.italic === 'boolean') normalized.italic = value.italic;
  return normalized;
}

function normalizeTextBox(theme = null) {
  const tokenBox = theme?.tokens?.textBox || {};
  const directBox = theme?.textBox || {};
  const wrap =
    typeof directBox.wrap === 'boolean'
      ? directBox.wrap
      : typeof tokenBox.wrap === 'boolean'
        ? tokenBox.wrap
        : DEFAULT_TEXT_BOX.wrap;
  const marginPt = Array.isArray(directBox.marginPt)
    ? directBox.marginPt
    : Array.isArray(tokenBox.marginPt)
      ? tokenBox.marginPt
      : DEFAULT_TEXT_BOX.marginPt;
  return { wrap, marginPt };
}

function buildColorMap(theme = {}) {
  const scheme = theme?.tokens?.colors?.scheme || {};
  const semantic = theme?.tokens?.colors?.semantic || {};
  const explicit = theme?.colors || {};
  const primary = firstNonEmptyString(explicit.primary, semantic.primary, scheme.accent1, LEGACY_COLORS.primary);
  const kpmgBlue = firstNonEmptyString(explicit.kpmgBlue, semantic.kpmgBlue, scheme.accent2, LEGACY_COLORS.kpmgBlue);
  const white = firstNonEmptyString(explicit.white, semantic.bgLight, scheme.lt1, LEGACY_COLORS.white);
  const black = firstNonEmptyString(explicit.black, semantic.textDark, scheme.dk1, LEGACY_COLORS.black);
  const lightGrey = firstNonEmptyString(explicit.lightGrey, semantic.bgAlt, scheme.lt2, LEGACY_COLORS.lightGrey);

  return {
    ...LEGACY_COLORS,
    ...explicit,
    primary,
    kpmgBlue,
    kpmgDarkBlue: firstNonEmptyString(explicit.kpmgDarkBlue, scheme.accent2, primary, LEGACY_COLORS.kpmgDarkBlue),
    kpmgCyan: firstNonEmptyString(explicit.kpmgCyan, semantic.kpmgCyan, scheme.accent4, LEGACY_COLORS.kpmgCyan),
    kpmgPurple: firstNonEmptyString(explicit.kpmgPurple, semantic.kpmgPurple, scheme.accent5, LEGACY_COLORS.kpmgPurple),
    pink: firstNonEmptyString(explicit.pink, scheme.accent6, LEGACY_COLORS.pink),
    darkNavy: firstNonEmptyString(explicit.darkNavy, scheme.accent3, LEGACY_COLORS.darkNavy),
    lightGrey,
    white,
    black,
    neutral: {
      200: firstNonEmptyString(explicit?.neutral?.[200], 'E5E7EB'),
      300: firstNonEmptyString(explicit?.neutral?.[300], 'D9D9D9'),
    },
    tableHeader: firstNonEmptyString(explicit.tableHeader, primary, LEGACY_COLORS.primary),
    priority: {
      high: firstNonEmptyString(explicit?.priority?.high, primary, LEGACY_COLORS.primary),
      medium: firstNonEmptyString(explicit?.priority?.medium, '666666'),
      low: firstNonEmptyString(explicit?.priority?.low, '666666'),
    },
    chart: {
      background: firstNonEmptyString(explicit?.chart?.background, white, LEGACY_COLORS.white),
    },
  };
}

function buildFontMap(theme = {}) {
  const templateFonts = theme?.tokens?.fonts || {};
  const explicitFonts = theme?.fonts || {};
  return {
    heading: firstNonEmptyString(explicitFonts.heading, templateFonts.heading, LEGACY_FONTS.heading, LEGACY_FONTS.body),
    body: firstNonEmptyString(explicitFonts.body, templateFonts.body, LEGACY_FONTS.body),
    fallback: firstNonEmptyString(explicitFonts.fallback, explicitFonts.body, templateFonts.body, LEGACY_FONTS.body),
  };
}

function mergeObjects(...objs) {
  const out = {};
  for (const obj of objs) {
    if (!obj || typeof obj !== 'object') continue;
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        out[key] = mergeObjects(out[key], value);
      } else {
        out[key] = value;
      }
    }
  }
  return out;
}

export function buildTheme(templatePackage = {}, semanticOverrides = {}) {
  const baseTheme = mergeObjects(DEFAULT_THEME_OVERRIDES, semanticOverrides);
  const tokens = templatePackage?.tokens || {};
  return resolveTheme({
    ...baseTheme,
    tokens,
    dimensions: tokens?.dimensions || DEFAULT_DIMENSIONS,
  });
}

export function resolveTheme(theme = null) {
  if (isResolvedTheme(theme)) return theme;

  const colors = buildColorMap(theme || {});
  const fonts = buildFontMap(theme || {});
  const textBox = normalizeTextBox(theme || {});
  const typeSizes = {
    ...LEGACY_TYPE_SIZES,
    ...(theme?.typeSizes || {}),
  };
  const chartFontSizes = {
    legend: firstFiniteNumber(theme?.chart?.fontSizes?.legend, 7) || 7,
    label: firstFiniteNumber(theme?.chart?.fontSizes?.label, 8) || 8,
    axis: firstFiniteNumber(theme?.chart?.fontSizes?.axis, 7) || 7,
    dataLabel: firstFiniteNumber(theme?.chart?.fontSizes?.dataLabel, 7) || 7,
  };
  const chartPalette = safePalette(theme?.chart?.palette, LEGACY_CHART_COLORS);
  const dimensions = theme?.dimensions || theme?.tokens?.dimensions || DEFAULT_DIMENSIONS;

  const components = mergeObjects(DEFAULT_THEME_OVERRIDES.components, theme?.components || {});
  const spacing = mergeObjects(DEFAULT_THEME_OVERRIDES.spacing, theme?.spacing || {});
  const lines = mergeObjects(DEFAULT_THEME_OVERRIDES.lines, theme?.lines || {});
  const textStyles = theme?.tokens?.textStyles || {};

  // Keep both semantic map and raw tokens for traceability during migration.
  return {
    __resolvedTheme: true,
    tokens: theme?.tokens || {},
    rawTokens: theme?.tokens || {},
    textStyles,
    colors,
    fonts,
    typeSizes,
    dimensions,
    textBox,
    chart: {
      palette: chartPalette,
      fontSizes: chartFontSizes,
    },
    spacing,
    lines,
    components,
  };
}

export function resolveTokenTextStyle(resolvedTheme, tokenKey, fallback = {}) {
  const tokenStyle = resolvedTheme?.textStyles?.[tokenKey];
  return {
    ...fallback,
    ...normalizeTextStyle(tokenStyle),
  };
}

function resolveThemeColor(theme, colorKey, fallback) {
  const color = theme?.colors?.[colorKey];
  if (typeof color === 'string' && color.trim()) return color.trim();
  return fallback;
}

export function resolveTextBoxOptions(theme = null, overrides = {}) {
  const resolvedTheme = resolveTheme(theme);
  const base = {
    wrap: resolvedTheme.textBox.wrap,
    margin: resolvedTheme.textBox.marginPt,
  };
  return { ...base, ...overrides };
}

export function resolveStraplineTextStyle(
  theme,
  {
    colorKey = 'kpmgPurple',
    color = null,
    italic = true,
    bold = true,
    paraSpaceAfter = null,
    tokenKey = null,
  } = {},
) {
  const resolvedTheme = resolveTheme(theme);
  const fallback = {
    fontFace: resolvedTheme.fonts.body,
    fontSize: resolvedTheme.typeSizes.strapline,
    color: color || resolveThemeColor(resolvedTheme, colorKey, resolvedTheme.colors.kpmgPurple),
    italic,
    bold,
  };
  const tokenStyle = tokenKey ? resolveTokenTextStyle(resolvedTheme, tokenKey, fallback) : fallback;
  if (Number.isFinite(paraSpaceAfter)) tokenStyle.paraSpaceAfter = paraSpaceAfter;
  return tokenStyle;
}

export function resolveBodyTextStyle(
  theme,
  { paraSpaceAfter = 6, tokenKey = null } = {},
) {
  const resolvedTheme = resolveTheme(theme);
  const fallback = {
    fontFace: resolvedTheme.fonts.body,
    fontSize: resolvedTheme.typeSizes.body,
    color: resolvedTheme.colors.black,
    paraSpaceAfter,
  };
  return tokenKey ? resolveTokenTextStyle(resolvedTheme, tokenKey, fallback) : fallback;
}

export function resolveSourceTextStyle(
  theme,
  { paraSpaceAfter = 0, tokenKey = null } = {},
) {
  const resolvedTheme = resolveTheme(theme);
  const fallback = {
    fontFace: resolvedTheme.fonts.body,
    fontSize: resolvedTheme.typeSizes.source,
    color: resolvedTheme.colors.kpmgBlue,
    italic: true,
    paraSpaceAfter,
  };
  return tokenKey ? resolveTokenTextStyle(resolvedTheme, tokenKey, fallback) : fallback;
}

export function resolveHeadingTextStyle(
  theme,
  { colorKey = 'kpmgBlue', color = null, bold = true, tokenKey = null } = {},
) {
  const resolvedTheme = resolveTheme(theme);
  const fallback = {
    fontFace: resolvedTheme.fonts.body,
    fontSize: resolvedTheme.typeSizes.body,
    color: color || resolveThemeColor(resolvedTheme, colorKey, resolvedTheme.colors.kpmgBlue),
    bold,
  };
  return tokenKey ? resolveTokenTextStyle(resolvedTheme, tokenKey, fallback) : fallback;
}

export const THEME_COMPONENT_KEYS = Object.freeze({
  contents: 'contents',
  contentsSlide: 'contentsSlide',
  analysisNarrowTable: 'analysisNarrowTable',
  analysisBridge: 'analysisBridge',
  dividerSlide: 'dividerSlide',
  backCover: 'backCover',
});
