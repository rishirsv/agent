import PptxGenJS from 'pptxgenjs';

import { addCover } from '../builders/cover-slide.js';
import { addDivider } from '../builders/divider-slide.js';
import { addTwoColumnTextWithStrapline } from '../builders/two-column-text.js';
import { addAnalysisNarrowTable } from '../builders/analysis-narrow-table.js';
import {
  addAnalysisWideChart2ColsText,
  addAnalysisWideChartTableText,
} from '../builders/analysis-wide-chart-text.js';
import { addTitleStrapline4TextBoxes } from '../builders/title-strapline-4-boxes.js';
import { addBackCover } from '../builders/back-cover-slide.js';
import { addOneColumnText } from '../builders/one-column-text.js';
import { addContentsSlide } from '../builders/contents-slide.js';
import { normalizeBodyStyle } from '../helpers/layout.js';
import { paginateDeckSpec } from './paginate.js';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

const DENSITY_STATUS = Object.freeze({
  ok: 'OK',
  thin: 'thin but acceptable',
  sparse: 'too sparse, should be repaired or flagged',
});
const DIVIDER_TYPES = new Set(['divider', 'dividerDark', 'dividerLight']);
const EXCLUDED_FROM_LOGICAL_PAGING = new Set(['cover', 'backCover', ...DIVIDER_TYPES]);
const MAX_TEXT_ARRAY_LEVELS = 4;
const MAX_TEXT_ARRAY_CHILD_DEPTH = MAX_TEXT_ARRAY_LEVELS - 1;

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function extractText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  if (isPlainObject(value) && typeof value.text === 'string') {
    const ownText = value.text.trim();
    if (!Array.isArray(value.children)) return ownText;
    const childText = extractText(value.children);
    return `${ownText} ${childText}`.trim();
  }
  return '';
}

function countTextArrayItems(value) {
  if (!Array.isArray(value)) return 0;
  let count = 0;

  function visitNode(node) {
    if (typeof node === 'string') {
      count += 1;
      return;
    }
    if (!isPlainObject(node) || typeof node.text !== 'string') return;
    count += 1;
    if (!Array.isArray(node.children)) return;
    node.children.forEach((child) => visitNode(child));
  }

  value.forEach((item) => visitNode(item));
  return count;
}

function countTextArrayCharacters(value) {
  if (!Array.isArray(value)) return 0;
  let chars = 0;

  function visitNode(node) {
    if (typeof node === 'string') {
      chars += node.trim().length;
      return;
    }
    if (!isPlainObject(node) || typeof node.text !== 'string') return;
    chars += node.text.trim().length;
    if (!Array.isArray(node.children)) return;
    node.children.forEach((child) => visitNode(child));
  }

  value.forEach((item) => visitNode(item));
  return chars;
}

function isMissingSlotValue(value, def = {}) {
  if (value === null || value === undefined) return true;
  const kind = def?.kind;
  if (kind === 'text') return extractText(value).length === 0;
  if (kind === 'textArray' || kind === 'stringArray' || kind === 'kpiArray' || kind === 'columns' || kind === 'contentsSections') {
    return !Array.isArray(value) || value.length === 0;
  }
  if (kind === 'table') return !isPlainObject(value) || !Array.isArray(value.rows) || value.rows.length === 0;
  if (kind === 'chart') return !isPlainObject(value) || !Array.isArray(value.data) || value.data.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}

function countCharacters(value, kind = 'text') {
  if (kind === 'text') return extractText(value).length;
  if (kind === 'textArray' || kind === 'stringArray') {
    return countTextArrayCharacters(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => extractText(v)).join(' ').trim().length;
  }
  if (kind === 'table' && isPlainObject(value) && Array.isArray(value.rows)) {
    const headers = Array.isArray(value.headers) ? value.headers.join(' ') : '';
    const rows = value.rows
      .map((row) => (Array.isArray(row) ? row.join(' ') : ''))
      .join(' ');
    return `${headers} ${rows}`.trim().length;
  }
  if (kind === 'chart' && isPlainObject(value) && Array.isArray(value.data)) {
    return value.data
      .map((series) =>
        [
          extractText(series?.name),
          Array.isArray(series?.labels) ? series.labels.join(' ') : '',
          Array.isArray(series?.values) ? series.values.join(' ') : '',
        ].join(' '),
      )
      .join(' ')
      .trim().length;
  }
  return 0;
}

function getSlotQuantity(def, value) {
  const kind = def?.kind;
  if (kind === 'text') return countCharacters(value, kind);
  if (kind === 'textArray' || kind === 'stringArray') {
    return countTextArrayItems(value);
  }
  if (kind === 'kpiArray' || kind === 'columns' || kind === 'contentsSections') {
    return Array.isArray(value) ? value.length : 0;
  }
  if (kind === 'table') return Array.isArray(value?.rows) ? value.rows.length : 0;
  if (kind === 'chart') return Array.isArray(value?.data) ? value.data.length : 0;
  return isMissingSlotValue(value, def) ? 0 : 1;
}

function isCharDrivenSlot(def = {}) {
  return def.kind === 'text' || def.kind === 'textArray' || def.kind === 'stringArray';
}

