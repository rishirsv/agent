const SUPPORTED_TEXT_AMOUNTS = new Set(['sm', 'md', 'lg', 'xl']);

const SLIDE_RULES = Object.freeze({
  oneColumnText: {
    metrics: {
      bodyItems: {
        label: 'body bullets',
        hint: 'Tighten or expand the body bullets so the slide matches the requested verbosity tier.',
        ranges: {
          sm: [4, 5],
          md: [5, 5],
          lg: [6, 6],
          xl: [7, 7],
        },
      },
      bodyAverageChars: {
        label: 'body bullet length',
        hint: 'Use richer diligence-style bullets so the body fills the slide without adding extra rows.',
        errorDelta: 35,
        ranges: {
          sm: [80, 135],
          md: [135, 175],
          lg: [180, 220],
          xl: [220, 255],
        },
      },
    },
  },
  twoColumnText: {
    metrics: {
      leftItems: {
        label: 'left-column bullets',
        hint: 'Rebalance the left column so it lands inside the requested verbosity tier.',
        ranges: {
          sm: [2, 3],
          md: [3, 3],
          lg: [4, 4],
          xl: [4, 4],
        },
      },
      leftAverageChars: {
        label: 'left-column bullet length',
        hint: 'Increase or trim the left-column bullet depth to match the selected tier.',
        errorDelta: 30,
        ranges: {
          sm: [80, 120],
          md: [100, 135],
          lg: [130, 165],
          xl: [165, 200],
        },
      },
      rightItems: {
        label: 'right-column bullets',
        hint: 'Rebalance the right column so it lands inside the requested verbosity tier.',
        ranges: {
          sm: [2, 3],
          md: [3, 3],
          lg: [4, 4],
          xl: [4, 4],
        },
      },
      rightAverageChars: {
        label: 'right-column bullet length',
        hint: 'Increase or trim the right-column bullet depth to match the selected tier.',
        errorDelta: 30,
        ranges: {
          sm: [80, 120],
          md: [100, 135],
          lg: [130, 165],
          xl: [165, 200],
        },
      },
    },
  },
  analysisWideChart2ColsText: {
    metrics: {
      bodyItems: {
        label: 'body bullets',
        hint: 'Use the narrative bullets to match the requested evidence density for the chart slide.',
        ranges: {
          sm: [4, 4],
          md: [4, 4],
          lg: [5, 5],
          xl: [5, 5],
        },
      },
      bodyAverageChars: {
        label: 'body bullet length',
        hint: 'Deepen the commentary rather than adding more bullets to the chart slide.',
        errorDelta: 35,
        ranges: {
          sm: [90, 140],
          md: [155, 195],
          lg: [195, 230],
          xl: [225, 260],
        },
      },
    },
  },
  analysisWideChartTableText: {
    metrics: {
      bodyItems: {
        label: 'body bullets',
        hint: 'Adjust the body bullets so the chart/table narrative matches the requested tier.',
        ranges: {
          sm: [4, 4],
          md: [4, 4],
          lg: [4, 4],
          xl: [4, 4],
        },
      },
      bodyAverageChars: {
        label: 'body bullet length',
        hint: 'Increase or trim the commentary depth before changing the bullet count on the chart/table layout.',
        errorDelta: 30,
        ranges: {
          sm: [90, 140],
          md: [95, 125],
          lg: [100, 135],
          xl: [105, 145],
        },
      },
      tableRows: {
        label: 'table rows',
        hint: 'Adjust the supporting table row count so the chart/table layout stays inside its safe geometry budget.',
        ranges: {
          sm: [4, 4],
          md: [4, 4],
          lg: [4, 4],
          xl: [4, 4],
        },
      },
      tableLastColMaxChars: {
        label: 'table read-through length',
        hint: 'Shorten the read-through cells so the chart/table layout stays on one page.',
        errorDelta: 20,
        ranges: {
          sm: [0, 70],
          md: [0, 80],
          lg: [0, 92],
          xl: [0, 100],
        },
      },
    },
  },
  analysisNarrowTable: {
    metrics: {
      insightItems: {
        label: 'insight bullets',
        hint: 'Adjust the insight bullets so the narrow-table commentary matches the requested tier.',
        ranges: {
          sm: [2, 3],
          md: [3, 3],
          lg: [4, 4],
          xl: [4, 4],
        },
      },
      insightAverageChars: {
        label: 'insight bullet length',
        hint: 'Deepen the right-side takeaway bullets without adding more of them.',
        errorDelta: 30,
        ranges: {
          sm: [85, 130],
          md: [135, 175],
          lg: [165, 205],
          xl: [180, 220],
        },
      },
      tableRows: {
        label: 'table rows',
        hint: 'Adjust the table row count so the narrow-table layout stays inside its safe geometry budget.',
        ranges: {
          sm: [4, 4],
          md: [4, 4],
          lg: [4, 4],
          xl: [4, 4],
        },
      },
      tableLastColMaxChars: {
        label: 'read-through cell length',
        hint: 'Shorten the table read-through cells so the narrow-table layout stays on one page.',
        errorDelta: 18,
        ranges: {
          sm: [0, 68],
          md: [0, 80],
          lg: [0, 88],
          xl: [0, 95],
        },
      },
    },
  },
  analysisBridge: {
    metrics: {
      phaseCount: {
        label: 'analysis phases',
        hint: 'Adjust the number of analysis phases so the bridge matches the requested tier.',
        ranges: {
          sm: [1, 2],
          md: [2, 2],
          lg: [3, 3],
          xl: [3, 3],
        },
      },
      bridgeSteps: {
        label: 'bridge steps',
        hint: 'Adjust the bridge step count so the reconciliation feels right for the requested tier.',
        ranges: {
          sm: [5, 10],
          md: [8, 10],
          lg: [9, 11],
          xl: [10, 11],
        },
      },
      phaseBodyAverage: {
        label: 'phase bullets',
        hint: 'Rebalance bullets within each phase to match the requested tier.',
        ranges: {
          sm: [2, 2],
          md: [2, 2],
          lg: [2, 2],
          xl: [2, 2],
        },
      },
      phaseBodyAverageChars: {
        label: 'phase bullet length',
        hint: 'Make the phase commentary denser before adding more bullets to each bridge phase.',
        errorDelta: 30,
        ranges: {
          sm: [80, 120],
          md: [85, 115],
          lg: [90, 120],
          xl: [95, 125],
        },
      },
    },
  },
  businessOverview: {
    metrics: {
      overviewItems: {
        label: 'overview bullets',
        hint: 'Adjust the right-side overview bullets so the slide matches the requested verbosity tier.',
        ranges: {
          sm: [2, 3],
          md: [4, 4],
          lg: [4, 4],
          xl: [4, 4],
        },
      },
      overviewAverageChars: {
        label: 'overview bullet length',
        hint: 'Deepen the business-overview commentary instead of adding more bullets.',
        errorDelta: 30,
        ranges: {
          sm: [90, 140],
          md: [160, 200],
          lg: [190, 225],
          xl: [205, 225],
        },
      },
    },
  },
  titleStrapline4TextBoxes: {
    metrics: {
      boxBodyAverage: {
        label: 'column bullets',
        hint: 'Balance the box bullets so each column lands inside the requested tier.',
        ranges: {
          sm: [3, 3],
          md: [3, 3],
          lg: [3, 3],
          xl: [3, 3],
        },
      },
      boxBodyAverageChars: {
        label: 'column bullet length',
        hint: 'Use richer box commentary before adding more bullets to the four-column layout.',
        errorDelta: 20,
        ranges: {
          sm: [70, 110],
          md: [100, 122],
          lg: [105, 126],
          xl: [110, 130],
        },
      },
    },
  },
});

