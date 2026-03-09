import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_OUTPUT_ROOT = path.join(os.homedir(), 'Desktop', 'kpmg-slidegen-payload-calibration');
const DEFAULT_SPEC_ROOT = path.join(DEFAULT_REPO_ROOT, 'presets', 'authoring', 'payload-calibration');
const ARGS = parseArgs(process.argv.slice(2));

const REPO_ROOT = path.resolve(String(ARGS['repo-root'] || DEFAULT_REPO_ROOT));
const OUTPUT_ROOT = path.resolve(String(ARGS['output-root'] || DEFAULT_OUTPUT_ROOT));
const SPEC_ROOT = path.resolve(String(ARGS['spec-root'] || DEFAULT_SPEC_ROOT));

const LEVELS = [
  { id: 'concise', textAmount: 'md', label: 'Concise' },
  { id: 'detailed', textAmount: 'lg', label: 'Detailed' },
  { id: 'extensive', textAmount: 'xl', label: 'Extensive' },
];

const CLAUSES = [
  'supported by management interviews and corroborated with recent operating evidence',
  'linked to transaction impact through revenue, margin, or cash flow implications',
  'framed with the next decision leadership should take during the diligence workstream',
  'consistent with the diligence pattern observed across North American consulting-style decks',
  'useful for the investment committee because it connects evidence, risk, and required action',
  'grounded in a fact pattern that can be defended in follow-up management sessions',
  'written to fill the slide with meaningful due diligence commentary instead of presentation shorthand',
  'intended to preserve readability while pushing toward a realistic consulting payload level',
];

const LEVEL_BUDGETS = {
  concise: {
    oneColumn: { count: 5, chars: 150 },
    twoColumn: { count: 3, chars: 120 },
    chartText: { count: 4, chars: 175 },
    chartTable: { bullets: 4, bulletChars: 150, rows: 5, cellChars: 80 },
    narrowTable: { bullets: 3, bulletChars: 155, rows: 5, cellChars: 78 },
    bridge: { phases: 2, phaseBullets: 2, phaseChars: 125, steps: 9 },
    overview: { bullets: 4, chars: 180 },
    fourBox: { count: 3, chars: 118 },
  },
  detailed: {
    oneColumn: { count: 6, chars: 195 },
    twoColumn: { count: 4, chars: 150 },
    chartText: { count: 5, chars: 215 },
    chartTable: { bullets: 4, bulletChars: 180, rows: 6, cellChars: 92 },
    narrowTable: { bullets: 4, bulletChars: 180, rows: 6, cellChars: 88 },
    bridge: { phases: 3, phaseBullets: 2, phaseChars: 150, steps: 11 },
    overview: { bullets: 4, chars: 215 },
    fourBox: { count: 3, chars: 132 },
  },
  extensive: {
    oneColumn: { count: 7, chars: 235 },
    twoColumn: { count: 4, chars: 185 },
    chartText: { count: 5, chars: 245 },
    chartTable: { bullets: 4, bulletChars: 200, rows: 6, cellChars: 104 },
    narrowTable: { bullets: 4, bulletChars: 195, rows: 7, cellChars: 96 },
    bridge: { phases: 3, phaseBullets: 2, phaseChars: 170, steps: 12 },
    overview: { bullets: 5, chars: 235 },
    fourBox: { count: 3, chars: 146 },
    stress: {
      chartTable: { bullets: 4, bulletChars: 220, rows: 7, cellChars: 118 },
      narrowTable: { bullets: 4, bulletChars: 210, rows: 8, cellChars: 108 },
      fourBox: { count: 3, chars: 160 },
    },
  },
};

const PHASE_HEADINGS = ['Growth drivers', 'Execution risks', 'Forward view'];
const WORKSTREAMS = ['Commercial', 'Operations', 'Technology', 'Governance'];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function trimTrailingFragment(text) {
  let cleaned = String(text || '').replace(/[,\s]+$/, '');
  const trailingWords = new Set([
    'a',
    'an',
    'and',
    'by',
    'for',
    'from',
    'in',
    'of',
    'on',
    'or',
    'the',
    'through',
    'to',
    'with',
    'supported',
    'linked',
    'framed',
    'management',
  ]);

  while (cleaned) {
    const parts = cleaned.split(/\s+/);
    const last = String(parts[parts.length - 1] || '').toLowerCase();
    if (!trailingWords.has(last)) break;
    parts.pop();
    cleaned = parts.join(' ').replace(/[,\s]+$/, '');
  }
  return cleaned;
}