function suggestRemedy(def = {}, code) {
  const kind = def?.kind;
  if (kind === 'chart') {
    return {
      hook: 'addChartSeries',
      suggestedRemedy: 'Add chart caption/source text and at least one chart data series.',
    };
  }
  if (kind === 'table') {
    return {
      hook: 'addTableRows',
      suggestedRemedy: 'Add table headers and rows; if content is large, split across two slides.',
    };
  }
  if (kind === 'kpiArray') {
    return { hook: 'addKpiItems', suggestedRemedy: 'Add KPI cards with value and label text.' };
  }
  if (kind === 'contentsSections') {
    return {
      hook: 'addContentsSections',
      suggestedRemedy: 'Add section number, title, page range, and items for each contents block.',
    };
  }
  if (kind === 'columns') {
    return {
      hook: 'addColumns',
      suggestedRemedy: 'Add text to each column; keep each column balanced for readability.',
    };
  }
  if (code === 'below_min_chars') {
    return { hook: 'addBullets', suggestedRemedy: 'Add bullets or paragraph text to reach the minimum content density.' };
  }
  return { hook: 'addBullets', suggestedRemedy: 'Add bullets and supporting text to this slot.' };
}

function buildSlotIssue(slotName, def, code, message, severity, extra = {}) {
  const remedy = suggestRemedy(def, code);
  return {
    slot: slotName,
    kind: def?.kind || 'unknown',
    code,
    message,
    severity,
    hook: remedy.hook,
    suggestedRemedy: remedy.suggestedRemedy,
    ...extra,
  };
}

function validateTypedSlotValue(slotName, def, value) {
  const errors = [];
  const warnings = [];
  const kind = def?.kind;
  const quantity = getSlotQuantity(def, value);
  const charCount = countCharacters(value, kind);

  const fail = (message) => errors.push(`${slotName} ${message}`);
  const warn = (message) => warnings.push(`${slotName} ${message}`);

  if (kind === 'text') {
    if (typeof value !== 'string') fail('must be a string');
    return { errors, warnings, quantity, charCount };
  }

  if (kind === 'textArray' || kind === 'stringArray') {
    if (!Array.isArray(value)) {
      fail('must be an array');
      return { errors, warnings, quantity, charCount };
    }

    let itemCount = 0;
    let blankEntries = 0;

    function visitNode(node, { path = '', depth = 0 } = {}) {
      if (Array.isArray(node)) {
        fail(`contains legacy nested array at ${path}; use object children instead`);
        return;
      }
      if (typeof node === 'string') {
        itemCount += 1;
        if (node.trim().length === 0) blankEntries += 1;
        return;
      }
      if (!isPlainObject(node)) {
        fail(`contains invalid item at ${path}; expected string or object`);
        return;
      }
      if (typeof node.text !== 'string') {
        fail(`contains object without string text at ${path}`);
        return;
      }

      itemCount += 1;
      if (node.text.trim().length === 0) blankEntries += 1;

      if (!Object.prototype.hasOwnProperty.call(node, 'children')) return;

      if (node.header || node.subheader) {
        fail(`item ${path} cannot define children when header/subheader is true`);
      }

      if (!Array.isArray(node.children)) {
        fail(`item ${path} children must be an array`);
        return;
      }

      if (depth >= MAX_TEXT_ARRAY_CHILD_DEPTH && node.children.length > 0) {
        fail(`item ${path} exceeds max nesting depth (${MAX_TEXT_ARRAY_LEVELS} levels)`);
        return;
      }

      node.children.forEach((child, idx) =>
        visitNode(child, { path: `${path}.children[${idx}]`, depth: depth + 1 }),
      );
    }

    value.forEach((item, idx) => visitNode(item, { path: `[${idx}]`, depth: 0 }));

    if (blankEntries === itemCount && itemCount > 0) {
      fail('array has no non-whitespace text items');
    } else if (blankEntries > 0) {
      warn(`contains ${blankEntries} empty text item(s)`);
    }
    return { errors, warnings, quantity, charCount };
  }

  if (kind === 'kpiArray') {
    if (!Array.isArray(value)) {
      fail('must be an array');
      return { errors, warnings, quantity, charCount };
    }
    value.forEach((item, idx) => {
      if (!isPlainObject(item)) {
        fail(`contains non-object item at index ${idx}`);
        return;
      }
      if (extractText(item.value).length === 0) warn(`item ${idx} missing KPI value`);
      if (extractText(item.label).length === 0) warn(`item ${idx} missing KPI label`);
    });
    return { errors, warnings, quantity, charCount };
  }

  if (kind === 'columns') {
    if (!Array.isArray(value)) {
      fail('must be an array');
      return { errors, warnings, quantity, charCount };
    }
    value.forEach((item, idx) => {
      if (!isPlainObject(item)) {
        fail(`contains non-object item at index ${idx}`);
        return;
      }
      const heading = extractText(item.heading || item.title);
      const body = Array.isArray(item.body) ? item.body : [];
      if (!heading && body.length === 0) warn(`column ${idx} has no heading and no body items`);
    });
    return { errors, warnings, quantity, charCount };
  }

  if (kind === 'contentsSections') {
    if (!Array.isArray(value)) {
      fail('must be an array');
      return { errors, warnings, quantity, charCount };
    }
    value.forEach((item, idx) => {
      if (!isPlainObject(item)) {
        fail(`contains non-object section at index ${idx}`);
        return;
      }
      if (!extractText(item.number)) warn(`section ${idx} missing number`);
      if (!extractText(item.title)) warn(`section ${idx} missing title`);
      if (item.items !== undefined && !Array.isArray(item.items)) {
        fail(`section ${idx} has non-array items`);
      }
    });
    return { errors, warnings, quantity, charCount };
  }

  if (kind === 'table') {
    if (!isPlainObject(value)) {
      fail('must be an object');
      return { errors, warnings, quantity, charCount };
    }
    if (!Array.isArray(value.headers)) fail('must include headers array');
    if (!Array.isArray(value.rows)) fail('must include rows array');
    if (Array.isArray(value.rows)) {
      const invalidRows = value.rows.filter((row) => !Array.isArray(row)).length;
      if (invalidRows > 0) fail(`contains ${invalidRows} non-array row(s)`);
    }
    return { errors, warnings, quantity, charCount };
  }

  if (kind === 'chart') {
    if (!isPlainObject(value)) {
      fail('must be an object');
      return { errors, warnings, quantity, charCount };
    }
    if (!Array.isArray(value.data)) {
      fail('must include data array');
      return { errors, warnings, quantity, charCount };
    }
    value.data.forEach((series, idx) => {
      if (!isPlainObject(series)) {
        fail(`series ${idx} must be an object`);
        return;
      }
      if (!Array.isArray(series.values) || series.values.length === 0) {
        fail(`series ${idx} must include values array`);
      }
    });
    return { errors, warnings, quantity, charCount };
  }

  return { errors, warnings, quantity, charCount };
}