/**
 * Count bullet-like entries in a text array, including nested children.
 * @param {unknown} value
 * @returns {number}
 */
function countTextItems(value) {
  if (!Array.isArray(value)) return 0;
  let count = 0;

  function visit(node) {
    if (typeof node === 'string') {
      count += 1;
      return;
    }
    if (!node || typeof node !== 'object' || Array.isArray(node) || typeof node.text !== 'string') {
      return;
    }
    count += 1;
    if (!Array.isArray(node.children)) return;
    node.children.forEach((child) => visit(child));
  }

  value.forEach((item) => visit(item));
  return count;
}

/**
 * Normalize freeform text for character-based checks.
 * @param {unknown} value
 * @returns {string}
 */
function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Collect substantive bullet text lengths from a text array.
 * @param {unknown} value
 * @returns {number[]}
 */
function collectTextLengths(value) {
  if (!Array.isArray(value)) return [];
  const lengths = [];

  function visit(node) {
    if (typeof node === 'string') {
      const normalized = normalizeText(node);
      if (normalized) lengths.push(normalized.length);
      return;
    }
    if (!node || typeof node !== 'object' || Array.isArray(node) || typeof node.text !== 'string') {
      return;
    }
    if (!node.subheader) {
      const normalized = normalizeText(node.text);
      if (normalized) lengths.push(normalized.length);
    }
    if (!Array.isArray(node.children)) return;
    node.children.forEach((child) => visit(child));
  }

  value.forEach((item) => visit(item));
  return lengths;
}

