import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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
const DEFAULT_DESKTOP_ROOT = path.join(os.homedir(), 'Desktop', 'kpmg-slidegen-verbosity-density-matrix');
const DEFAULT_REPO_OUTPUT_ROOT = path.join(DEFAULT_REPO_ROOT, 'presets', 'authoring', 'review-matrix');
const ARGS = parseArgs(process.argv.slice(2));

const REPO_ROOT = path.resolve(String(ARGS['repo-root'] || DEFAULT_REPO_ROOT));
const DESKTOP_ROOT = path.resolve(String(ARGS['desktop-root'] || DEFAULT_DESKTOP_ROOT));
const REPO_OUTPUT_ROOT = path.resolve(String(ARGS['repo-output-root'] || DEFAULT_REPO_OUTPUT_ROOT));

const LEVELS = [
  { id: 'concise', textAmount: 'md', label: 'Concise' },
  { id: 'detailed', textAmount: 'lg', label: 'Detailed' },
  { id: 'extensive', textAmount: 'xl', label: 'Extensive' },
];

const CLAUSES = [
  'supported by management interviews and corroborated with recent operating evidence',
  'linked to transaction impact through revenue, margin, cash flow, or execution confidence',
  'framed with the next decision leadership should take during the diligence process',
  'written to feel like consulting commentary rather than presentation shorthand',
  'grounded in a fact pattern that can be defended in follow-up management sessions',
];