function slotValidationResult(
  slotName,
  def,
  value,
  { allowSparse = false, hasValue = false, enforceMinimums = true } = {},
) {
  const errors = [];
  const warnings = [];
  const slotIssues = [];
  const missing = isMissingSlotValue(value, def);
  const priority = def?.renderingHints?.priority || 'medium';
  const shouldWarnOnly = allowSparse || priority === 'low';
  const addIssue = (code, message, severity, extra = {}) => {
    slotIssues.push(buildSlotIssue(slotName, def, code, message, severity, extra));
  };

  if (def.required && missing) {
    const message = `Missing required: ${slotName}`;
    errors.push(message);
    addIssue('missing_required', message, 'error');
    return { errors, warnings, missingRequired: true, quantity: 0, charCount: 0, slotIssues };
  }
  if (missing) {
    if (hasValue && def.allowEmpty === false) {
      const message = `Slot "${slotName}" may not be empty`;
      const severity = shouldWarnOnly ? 'warning' : 'error';
      (severity === 'warning' ? warnings : errors).push(message);
      addIssue('empty_not_allowed', message, severity);
    }
    return { errors, warnings, missingRequired: false, quantity: 0, charCount: 0, slotIssues };
  }

  const typed = validateTypedSlotValue(slotName, def, value);
  for (const e of typed.errors) {
    errors.push(e);
    addIssue('type_mismatch', e, 'error');
  }
  for (const w of typed.warnings) warnings.push(w);

  if (typeof value === 'string') {
    const maxChars = def.maxChars || def.maxLength;
    if (maxChars && value.length > maxChars) {
      const message = `${slotName} exceeds maxChars (${maxChars})`;
      const hardLimit = slotName === 'title' || def.enforceMaxChars === true;
      if (hardLimit) {
        errors.push(message);
        addIssue('exceeds_max_chars', message, 'error', { actual: value.length, target: maxChars });
      } else {
        warnings.push(`${message}, may shrink to fit`);
        addIssue('exceeds_max_chars', message, 'warning', { actual: value.length, target: maxChars });
      }
    }
    if (def.pattern && !(new RegExp(def.pattern).test(value))) {
      const message = `${slotName} doesn't match pattern: ${def.pattern}`;
      errors.push(message);
      addIssue('pattern_mismatch', message, 'error');
    }
  }

  const quantity = typed.quantity;
  const charCount = typed.charCount;
  if (enforceMinimums && def.minItems && quantity < def.minItems) {
    const message = `${slotName} requires at least ${def.minItems} item(s)`;
    const severity = shouldWarnOnly ? 'warning' : 'error';
    (severity === 'warning' ? warnings : errors).push(message);
    addIssue('below_min_items', message, severity, { actual: quantity, target: def.minItems });
  }

  if (enforceMinimums && def.minChars && charCount < def.minChars) {
    const message = `${slotName} below minChars (${def.minChars})`;
    const severity = shouldWarnOnly ? 'warning' : 'error';
    (severity === 'warning' ? warnings : errors).push(message);
    addIssue('below_min_chars', message, severity, { actual: charCount, target: def.minChars });
  }

  return { errors, warnings, missingRequired: false, quantity, charCount, slotIssues };
}

function computeDensity(layout, slotMetrics = []) {
  const densityTarget = layout?.densityTarget || {};
  const minScore = Number(densityTarget.minScore || 0);
  if (minScore <= 0) {
    return {
      minScore,
      score: 1,
      acceptableFloor: 1,
      status: DENSITY_STATUS.ok,
      thin: false,
      tooSparse: false,
      shouldRepair: false,
    };
  }

  let weightedActual = 0;
  let weightedTarget = 0;
  for (const m of slotMetrics) {
    const priority = m?.priority || 'medium';
    const weight = priority === 'high' ? 1 : priority === 'low' ? 0.35 : 0.65;
    const target = Number(m?.target || 0);
    if (target <= 0) continue;
    weightedTarget += target * weight;
    weightedActual += Math.min(target, Number(m?.actual || 0)) * weight;
  }

  const score = weightedTarget > 0 ? weightedActual / weightedTarget : 1;
  const acceptableFloor = Number(
    densityTarget.acceptableFloor || Math.max(0.45, Number((minScore * 0.85).toFixed(3))),
  );
  const status =
    score >= minScore
      ? DENSITY_STATUS.ok
      : score >= acceptableFloor
        ? DENSITY_STATUS.thin
        : DENSITY_STATUS.sparse;
  return {
    minScore,
    score,
    acceptableFloor,
    status,
    thin: status !== DENSITY_STATUS.ok,
    tooSparse: status === DENSITY_STATUS.sparse,
    shouldRepair: status === DENSITY_STATUS.sparse,
  };
}