/**
 * Count rows in a table-like slot.
 * @param {unknown} table
 * @returns {number}
 */
function countRows(table) {
  return Array.isArray(table?.rows) ? table.rows.length : 0;
}

/**
 * Measure string lengths from a table column.
 * @param {unknown} table
 * @param {number} columnIndex
 * @returns {number[]}
 */
function collectTableColumnLengths(table, columnIndex) {
  if (!Array.isArray(table?.rows)) return [];
  return table.rows
    .map((row) => normalizeText(Array.isArray(row) ? row[columnIndex] : ''))
    .filter(Boolean)
    .map((value) => value.length);
}

/**
 * Compute the average of numeric values.
 * @param {number[]} values
 * @returns {number}
 */
function average(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length).toFixed(2));
}

/**
 * Compute the maximum of numeric values.
 * @param {number[]} values
 * @returns {number}
 */
function maximum(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return Number(Math.max(...values));
}

/**
 * Resolve the effective textAmount contract for a deck.
 * @param {object} metadata
 * @returns {{textAmount: string, warnings: object[]}}
 */
export function resolveVerbosityMetadata(metadata = {}) {
  const warnings = [];
  const errors = [];
  const textAmount = SUPPORTED_TEXT_AMOUNTS.has(metadata?.textAmount) ? metadata.textAmount : null;

  if (!textAmount) {
    errors.push({
      code: 'missing_text_amount',
      severity: 'error',
      status: 'fail',
      message: 'metadata.textAmount is required and must be one of sm, md, lg, or xl.',
      suggestedRemedy: 'Set metadata.textAmount to one of sm, md, lg, or xl.',
    });
  }

  return {
    textAmount,
    errors,
    warnings,
  };
}

/**
 * Measure the metrics that matter for the verbosity contract on a slide.
 * @param {object} slideSpec
 * @returns {Record<string, number>}
 */
function measureSlide(slideSpec = {}) {
  const columns = Array.isArray(slideSpec?.columns) ? slideSpec.columns : [];
  const analysisColumns = Array.isArray(slideSpec?.analysisColumns) ? slideSpec.analysisColumns : [];
  const boxBodies = columns.map((column) => countTextItems(column?.body));
  const boxTextLengths = columns.flatMap((column) => collectTextLengths(column?.body));
  const phaseBodies = analysisColumns.map((column) => countTextItems(column?.body));
  const phaseTextLengths = analysisColumns.flatMap((column) => collectTextLengths(column?.body));
  const bodyTextLengths = collectTextLengths(slideSpec?.body);
  const leftTextLengths = collectTextLengths(slideSpec?.leftBody);
  const rightTextLengths = collectTextLengths(slideSpec?.rightBody);
  const insightTextLengths = collectTextLengths(slideSpec?.insights);
  const overviewTextLengths = collectTextLengths(slideSpec?.overviewBody);
  const lastColumnIndex = Array.isArray(slideSpec?.table?.headers) ? slideSpec.table.headers.length - 1 : -1;
  const tableLastColLengths = lastColumnIndex >= 0 ? collectTableColumnLengths(slideSpec?.table, lastColumnIndex) : [];

  return {
    bodyItems: countTextItems(slideSpec?.body),
    bodyAverageChars: average(bodyTextLengths),
    leftItems: countTextItems(slideSpec?.leftBody),
    leftAverageChars: average(leftTextLengths),
    rightItems: countTextItems(slideSpec?.rightBody),
    rightAverageChars: average(rightTextLengths),
    tableRows: countRows(slideSpec?.table),
    tableLastColMaxChars: maximum(tableLastColLengths),
    insightItems: countTextItems(slideSpec?.insights),
    insightAverageChars: average(insightTextLengths),
    bridgeSteps: Array.isArray(slideSpec?.bridge?.steps) ? slideSpec.bridge.steps.length : 0,
    phaseCount: analysisColumns.length,
    phaseBodyAverage: average(phaseBodies),
    phaseBodyAverageChars: average(phaseTextLengths),
    overviewItems: countTextItems(slideSpec?.overviewBody),
    overviewAverageChars: average(overviewTextLengths),
    boxBodyAverage: average(boxBodies),
    boxBodyAverageChars: average(boxTextLengths),
  };
}