function fitText(seed, targetChars) {
  let text = normalizeText(seed);
  let clauseIndex = 0;
  while (text.length < targetChars - 20) {
    text += `${text.endsWith('.') ? '' : ','} ${CLAUSES[clauseIndex % CLAUSES.length]}`;
    clauseIndex += 1;
  }
  if (text.length > targetChars) {
    text = text.slice(0, targetChars);
    const cut = Math.max(text.lastIndexOf(','), text.lastIndexOf(' '));
    if (cut > Math.floor(targetChars * 0.75)) {
      text = text.slice(0, cut);
    }
  }
  text = trimTrailingFragment(text);
  if (!text.endsWith('.')) text += '.';
  return text;
}

function makeBullets(theme, count, chars) {
  return Array.from({ length: count }, (_, index) =>
    fitText(
      `${theme} point ${index + 1} explains the operating pattern and why it matters for diligence outcomes`,
      chars,
    ),
  );
}

function makeWideRows(prefix, count, chars) {
  return Array.from({ length: count }, (_, index) => [
    `${prefix} ${index + 1}`,
    `${50 + index * 7}`,
    `$${80 + index * 35}k`,
    fitText(
      `${prefix} read-through ${index + 1} explains the commercial plan, the management response, and the implication for run-rate confidence`,
      chars,
    ),
  ]);
}

function makeNarrowRows(prefix, count, chars) {
  return Array.from({ length: count }, (_, index) => [
    `${prefix} metric ${index + 1}`,
    `${68 + index * 3}%`,
    `${72 + index * 3}%`,
    '4%',
    fitText(
      `${prefix} read-through ${index + 1} explains the gap, the management response, and the implication for execution certainty`,
      chars,
    ),
  ]);
}

function makeBridgeSteps(count) {
  const labels = [
    'Volume growth',
    'Pricing discipline',
    'Customer retention',
    'Mix improvement',
    'Support efficiency',
    'Control remediation',
    'Automation',
    'Vendor savings',
    'Headcount ramp',
    'Implementation drag',
    'Timing variance',
    'Recovery actions',
  ];
  const deltas = [18, 10, 8, 7, 6, -4, 5, 4, -3, -5, -2, 6];
  return Array.from({ length: count }, (_, index) => ({
    label: labels[index],
    delta: deltas[index],
  }));
}

function sumBridgeDeltas(steps) {
  return steps.reduce((total, step) => total + Number(step?.delta || 0), 0);
}

function baseMetadata(label, textAmount) {
  return {
    title: `Payload Calibration ${label}`,
    author: 'KPMG LLP',
    company: 'KPMG LLP',
    subject: `Calibration deck for ${label}`,
    allowSparse: false,
    textAmount,
    slideCountPolicy: 'auto',
    styleIntent: 'diligence',
    footer: {
      year: 2026,
      legalEntityName: 'KPMG LLP',
      jurisdiction: 'Ontario',
      legalStructure: 'limited liability partnership',
      documentClassification: 'KPMG Confidential',
      officeContactText: 'kpmg.com/ca',
    },
  };
}

function divider(sectionNumber, sectionTitle) {
  return {
    type: 'dividerLight',
    sectionNumber,
    sectionTitle,
  };
}