function dedupeRepairSuggestions(items = []) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item?.slot || ''}|${item?.hook || ''}|${item?.suggestedRemedy || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function dedupeSlotIssueRows(items = []) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item?.slideIndex ?? ''}|${item?.slideType ?? ''}|${item?.slot ?? ''}|${item?.code ?? ''}|${item?.message ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function dedupeStringList(items = []) {
  return [...new Set((items || []).map((item) => String(item)))];
}

function formatTableWarningMessage(warning = {}) {
  const slideIndex = Number.isFinite(warning.slideIndex) ? warning.slideIndex : '?';
  const slideType = warning.slideType || 'unknown';
  const code = warning.code || 'table_warning';
  const message = warning.message || 'Table formatting warning.';
  return `slides[${slideIndex}] (${slideType}) [${code}] ${message}`;
}

function collectRepeatedBodyLineWarnings(slides = []) {
  const lineMap = new Map();

  function visitBodyItems(items, emit) {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (typeof item === 'string') {
        emit(item);
        return;
      }
      if (!isPlainObject(item) || typeof item.text !== 'string') return;
      emit(item.text);
      if (Array.isArray(item.children)) visitBodyItems(item.children, emit);
    });
  }

  slides.forEach((slideSpec, slideIndex) => {
    const body = Array.isArray(slideSpec?.body) ? slideSpec.body : [];
    visitBodyItems(body, (rawText) => {
      const text = String(rawText ?? '').replace(/\s+/g, ' ').trim();
      if (!text || text.length < 40) return;
      const key = text.toLowerCase();
      if (!lineMap.has(key)) {
        lineMap.set(key, { text, slides: new Set() });
      }
      lineMap.get(key).slides.add(slideIndex);
    });
  });

  const warnings = [];
  for (const entry of lineMap.values()) {
    if (entry.slides.size <= 2) continue;
    const preview = entry.text.length > 88 ? `${entry.text.slice(0, 85)}...` : entry.text;
    warnings.push(
      `Repeated body line appears on ${entry.slides.size} slides: "${preview}"`,
    );
  }
  return warnings;
}

function normalizeSlideSpec(slideSpec) {
  const s = deepClone(slideSpec || {});
  if (s.bodyStyle !== undefined) s.bodyStyle = normalizeBodyStyle(s.bodyStyle);
  if (s.type === 'contents' && !Array.isArray(s.sections)) {
    s.sections = [];
  }
  return s;
}

export function validateSlideContent(type, content, templatePackage, options = {}) {
  const layout = templatePackage?.layouts?.types?.[type];
  if (!layout) return { valid: false, errors: [`Unknown type: ${type}`], warnings: [] };

  const allowSparse = Boolean(options.allowSparse);
  const enforceMinimums = options.enforceDensity !== false;
  const errors = [];
  const warnings = [];
  const slots = layout.slots || {};
  const missingSlots = [];
  const slotIssues = [];
  const slotMetrics = [];

  for (const [name, def] of Object.entries(slots)) {
    const hasValue = Object.prototype.hasOwnProperty.call(content || {}, name);
    const value = content?.[name];
    const res = slotValidationResult(name, def, value, {
      allowSparse,
      hasValue,
      enforceMinimums,
    });
    for (const e of res.errors) errors.push(e);
    for (const w of res.warnings) warnings.push(w);
    for (const issue of res.slotIssues || []) slotIssues.push(issue);
    if (res.missingRequired) {
      missingSlots.push(name);
    }

    const target = isCharDrivenSlot(def)
      ? Number(def.minChars || 0)
      : Number(def.minItems || 0);
    const actual = isCharDrivenSlot(def) ? res.charCount : res.quantity;
    const includeInDensity = def.required || hasValue;
    slotMetrics.push({
      slot: name,
      kind: def.kind,
      actual,
      target: includeInDensity ? target : 0,
      priority: def?.renderingHints?.priority || 'medium',
    });
  }

  const density = computeDensity(layout, slotMetrics);
  if (options.enforceDensity !== false && density.tooSparse) {
    const message = `Slide content ${DENSITY_STATUS.sparse} (density ${density.score.toFixed(2)} < ${density.acceptableFloor.toFixed(2)})`;
    (allowSparse ? warnings : errors).push(message);
    slotIssues.push(
      buildSlotIssue(
        '_slide',
        { kind: 'textArray' },
        'density_too_sparse',
        message,
        allowSparse ? 'warning' : 'error',
        { actual: Number(density.score.toFixed(3)), target: density.minScore },
      ),
    );
  } else if (options.enforceDensity !== false && density.status === DENSITY_STATUS.thin) {
    warnings.push(
      `Slide content ${DENSITY_STATUS.thin} (density ${density.score.toFixed(2)} < ${density.minScore.toFixed(2)})`,
    );
  }

  if (layout.templateLayout) {
    const detected = templatePackage?.layouts?.detectedLayoutSlots?.[layout.templateLayout];
    if (detected && detected.slotTypes) {
      for (const [name, def] of Object.entries(slots)) {
        if (def.kind === 'chart' && !detected.slotTypes.chart) {
          warnings.push(
            `Template layout "${layout.templateLayout}" has no chart target shape; slot "${name}" may not render as intended`,
          );
        }
      }
    }
  }

  const repairSuggestions = dedupeRepairSuggestions(
    slotIssues.map((issue) => ({
      slot: issue.slot,
      hook: issue.hook,
      severity: issue.severity,
      issueCode: issue.code,
      suggestedRemedy: issue.suggestedRemedy,
    })),
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    qa: {
      missingSlots,
      slotIssues,
      slotMetrics,
      density,
      repairSuggestions,
    },
  };
}