/**
 * Compare an actual metric value to a requested tier range.
 * @param {object} params
 * @returns {object|null}
 */
function compareMetric({
  actual,
  range,
  slideIndex,
  slideType,
  metricKey,
  metricLabel,
  hint,
  textAmount,
  errorDelta,
}) {
  if (!Array.isArray(range) || range.length !== 2) return null;
  const [min, max] = range.map((value) => Number(value || 0));
  if (!Number.isFinite(actual)) return null;
  if (actual >= min && actual <= max) return null;

  const delta = actual < min ? min - actual : actual - max;
  const severity = delta >= Number(errorDelta || 2) ? 'error' : 'warning';
  const direction = actual < min ? 'below' : 'above';
  const target = min === max ? String(min) : `${min}-${max}`;

  return {
    code: `verbosity_${metricKey}_${direction}_target`,
    severity,
    status: severity === 'error' ? 'fail' : 'warn',
    slideIndex,
    slideType,
    metric: metricKey,
    actual,
    targetRange: { min, max },
    message: `Slide is ${direction} the ${textAmount} target for ${metricLabel} (${actual} vs ${target}).`,
    suggestedRemedy: hint,
  };
}

/**
 * Evaluate slide content against the requested verbosity contract.
 * @param {object} deckSpec
 * @returns {{metadata: object, findings: object[], summary: object}}
 */
export function evaluateVerbosityContract(deckSpec = {}) {
  const metadata = resolveVerbosityMetadata(deckSpec?.metadata || {});
  const findings = [...metadata.errors, ...metadata.warnings];
  const slides = Array.isArray(deckSpec?.slides) ? deckSpec.slides : [];

  if (!metadata.textAmount) {
    return {
      metadata,
      findings,
      summary: {
        status: 'fail',
        failCount: findings.filter((item) => item?.status === 'fail' || item?.severity === 'error').length,
        warnCount: findings.filter((item) => item?.status !== 'fail' && item?.severity === 'warning').length,
        checkedSlideCount: slides.length,
      },
    };
  }

  slides.forEach((slideSpec, slideIndex) => {
    const slideType = String(slideSpec?.type || '');
    const rule = SLIDE_RULES[slideType];
    if (!rule) return;

    const measured = measureSlide(slideSpec);
    for (const [metricKey, metricRule] of Object.entries(rule.metrics || {})) {
      const range = metricRule?.ranges?.[metadata.textAmount];
      const finding = compareMetric({
        actual: measured[metricKey],
        range,
        slideIndex,
        slideType,
        metricKey,
        metricLabel: metricRule.label || metricKey,
        hint: metricRule.hint || 'Adjust the slide content to match the requested verbosity tier.',
        textAmount: metadata.textAmount,
        errorDelta: metricRule.errorDelta,
      });
      if (finding) findings.push(finding);
    }
  });

  const failCount = findings.filter((item) => item?.status === 'fail' || item?.severity === 'error').length;
  const warnCount = findings.filter((item) => item?.status !== 'fail' && item?.severity === 'warning').length;

  return {
    metadata,
    findings,
    summary: {
      status: failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass',
      failCount,
      warnCount,
      checkedSlideCount: slides.length,
    },
  };
}
