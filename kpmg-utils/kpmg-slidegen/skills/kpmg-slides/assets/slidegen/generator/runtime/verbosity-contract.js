const TEXT_AMOUNT_TO_DENSITY = Object.freeze({
  sm: 'dense',
  md: 'dense',
  lg: 'denser',
  xl: 'densest',
});

const SUPPORTED_TEXT_AMOUNTS = new Set(Object.keys(TEXT_AMOUNT_TO_DENSITY));
const SUPPORTED_DENSITY_PROFILES = new Set(['dense', 'denser', 'densest']);

const SLIDE_RULES = Object.freeze({
  oneColumnText: {
    metrics: {
      bodyItems: {
        label: 'body bullets',
        hint: 'Tighten or expand the body bullets so the slide matches the requested verbosity tier.',
        ranges: {
          sm: [4, 5],
          md: [5, 6],
          lg: [6, 7],
          xl: [7, 9],
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
          md: [3, 4],
          lg: [4, 5],
          xl: [5, 6],
        },
      },
      rightItems: {
        label: 'right-column bullets',
        hint: 'Rebalance the right column so it lands inside the requested verbosity tier.',
        ranges: {
          sm: [2, 3],
          md: [3, 4],
          lg: [4, 5],
          xl: [5, 6],
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
          md: [4, 5],
          lg: [5, 6],
          xl: [6, 7],
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
          md: [4, 5],
          lg: [5, 5],
          xl: [5, 6],
        },
      },
      tableRows: {
        label: 'table rows',
        hint: 'Adjust the supporting table row count to match the requested density tier.',
        ranges: {
          sm: [4, 6],
          md: [4, 6],
          lg: [6, 8],
          xl: [8, 12],
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
          md: [3, 4],
          lg: [4, 5],
          xl: [4, 6],
        },
      },
      tableRows: {
        label: 'table rows',
        hint: 'Adjust the table row count so the slide fits the requested density tier.',
        ranges: {
          sm: [4, 6],
          md: [6, 8],
          lg: [8, 12],
          xl: [10, 16],
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
          md: [2, 3],
          lg: [3, 3],
          xl: [3, 4],
        },
      },
      bridgeSteps: {
        label: 'bridge steps',
        hint: 'Adjust the bridge step count so the reconciliation feels right for the requested tier.',
        ranges: {
          sm: [5, 10],
          md: [8, 14],
          lg: [10, 18],
          xl: [12, 22],
        },
      },
      phaseBodyAverage: {
        label: 'phase bullets',
        hint: 'Rebalance bullets within each phase to match the requested tier.',
        ranges: {
          sm: [2, 2],
          md: [2, 3],
          lg: [2, 4],
          xl: [3, 4],
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
          md: [3, 4],
          lg: [4, 6],
          xl: [6, 8],
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
          md: [3, 4],
          lg: [4, 4],
          xl: [4, 5],
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
 * Count rows in a table-like slot.
 * @param {unknown} table
 * @returns {number}
 */
function countRows(table) {
  return Array.isArray(table?.rows) ? table.rows.length : 0;
}

/**
 * Resolve the effective textAmount and densityProfile contract for a deck.
 * @param {object} metadata
 * @returns {{textAmount: string, densityProfile: string, warnings: object[]}}
 */
export function resolveVerbosityMetadata(metadata = {}) {
  const warnings = [];
  const errors = [];
  const textAmount = SUPPORTED_TEXT_AMOUNTS.has(metadata?.textAmount) ? metadata.textAmount : null;
  let densityProfile = SUPPORTED_DENSITY_PROFILES.has(metadata?.densityProfile)
    ? metadata.densityProfile
    : null;

  if (!textAmount) {
    errors.push({
      code: 'missing_text_amount',
      severity: 'error',
      status: 'fail',
      message: 'metadata.textAmount is required and must be one of sm, md, lg, or xl.',
      suggestedRemedy: 'Set metadata.textAmount to one of sm, md, lg, or xl.',
    });
  }

  if (SUPPORTED_TEXT_AMOUNTS.has(metadata?.densityProfile)) {
    densityProfile = null;
    errors.push({
      code: 'legacy_density_profile_alias',
      severity: 'error',
      status: 'fail',
      message: `metadata.densityProfile used legacy alias "${metadata.densityProfile}".`,
      suggestedRemedy: `Use densityProfile values dense, denser, or densest instead of "${TEXT_AMOUNT_TO_DENSITY[metadata.densityProfile]}".`,
    });
  }

  if (!densityProfile) {
    errors.push({
      code: 'missing_density_profile',
      severity: 'error',
      status: 'fail',
      message: 'metadata.densityProfile is required and must be one of dense, denser, or densest.',
      suggestedRemedy: 'Set metadata.densityProfile to dense, denser, or densest.',
    });
  }

  return {
    textAmount,
    densityProfile,
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
  const phaseBodies = analysisColumns.map((column) => countTextItems(column?.body));
  const average = (values) => {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return Number((values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length).toFixed(2));
  };

  return {
    bodyItems: countTextItems(slideSpec?.body),
    leftItems: countTextItems(slideSpec?.leftBody),
    rightItems: countTextItems(slideSpec?.rightBody),
    tableRows: countRows(slideSpec?.table),
    insightItems: countTextItems(slideSpec?.insights),
    bridgeSteps: Array.isArray(slideSpec?.bridge?.steps) ? slideSpec.bridge.steps.length : 0,
    phaseCount: analysisColumns.length,
    phaseBodyAverage: average(phaseBodies),
    overviewItems: countTextItems(slideSpec?.overviewBody),
    boxBodyAverage: average(boxBodies),
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
}) {
  if (!Array.isArray(range) || range.length !== 2) return null;
  const [min, max] = range.map((value) => Number(value || 0));
  if (!Number.isFinite(actual)) return null;
  if (actual >= min && actual <= max) return null;

  const delta = actual < min ? min - actual : actual - max;
  const severity = delta >= 2 ? 'error' : 'warning';
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

  if (!metadata.textAmount || !metadata.densityProfile) {
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