export function validateDeckSpecWithTemplate(deckSpec, templatePackage, options = {}) {
  const errors = [];
  const warnings = [];
  const densityFindings = [];
  const thinSlides = [];
  const sparseSlides = [];
  const missingSlots = [];
  const slotIssues = [];
  const slotMetrics = [];
  const repairSuggestions = [];
  const allowSparse = Boolean(options.allowSparse || deckSpec?.metadata?.allowSparse);

  if (!deckSpec || typeof deckSpec !== 'object') {
    return {
      valid: false,
      errors: ['Deck spec must be an object'],
      warnings: [],
      qa: {
        densityFindings,
        thinSlides,
        sparseSlides,
        missingSlots,
        slotIssues,
        slotMetrics,
        repairSuggestions,
      },
    };
  }
  if (!Array.isArray(deckSpec.slides)) {
    return {
      valid: false,
      errors: ['Deck spec missing `slides` array'],
      warnings: [],
      qa: {
        densityFindings,
        thinSlides,
        sparseSlides,
        missingSlots,
        slotIssues,
        slotMetrics,
        repairSuggestions,
      },
    };
  }

  deckSpec.slides.forEach((rawSlideSpec, idx) => {
    const slideSpec = normalizeSlideSpec(rawSlideSpec);
    if (!slideSpec || typeof slideSpec !== 'object') {
      errors.push(`slides[${idx}] must be an object`);
      return;
    }
    if (!slideSpec.type || typeof slideSpec.type !== 'string') {
      errors.push(`slides[${idx}] missing string 'type'`);
      return;
    }
    const v = validateSlideContent(slideSpec.type, slideSpec, templatePackage, {
      enforceDensity: true,
      allowSparse,
    });
    if (!v.valid) {
      for (const e of v.errors) errors.push(`slides[${idx}]: ${e}`);
    }
    for (const w of v.warnings || []) warnings.push(`slides[${idx}]: ${w}`);
    for (const slot of v?.qa?.missingSlots || []) {
      missingSlots.push({ slideIndex: idx, slideType: slideSpec.type, slot });
    }
    if (v?.qa?.density) {
      const status = v.qa.density.status;
      const finding = {
        slideIndex: idx,
        slideType: slideSpec.type,
        status,
        score: Number(v.qa.density.score.toFixed(3)),
        minScore: v.qa.density.minScore,
        acceptableFloor: v.qa.density.acceptableFloor,
        shouldRepair: Boolean(v.qa.density.shouldRepair),
      };
      densityFindings.push(finding);
      if (status === DENSITY_STATUS.thin) thinSlides.push(finding);
      if (status === DENSITY_STATUS.sparse) sparseSlides.push(finding);
    }
    for (const issue of v?.qa?.slotIssues || []) {
      slotIssues.push({
        slideIndex: idx,
        slideType: slideSpec.type,
        slot: issue.slot,
        kind: issue.kind,
        code: issue.code,
        message: issue.message,
        severity: issue.severity,
        actual: issue.actual ?? null,
        target: issue.target ?? null,
        hook: issue.hook,
        suggestedRemedy: issue.suggestedRemedy,
      });
    }
    for (const suggestion of v?.qa?.repairSuggestions || []) {
      repairSuggestions.push({
        slideIndex: idx,
        slideType: slideSpec.type,
        slot: suggestion.slot || null,
        hook: suggestion.hook,
        severity: suggestion.severity || 'warning',
        issueCode: suggestion.issueCode || 'general',
        suggestedRemedy: suggestion.suggestedRemedy,
      });
    }
    for (const metric of v?.qa?.slotMetrics || []) {
      slotMetrics.push({
        slideIndex: idx,
        slideType: slideSpec.type,
        slot: metric.slot,
        kind: metric.kind,
        actual: Number(metric.actual || 0),
        target: Number(metric.target || 0),
        priority: metric.priority || 'medium',
      });
      if (metric.target > 0 && metric.actual < metric.target) {
        const slotIssue = slotIssues.find(
          (candidate) =>
            candidate.slideIndex === idx &&
            candidate.slideType === slideSpec.type &&
            candidate.slot === metric.slot &&
            candidate.code !== 'density_too_sparse',
        );
        if (!slotIssue) {
          const remedy = suggestRemedy({ kind: metric.kind }, 'below_min_chars');
          slotIssues.push({
            slideIndex: idx,
            slideType: slideSpec.type,
            slot: metric.slot,
            kind: metric.kind,
            code: 'below_target',
            message: `${metric.slot} is below density target (${metric.actual} < ${metric.target})`,
            severity: 'warning',
            actual: metric.actual,
            target: metric.target,
            hook: remedy.hook,
            suggestedRemedy: remedy.suggestedRemedy,
          });
        }
      }
    }
  });

  for (const repetitionWarning of collectRepeatedBodyLineWarnings(deckSpec.slides || [])) {
    warnings.push(repetitionWarning);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    qa: {
      densityFindings,
      thinSlides,
      sparseSlides,
      missingSlots,
      slotIssues: dedupeSlotIssueRows(slotIssues),
      slotMetrics,
      repairSuggestions: dedupeRepairSuggestions(repairSuggestions),
    },
  };
}

function addMasterOverlayObjects(templatePackage, variantConfig) {
  const objects = [];
  for (const overlay of variantConfig?.overlays || []) {
    const imagePath = templatePackage.resolveAssetPath(overlay.assetKey);
    if (!imagePath) continue;
    objects.push({ image: { path: imagePath, x: overlay.x, y: overlay.y, w: overlay.w, h: overlay.h } });
  }
  return objects;
}