const LEVEL_BUDGETS = {
  concise: {
    oneColumn: { count: 5, chars: 150 },
    twoColumn: { count: 3, chars: 120 },
    chartText: { count: 4, chars: 175 },
    chartTable: { bullets: 4, bulletChars: 110, rows: 4, cellChars: 44 },
    narrowTable: { bullets: 3, bulletChars: 155, rows: 4, cellChars: 40 },
    bridge: { phases: 2, phaseBullets: 2, phaseChars: 95, steps: 8 },
    overview: { bullets: 4, chars: 180 },
    fourBox: { count: 3, chars: 126 },
  },
  detailed: {
    oneColumn: { count: 6, chars: 195 },
    twoColumn: { count: 4, chars: 150 },
    chartText: { count: 5, chars: 215 },
    chartTable: { bullets: 4, bulletChars: 125, rows: 4, cellChars: 50 },
    narrowTable: { bullets: 4, bulletChars: 180, rows: 4, cellChars: 44 },
    bridge: { phases: 3, phaseBullets: 2, phaseChars: 105, steps: 9 },
    overview: { bullets: 4, chars: 215 },
    fourBox: { count: 3, chars: 138 },
  },
  extensive: {
    oneColumn: { count: 7, chars: 235 },
    twoColumn: { count: 4, chars: 185 },
    chartText: { count: 5, chars: 245 },
    chartTable: { bullets: 4, bulletChars: 140, rows: 4, cellChars: 56 },
    narrowTable: { bullets: 4, bulletChars: 195, rows: 4, cellChars: 48 },
    bridge: { phases: 3, phaseBullets: 2, phaseChars: 115, steps: 10 },
    overview: { bullets: 4, chars: 220 },
    fourBox: { count: 3, chars: 148 },
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

function buildBullets(theme, count, chars) {
  return Array.from({ length: count }, (_, index) =>
    fitText(
      `${theme} point ${index + 1} explains the operating pattern and why it matters for diligence outcomes`,
      chars,
    ),
  );
}

function buildWideRows(prefix, count, chars) {
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

function buildNarrowRows(prefix, count, chars) {
  return Array.from({ length: count }, (_, index) => [
    `${prefix} ${index + 1}`,
    `${68 + index * 3}%`,
    `${72 + index * 3}%`,
    '4%',
    fitText(
      `${prefix} read-through ${index + 1} explains the gap, the management response, and the implication for execution certainty`,
      chars,
    ),
  ]);
}

function buildBridgeSteps(count) {
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

function buildContentsSections(level) {
  return [
    {
      number: '01',
      title: 'Settings summary',
      items: [`${level.label} preset using ${level.textAmount.toUpperCase()}`],
    },
    {
      number: '02',
      title: 'Narrative samples',
      items: ['One-column, two-column, and chart-led commentary'],
    },
    {
      number: '03',
      title: 'Constrained layouts',
      items: ['Table, bridge, overview, and four-box samples'],
    },
  ];
}

function buildDeck(level) {
  const budget = LEVEL_BUDGETS[level.id];
  const bridgeSteps = buildBridgeSteps(budget.bridge.steps);
  const bridgeStartValue = 122;

  return {
    metadata: {
      title: `Verbosity Review ${level.label}`,
      author: 'KPMG LLP',
      company: 'KPMG LLP',
      subject: `Review sample for ${level.label}`,
      allowSparse: false,
      textAmount: level.textAmount,
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
    },
    slides: [
      {
        type: 'cover',
        title: `${level.label} review deck`,
        subtitle: 'Review deck calibrated to the approved three-level consulting payload model.',
      },
      {
        type: 'contents',
        title: 'Contents',
        sections: buildContentsSections(level),
      },
      {
        type: 'dividerDark',
        sectionNumber: '01',
        sectionTitle: 'Settings summary',
      },
      {
        type: 'oneColumnText',
        title: 'How to review this sample',
        strapline: 'Narrative bullets should fill the slide with consulting-style detail before the layout adds more count.',
        bodyStyle: 'bullets',
        body: buildBullets('Review focus commentary', budget.oneColumn.count, budget.oneColumn.chars),
        source: 'Source: generated review matrix sample.',
      },
      {
        type: 'dividerLight',
        sectionNumber: '02',
        sectionTitle: 'Narrative samples',
      },
      {
        type: 'twoColumnText',
        title: 'Current vs target operating model',
        strapline: 'Two-column example showing richer evidence as the text amount increases.',
        bodyStyle: 'bullets',
        leftBody: buildBullets('Current-state commentary', budget.twoColumn.count, budget.twoColumn.chars),
        rightBody: buildBullets('Target-state commentary', budget.twoColumn.count, budget.twoColumn.chars),
      },
      {
        type: 'analysisWideChart2ColsText',
        title: 'Revenue and margin trend',
        strapline: 'Chart-right, commentary-left example using the calibrated narrative budgets.',
        bodyStyle: 'bullets',
        body: buildBullets('Revenue trend commentary', budget.chartText.count, budget.chartText.chars),
        chart: {
          type: 'bar',
          data: [
            { name: 'Revenue ($M)', labels: ['2023', '2024', '2025'], values: [74, 88, 109] },
            { name: 'Gross margin (%)', labels: ['2023', '2024', '2025'], values: [69, 71, 73] },
          ],
          opts: {
            showValue: true,
            showLegend: true,
            valAxisTitle: '$M / %',
          },
          source: 'Source: generated review matrix metrics.',
        },
      },
      {
        type: 'dividerLight',
        sectionNumber: '03',
        sectionTitle: 'Constrained layouts',
      },
      {
        type: 'analysisWideChartTableText',
        title: 'Packaging and performance view',
        strapline: 'Wide chart/table example using hard row caps and richer commentary.',
        heading: 'Plan mix and current run-rate',
        bodyStyle: 'bullets',
        body: buildBullets('Packaging view commentary', budget.chartTable.bullets, budget.chartTable.bulletChars),
        chart: {
          type: 'bar',
          data: [
            { name: 'Customers', labels: ['Starter', 'Growth', 'Enterprise'], values: [118, 86, 42] },
            { name: 'MRR ($000)', labels: ['Starter', 'Growth', 'Enterprise'], values: [76, 214, 468] },
          ],
          opts: {
            showValue: true,
            showLegend: true,
            valAxisTitle: 'Count / $000',
          },
          source: 'Source: generated review matrix metrics.',
        },
        table: {
          headers: ['Plan', 'Customers', 'MRR', 'Read-through'],
          rows: buildWideRows('Plan', budget.chartTable.rows, budget.chartTable.cellChars),
        },
        noteSource: 'Source: generated review matrix metrics.',
      },
      {
        type: 'analysisNarrowTable',
        title: 'Metric gap assessment',
        strapline: 'Table-led example with insight bullets tuned to the approved caps.',
        table: {
          headers: ['Metric', 'Current', 'Target', 'Gap', 'Read-through'],
          rows: buildNarrowRows('Operational', budget.narrowTable.rows, budget.narrowTable.cellChars),
        },
        insights: buildBullets(
          'Metric implication commentary',
          budget.narrowTable.bullets,
          budget.narrowTable.bulletChars,
        ),
        notes: 'Source: generated review matrix metrics.',
      },
      {
        type: 'analysisBridge',
        title: 'Adjusted EBITDA bridge',
        strapline: 'Bridge example showing that richer commentary can work if bullet count stays disciplined.',
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
          body: buildBullets(PHASE_HEADINGS[index], budget.bridge.phaseBullets, budget.bridge.phaseChars),
        })),
        source: 'Source: generated review matrix metrics.',
        note: 'Use richer evidence before adding more bridge commentary boxes.',
      },
      {
        type: 'businessOverview',
        title: 'Business overview and trend',
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
        overviewBody: buildBullets('Overview summary commentary', budget.overview.bullets, budget.overview.chars),
        chart: {
          type: 'area',
          data: [{ name: 'Revenue trend', labels: ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'], values: [96, 108, 121, 142, 164] }],
          source: 'Source: generated review matrix metrics.',
        },
        source: 'Source: generated review matrix metrics.',
        note: 'Keep the overview bullet count flat and increase richness across levels.',
      },
      {
        type: 'titleStrapline4TextBoxes',
        title: 'Program workstreams and ownership',
        strapline: 'Four-box example showing that richer commentary works if each box stays at three bullets.',
        bodyStyle: 'paragraphs',
        columns: WORKSTREAMS.map((heading) => ({
          heading,
          body: buildBullets(`${heading} workstream commentary`, budget.fourBox.count, budget.fourBox.chars),
        })),
      },
      {
        type: 'backCover',
      },
    ],
  };
}

function buildManifest(entries) {
  const lines = [
    '# Verbosity Review Set',
    '',
    'This bundle contains one rendered deck for each approved starter level after the payload-cap refactor.',
    '',
    'Simple reading guide:',
    '- `concise` is the lowest useful working-deck setting.',
    '- `detailed` is the normal consulting / diligence baseline.',
    '- `extensive` increases evidence richness without letting constrained layouts overflow by default.',
    '',
    'Included review decks:',
  ];

  entries.forEach((entry) => {
    lines.push(`- ${entry.id}: ${entry.label} (${entry.textAmount.toUpperCase()})`);
  });

  lines.push('', 'Folder contents per preset:', '- `deckspec.json`', '- `qa.json`', '- rendered `.pptx` deck');
  return `${lines.join('\n')}\n`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function emptyDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await ensureDir(dirPath);
}

async function main() {
  await emptyDir(REPO_OUTPUT_ROOT);
  await emptyDir(DESKTOP_ROOT);

  const manifestEntries = [];

  for (const level of LEVELS) {
    const deckSpec = buildDeck(level);
    const repoPath = path.join(REPO_OUTPUT_ROOT, `${level.id}.deckSpec.json`);
    const desktopDir = path.join(DESKTOP_ROOT, level.id);

    await ensureDir(desktopDir);
    await fs.writeFile(repoPath, `${JSON.stringify(deckSpec, null, 2)}\n`);
    await fs.writeFile(path.join(desktopDir, 'deckspec.json'), `${JSON.stringify(deckSpec, null, 2)}\n`);

    manifestEntries.push({
      id: level.id,
      label: level.label,
      textAmount: level.textAmount,
    });
  }

  await fs.writeFile(path.join(DESKTOP_ROOT, 'README.md'), buildManifest(manifestEntries));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