function buildDeck(level) {
  const budget = LEVEL_BUDGETS[level.id];
  const bridgeSteps = makeBridgeSteps(budget.bridge.steps);
  const bridgeStartValue = 122;

  const slides = [
    {
      type: 'cover',
      title: `${level.label} payload calibration`,
      subtitle: 'Controlled character-budget deck for visual and text-density calibration.',
    },
    divider('01', 'Narrative layouts'),
    {
      type: 'oneColumnText',
      title: `One-column narrative (${budget.oneColumn.count}x${budget.oneColumn.chars})`,
      strapline: 'Testing richer diligence bullets without changing the slide family.',
      bodyStyle: 'bullets',
      body: makeBullets('One-column commentary', budget.oneColumn.count, budget.oneColumn.chars),
      source: 'Source: payload calibration sample.',
    },
    {
      type: 'twoColumnText',
      title: `Two-column narrative (${budget.twoColumn.count}x${budget.twoColumn.chars} per side)`,
      strapline: 'Testing balanced left/right evidence at controlled character budgets.',
      bodyStyle: 'bullets',
      leftBody: makeBullets('Current-state commentary', budget.twoColumn.count, budget.twoColumn.chars),
      rightBody: makeBullets('Target-state commentary', budget.twoColumn.count, budget.twoColumn.chars),
    },
    {
      type: 'analysisWideChart2ColsText',
      title: `Chart with text (${budget.chartText.count}x${budget.chartText.chars})`,
      strapline: 'Testing the chart-right, commentary-left narrative budget.',
      bodyStyle: 'bullets',
      body: makeBullets('Revenue trend commentary', budget.chartText.count, budget.chartText.chars),
      chart: {
        type: 'bar',
        data: [
          { name: 'Revenue ($M)', labels: ['2023', '2024', '2025'], values: [74, 88, 109] },
          { name: 'Gross margin (%)', labels: ['2023', '2024', '2025'], values: [69, 71, 73] },
        ],
        opts: { showValue: true, showLegend: true, valAxisTitle: '$M / %' },
        source: 'Source: payload calibration metrics.',
      },
    },
    divider('02', 'Constrained layouts'),
    {
      type: 'analysisWideChartTableText',
      title: `Chart + table (${budget.chartTable.bullets} bullets, ${budget.chartTable.rows} rows)`,
      strapline: 'Testing combined chart/table/commentary density under controlled text cells.',
      heading: 'Plan mix and current run-rate',
      bodyStyle: 'bullets',
      body: makeBullets('Packaging view commentary', budget.chartTable.bullets, budget.chartTable.bulletChars),
      chart: {
        type: 'bar',
        data: [
          { name: 'Customers', labels: ['Starter', 'Growth', 'Enterprise'], values: [118, 86, 42] },
          { name: 'MRR ($000)', labels: ['Starter', 'Growth', 'Enterprise'], values: [76, 214, 468] },
        ],
        opts: { showValue: true, showLegend: true, valAxisTitle: 'Count / $000' },
        source: 'Source: payload calibration metrics.',
      },
      table: {
        headers: ['Plan', 'Customers', 'MRR', 'Read-through'],
        rows: makeWideRows('Plan', budget.chartTable.rows, budget.chartTable.cellChars),
      },
      noteSource: 'Source: payload calibration metrics.',
    },
    {
      type: 'analysisNarrowTable',
      title: `Narrow table (${budget.narrowTable.rows} rows, ${budget.narrowTable.bullets} insights)`,
      strapline: 'Testing table-led density with controlled right-side insight text.',
      table: {
        headers: ['Metric', 'Current', 'Target', 'Gap', 'Read-through'],
        rows: makeNarrowRows('Operational', budget.narrowTable.rows, budget.narrowTable.cellChars),
      },
      insights: makeBullets('Metric implication commentary', budget.narrowTable.bullets, budget.narrowTable.bulletChars),
      notes: 'Source: payload calibration metrics.',
    },
    {
      type: 'analysisBridge',
      title: `Bridge (${budget.bridge.steps} steps, ${budget.bridge.phases} phases)`,
      strapline: 'Testing how far bridge commentary can stretch before the slide becomes visually overloaded.',
      bodyStyle: 'paragraphs',
      bridge: {
        startLabel: 'FY23 EBITDA',
        endLabel: 'FY25 EBITDA',
        startValue: bridgeStartValue,
        endValue: bridgeStartValue + sumBridgeDeltas(bridgeSteps),
        unitPrefix: '$',
        unitSuffix: 'm',
        decimals: 0,
        tolerance: 0.5,
        steps: bridgeSteps,
      },
      analysisColumns: Array.from({ length: budget.bridge.phases }, (_, index) => ({
        heading: PHASE_HEADINGS[index],
        body: makeBullets(PHASE_HEADINGS[index], budget.bridge.phaseBullets, budget.bridge.phaseChars),
      })),
      source: 'Source: payload calibration metrics.',
      note: 'Calibration deck for bridge readability.',
    },
    {
      type: 'businessOverview',
      title: `Business overview (${budget.overview.bullets}x${budget.overview.chars})`,
      leftHeading: 'Legal and ownership structure',
      rightHeading: 'Operating and performance summary',
      bodyStyle: 'paragraphs',
      structure: {
        topTier: [
          { label: 'Investor A', pct: '45%' },
          { label: 'Investor B', pct: '35%' },
          { label: 'Founder', pct: '20%' },
        ],
        midTier: [{ label: 'HoldCo', pct: '100%' }],
        bottomTier: [
          { label: 'OpCo North', pct: '100%' },
          { label: 'OpCo Central', pct: '100%' },
          { label: 'Shared Services', pct: '100%' },
        ],
        links: [
          { fromTier: 'top', fromIndex: 0, toTier: 'mid', toIndex: 0 },
          { fromTier: 'top', fromIndex: 1, toTier: 'mid', toIndex: 0 },
          { fromTier: 'top', fromIndex: 2, toTier: 'mid', toIndex: 0 },
          { fromTier: 'mid', fromIndex: 0, toTier: 'bottom', toIndex: 0 },
          { fromTier: 'mid', fromIndex: 0, toTier: 'bottom', toIndex: 1 },
          { fromTier: 'mid', fromIndex: 0, toTier: 'bottom', toIndex: 2 },
        ],
        perimeter: {
          enabled: true,
          label: 'Transaction perimeter',
          subLabel: 'Entities under diligence scope',
        },
      },
      overviewBody: makeBullets('Overview summary commentary', budget.overview.bullets, budget.overview.chars),
      chart: {
        type: 'area',
        data: [{ name: 'Revenue trend', labels: ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'], values: [96, 108, 121, 142, 164] }],
        source: 'Source: payload calibration metrics.',
      },
      source: 'Source: payload calibration metrics.',
      note: 'Calibration deck for consulting-style overview density.',
    },
    {
      type: 'titleStrapline4TextBoxes',
      title: `Four-box layout (${budget.fourBox.count}x${budget.fourBox.chars} per box)`,
      strapline: 'Testing the practical upper bound for four parallel workstream boxes.',
      bodyStyle: 'paragraphs',
      columns: WORKSTREAMS.map((heading) => ({
        heading,
        body: makeBullets(`${heading} workstream commentary`, budget.fourBox.count, budget.fourBox.chars),
      })),
    },
  ];

  if (budget.stress) {
    slides.push(divider('03', 'Stress tests'));
    slides.push({
      type: 'analysisWideChartTableText',
      title: `Stress: chart + table (${budget.stress.chartTable.rows} rows)`,
      strapline: 'Intentional stress case to locate the overflow threshold for the wide chart/table layout.',
      heading: 'Stress test mix and run-rate',
      bodyStyle: 'bullets',
      body: makeBullets(
        'Stress-test commentary',
        budget.stress.chartTable.bullets,
        budget.stress.chartTable.bulletChars,
      ),
      chart: {
        type: 'bar',
        data: [
          { name: 'Customers', labels: ['Starter', 'Growth', 'Enterprise'], values: [118, 86, 42] },
          { name: 'MRR ($000)', labels: ['Starter', 'Growth', 'Enterprise'], values: [76, 214, 468] },
        ],
        opts: { showValue: true, showLegend: true, valAxisTitle: 'Count / $000' },
        source: 'Source: payload calibration metrics.',
      },
      table: {
        headers: ['Plan', 'Customers', 'MRR', 'Read-through'],
        rows: makeWideRows('Stress plan', budget.stress.chartTable.rows, budget.stress.chartTable.cellChars),
      },
      noteSource: 'Source: payload calibration metrics.',
    });
    slides.push({
      type: 'analysisNarrowTable',
      title: `Stress: narrow table (${budget.stress.narrowTable.rows} rows)`,
      strapline: 'Intentional stress case to locate the overflow threshold for the narrow table layout.',
      table: {
        headers: ['Metric', 'Current', 'Target', 'Gap', 'Read-through'],
        rows: makeNarrowRows('Stress metric', budget.stress.narrowTable.rows, budget.stress.narrowTable.cellChars),
      },
      insights: makeBullets(
        'Stress-test implication commentary',
        budget.stress.narrowTable.bullets,
        budget.stress.narrowTable.bulletChars,
      ),
      notes: 'Source: payload calibration metrics.',
    });
    slides.push({
      type: 'titleStrapline4TextBoxes',
      title: `Stress: four-box layout (${budget.stress.fourBox.count}x${budget.stress.fourBox.chars})`,
      strapline: 'Intentional stress case to locate the overflow threshold for the four-box layout.',
      bodyStyle: 'paragraphs',
      columns: WORKSTREAMS.map((heading) => ({
        heading,
        body: makeBullets(`${heading} stress commentary`, budget.stress.fourBox.count, budget.stress.fourBox.chars),
      })),
    });
  }

  return {
    metadata: baseMetadata(level.label, level.textAmount),
    slides,
  };
}

async function resetDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await resetDir(SPEC_ROOT);
  await resetDir(OUTPUT_ROOT);

  const manifest = [];

  for (const level of LEVELS) {
    const deck = buildDeck(level);
    const specDir = path.join(SPEC_ROOT, level.id);
    const outDir = path.join(OUTPUT_ROOT, level.id);
    await fs.mkdir(specDir, { recursive: true });
    await fs.mkdir(outDir, { recursive: true });

    const deckSpecPath = path.join(specDir, 'deckSpec.json');
    await fs.writeFile(deckSpecPath, `${JSON.stringify(deck, null, 2)}\n`, 'utf8');

    const qaPath = path.join(outDir, 'qa.json');
    execFileSync('node', ['generator/index.js', '--in', deckSpecPath, '--out-dir', outDir, '--qa-out', qaPath], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });

    manifest.push({
      id: level.id,
      label: level.label,
      textAmount: level.textAmount,
      deckSpecPath,
      outputDir: outDir,
      budgets: LEVEL_BUDGETS[level.id],
    });
  }

  await fs.writeFile(path.join(OUTPUT_ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