function hydrateFooterText(template, footerValues = {}) {
  const source = String(template || '');
  const tokenMap = {
    '[year]': footerValues.year ? String(footerValues.year) : '',
    '[legal member firm name]': footerValues.legalEntityName || '',
    '[jurisdiction]': footerValues.jurisdiction || '',
    '[legal structure]': footerValues.legalStructure || '',
  };
  let out = source;
  for (const [token, value] of Object.entries(tokenMap)) {
    out = out.split(token).join(value);
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function buildFooterValues(deckSpec, { allowSparse = false } = {}) {
  const metadata = deckSpec?.metadata || {};
  const footer = metadata?.footer || {};
  const isDemoMode = Boolean(allowSparse || metadata.allowSparse);

  const values = {
    year: footer.year ?? metadata.year ?? new Date().getFullYear(),
    legalEntityName: footer.legalEntityName ?? metadata.company ?? '',
    jurisdiction: footer.jurisdiction ?? metadata.jurisdiction ?? '',
    legalStructure: footer.legalStructure ?? metadata.legalStructure ?? 'limited liability partnership',
    documentClassification: footer.documentClassification ?? metadata.documentClassification ?? '',
    officeContactText: footer.officeContactText ?? metadata.officeContactText ?? '',
  };

  if (!isDemoMode) {
    const missing = [];
    if (!String(values.year || '').trim()) missing.push('metadata.footer.year');
    if (!String(values.legalEntityName || '').trim()) missing.push('metadata.footer.legalEntityName');
    if (!String(values.jurisdiction || '').trim()) missing.push('metadata.footer.jurisdiction');
    if (!String(values.legalStructure || '').trim()) missing.push('metadata.footer.legalStructure');
    if (missing.length) {
      throw new Error(
        `Missing required footer metadata for non-demo render: ${missing.join(', ')}`,
      );
    }
  }

  return values;
}

function addFooterChromeObjects(templatePackage, footerChrome, footerValues = {}) {
  const objects = [];
  const logoPath = templatePackage.resolveAssetPath('logoSvg');
  if (logoPath && footerChrome?.logo) {
    objects.push({ image: { path: logoPath, ...footerChrome.logo } });
  }
  if (footerChrome?.legalText) {
    const legalText = hydrateFooterText(footerChrome.legalText.text, footerValues);
    objects.push({
      text: {
        text: legalText,
        options: {
          x: footerChrome.legalText.x,
          y: footerChrome.legalText.y,
          w: footerChrome.legalText.w,
          h: footerChrome.legalText.h,
          fontFace: footerChrome.legalText.fontFace,
          fontSize: footerChrome.legalText.fontSize,
          color: footerChrome.legalText.color,
          valign: 'mid',
        },
      },
    });
  }
  const officeContact = String(footerValues.officeContactText || footerChrome?.officeContactText?.text || '').trim();
  if (officeContact) {
    objects.push({
      text: {
        text: officeContact,
        options: {
          x: footerChrome.officeContactText.x,
          y: footerChrome.officeContactText.y,
          w: footerChrome.officeContactText.w,
          h: footerChrome.officeContactText.h,
          fontFace: footerChrome.officeContactText.fontFace,
          fontSize: footerChrome.officeContactText.fontSize,
          color: footerChrome.officeContactText.color,
          align: footerChrome.officeContactText.align || 'left',
          valign: 'mid',
        },
      },
    });
  }
  if (footerChrome?.classificationText) {
    const classification =
      String(footerValues.documentClassification || '').trim() ||
      String(footerChrome.classificationText.text || '').trim();
    const classificationText =
      classification && classification.toLowerCase().startsWith('document classification:')
        ? classification
        : classification
          ? `Document Classification: ${classification}`
          : '';
    objects.push({
      text: {
        text: classificationText,
        options: {
          x: footerChrome.classificationText.x,
          y: footerChrome.classificationText.y,
          w: footerChrome.classificationText.w,
          h: footerChrome.classificationText.h,
          fontFace: footerChrome.classificationText.fontFace,
          fontSize: footerChrome.classificationText.fontSize,
          color: footerChrome.classificationText.color,
          align: footerChrome.classificationText.align || 'right',
          valign: 'mid',
        },
      },
    });
  }
  if (footerChrome?.separatorLine) {
    objects.push({
      line: {
        x: footerChrome.separatorLine.x,
        y: footerChrome.separatorLine.y,
        w: footerChrome.separatorLine.w,
        h: footerChrome.separatorLine.h,
        line: footerChrome.separatorLine.line,
      },
    });
  }
  return objects;
}

function defineMasters(pptx, templatePackage, footerValues = {}) {
  const masters = templatePackage.layouts?.masters || {};
  const variants = masters.variants || {};
  const footerChrome = masters.footerChrome || null;

  for (const variantConfig of Object.values(variants)) {
    const objects = [
      ...addMasterOverlayObjects(templatePackage, variantConfig),
      ...(variantConfig.includeFooter ? addFooterChromeObjects(templatePackage, footerChrome, footerValues) : []),
    ];

    pptx.defineSlideMaster({
      title: variantConfig.masterName,
      background: { color: variantConfig.backgroundColor || 'FFFFFF' },
      ...(objects.length ? { objects } : {}),
    });
  }
}

function normalizeSectionKey(value) {
  return String(value || '').trim().toLowerCase();
}

function setRange(map, key, page) {
  if (!key || !Number.isFinite(page) || page <= 0) return;
  const prev = map.get(key);
  if (!prev) {
    map.set(key, { start: page, end: page });
    return;
  }
  map.set(key, { start: Math.min(prev.start, page), end: Math.max(prev.end, page) });
}

function formatPageRange(start, end) {
  if (!Number.isFinite(start) || start <= 0) return '';
  if (!Number.isFinite(end) || end <= 0 || end === start) return `(p. ${start})`;
  return `(p. ${start}-${end})`;
}

function applyAutoContentsPageRanges(slides, templatePackage) {
  const sectionRangesByNumber = new Map();
  const sectionRangesByTitle = new Map();
  let logicalPage = 0;
  let activeSectionNumber = '';
  let activeSectionTitle = '';

  const list = Array.isArray(slides) ? slides : [];
  for (const slide of list) {
    const isDivider = DIVIDER_TYPES.has(slide?.type);
    if (isDivider) {
      activeSectionNumber = String(slide?.sectionNumber || '').trim();
      activeSectionTitle = normalizeSectionKey(slide?.sectionTitle);
      continue;
    }

    if (!shouldRenderLogicalPageNumber(slide, templatePackage)) continue;
    logicalPage += 1;

    if (slide?.type === 'contents') continue;
    if (activeSectionNumber) setRange(sectionRangesByNumber, activeSectionNumber, logicalPage);
    if (activeSectionTitle) setRange(sectionRangesByTitle, activeSectionTitle, logicalPage);
  }

  return list.map((slide) => {
    if (slide?.type !== 'contents' || !Array.isArray(slide.sections)) return slide;
    const sections = slide.sections.map((section) => {
      const byNumber = sectionRangesByNumber.get(String(section?.number || '').trim());
      const byTitle = sectionRangesByTitle.get(normalizeSectionKey(section?.title));
      const range = byNumber || byTitle;
      if (!range) return section;
      return {
        ...section,
        pageRange: formatPageRange(range.start, range.end),
      };
    });
    return { ...slide, sections };
  });
}

function getMasterNameForSlide(slideSpec, templatePackage) {
  const variants = templatePackage.layouts?.masters?.variants || {};
  if (slideSpec.type === 'cover') return variants.cover?.masterName || 'KPMG_COVER';
  if (slideSpec.type === 'backCover') return variants.closing?.masterName || 'KPMG_CLOSING';
  if (slideSpec.type === 'dividerLight' || (slideSpec.type === 'divider' && slideSpec.variant === 'light')) {
    return variants.sectionLight?.masterName || 'KPMG_SECTION_LIGHT';
  }
  if (slideSpec.type === 'dividerDark' || slideSpec.type === 'divider') return variants.sectionDark?.masterName || 'KPMG_SECTION_DARK';
  return variants.white?.masterName || 'KPMG_WHITE';
}

function getVariantByMasterName(templatePackage, masterName) {
  const variants = templatePackage.layouts?.masters?.variants || {};
  return Object.values(variants).find((v) => v?.masterName === masterName) || null;
}

function shouldRenderLogicalPageNumber(slideSpec, templatePackage) {
  if (EXCLUDED_FROM_LOGICAL_PAGING.has(slideSpec?.type)) return false;
  const masterName = getMasterNameForSlide(slideSpec, templatePackage);
  const variant = getVariantByMasterName(templatePackage, masterName);
  return Boolean(variant?.includeFooter);
}

function addLogicalPageNumber(slide, templatePackage, pageNumber) {
  const page = templatePackage.layouts?.masters?.footerChrome?.slideNumber;
  if (!slide || !page || !Number.isFinite(pageNumber) || pageNumber <= 0) return;
  slide.addText(String(pageNumber), {
    x: page.x,
    y: page.y,
    w: page.w,
    h: page.h,
    fontFace: page.fontFace,
    fontSize: page.fontSize,
    color: page.color,
    align: page.align || 'right',
    valign: 'mid',
    margin: 0,
  });
}

function requireAssetPath(assetPath, assetKey, slideType) {
  if (assetPath) return assetPath;
  throw new Error(`Missing required template asset "${assetKey}" for slide type "${slideType}"`);
}

function buildSlide(pptx, rawSlideSpec, templatePackage, runtimeContext = {}) {
  const slideSpec = normalizeSlideSpec(rawSlideSpec);
  const masterName = getMasterNameForSlide(slideSpec, templatePackage);
  const layouts = templatePackage.layouts?.types || {};
  const layout = layouts[slideSpec.type] || null;
  const geometry = layout?.geometry || null;

  if (slideSpec.type === 'cover') {
    const logoWhite = requireAssetPath(
      templatePackage.resolveAssetPath('logoWhitePng') || templatePackage.resolveAssetPath('logoWhiteSvg'),
      'logoWhitePng/logoWhiteSvg',
      'cover',
    );
    const coverPhoto = requireAssetPath(
      templatePackage.resolveAssetPath('coverPhoto'),
      'coverPhoto',
      'cover',
    );
    return addCover(pptx, {
      title: slideSpec.title,
      subtitle: slideSpec.subtitle,
      masterName,
      geometry,
      assets: { logoWhite, coverPhoto },
    });
  }
  if (slideSpec.type === 'divider' || slideSpec.type === 'dividerDark' || slideSpec.type === 'dividerLight') {
    return addDivider(pptx, {
      sectionNumber: slideSpec.sectionNumber,
      sectionTitle: slideSpec.sectionTitle,
      masterName,
      geometry,
      assets: { gradientDivider: templatePackage.resolveAssetPath('gradientDividerWindow') },
      textStyles:
        slideSpec.type === 'dividerLight' || slideSpec.variant === 'light'
          ? { sectionNumber: { color: '00338D' }, sectionTitle: { color: '00338D' } }
          : null,
    });
  }

  const builderByType = {
    contents: addContentsSlide,
    twoColumnText: addTwoColumnTextWithStrapline,
    oneColumnText: addOneColumnText,
    analysisNarrowTable: addAnalysisNarrowTable,
    analysisWideChart2ColsText: addAnalysisWideChart2ColsText,
    analysisWideChartTableText: addAnalysisWideChartTableText,
    titleStrapline4TextBoxes: addTitleStrapline4TextBoxes,
  };
  const builder = builderByType[slideSpec.type];
  if (builder) return builder(pptx, { ...slideSpec, masterName, geometry });
  if (slideSpec.type === 'backCover') {
    const gradientBackCover = requireAssetPath(
      templatePackage.resolveAssetPath('gradientBackCover'),
      'gradientBackCover',
      'backCover',
    );
    return addBackCover(pptx, {
      ...slideSpec,
      masterName,
      geometry,
      assets: { gradientBackCover },
      footerValues: runtimeContext.footerValues || {},
      resolveAssetPath: templatePackage.resolveAssetPath,
    });
  }
  throw new Error(`Unknown type: ${slideSpec.type}`);
}

export function renderDeck(deckSpec, templatePackage, options = {}) {
  const allowSparse = Boolean(options.allowSparse || deckSpec?.metadata?.allowSparse);
  const validation =
    options.validationResult ||
    validateDeckSpecWithTemplate(deckSpec, templatePackage, {
      allowSparse,
    });
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  const pptx = new PptxGenJS();
  const dims = templatePackage.tokens?.dimensions || { w: 13.333, h: 7.5 };
  pptx.defineLayout({ name: 'KPMG_WIDE', width: dims.w, height: dims.h });
  pptx.layout = 'KPMG_WIDE';

  if (deckSpec.metadata) {
    if (deckSpec.metadata.author) pptx.author = deckSpec.metadata.author;
    if (deckSpec.metadata.company) pptx.company = deckSpec.metadata.company;
    if (deckSpec.metadata.title) pptx.title = deckSpec.metadata.title;
    if (deckSpec.metadata.subject) pptx.subject = deckSpec.metadata.subject;
  }

  const headFontFace = templatePackage.tokens?.fonts?.heading || 'Arial';
  const bodyFontFace = templatePackage.tokens?.fonts?.body || 'Arial';
  pptx.theme = { headFontFace, bodyFontFace };

  const footerValues = buildFooterValues(deckSpec, { allowSparse });
  defineMasters(pptx, templatePackage, footerValues);

  const normalized = {
    ...deckSpec,
    slides: (deckSpec.slides || []).map(normalizeSlideSpec),
  };
  const paginated = paginateDeckSpec(normalized, templatePackage.layouts?.types || {});
  const paginatedSlides = applyAutoContentsPageRanges(paginated?.slides || [], templatePackage);
  const paginationDecisions = paginated?.paginationDecisions || [];
  const overflowEvents = paginated?.overflowEvents || [];
  const tableWarnings = paginated?.tableWarnings || [];
  const tableWarningMessages = tableWarnings.map((warning) => formatTableWarningMessage(warning));
  const pagination = paginationDecisions.map((event) => ({ ...event }));
  const overflowRisks = overflowEvents
    .filter((event) => Number(event?.splitInto || 0) > 1)
    .map((event) => ({
      slideIndex: event.slideIndex,
      slideType: event.slideType,
      mode: event.mode,
      splitInto: event.splitInto,
      severity: Number(event.splitInto) >= 3 ? 'warning' : 'info',
      reason: 'auto_split',
      suggestedRemedy: `Slide was auto-split into ${event.splitInto} pages; keep split or tighten content.`,
    }));
  const masterApplied = [];
  let logicalPageNumber = 0;
  for (const slideSpec of paginatedSlides) {
    const v = validateSlideContent(slideSpec.type, slideSpec, templatePackage, {
      enforceDensity: false,
      allowSparse,
    });
    if (!v.valid) throw new Error(v.errors.join(', '));

    const expectedMaster = getMasterNameForSlide(slideSpec, templatePackage);
    const slide = buildSlide(pptx, slideSpec, templatePackage, { footerValues });
    const appliedMaster = slide?._slideLayout?._name || slide?._name || expectedMaster;
    masterApplied.push({
      slideIndex: masterApplied.length,
      slideType: slideSpec.type,
      expectedMaster,
      appliedMaster,
      matched: expectedMaster === appliedMaster,
    });
    if (shouldRenderLogicalPageNumber(slideSpec, templatePackage)) {
      logicalPageNumber += 1;
      addLogicalPageNumber(slide, templatePackage, logicalPageNumber);
    }
    if (slideSpec.notes && slide) slide.addNotes(slideSpec.notes);
  }
  const masterMismatches = masterApplied.filter((item) => !item.matched);
  if (masterMismatches.length > 0 && options.failOnMasterMismatch !== false) {
    const details = masterMismatches
      .map((item) => `slides[${item.slideIndex}] ${item.slideType}: expected ${item.expectedMaster}, got ${item.appliedMaster}`)
      .join('; ');
    throw new Error(`Master mismatch detected: ${details}`);
  }
  return {
    pptx,
    warnings: dedupeStringList([...(validation.warnings || []), ...tableWarningMessages]),
    qa: {
      warnings: tableWarningMessages,
      pagination,
      paginationDecisions,
      overflowEvents,
      overflowRisks,
      tableWarnings,
      masterApplied,
      densityFindings: validation?.qa?.densityFindings || [],
      thinSlides: validation?.qa?.thinSlides || [],
      sparseSlides: validation?.qa?.sparseSlides || [],
      missingSlots: validation?.qa?.missingSlots || [],
      slotIssues: validation?.qa?.slotIssues || [],
      slotMetrics: validation?.qa?.slotMetrics || [],
      repairSuggestions: validation?.qa?.repairSuggestions || [],
    },
  };
}
