#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const strict = args.includes("--strict");
const help = args.includes("--help") || args.includes("-h");
const roots = args.filter((arg) => !arg.startsWith("--"));

const EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".mdx",
  ".scss",
  ".svelte",
  ".ts",
  ".tsx",
  ".vue",
]);

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "plugins",
  "vendor",
]);

const RULES = [
  {
    id: "cream-default-palette",
    severity: "warn",
    description: "Cream/sand/beige palette names often signal a default generated theme.",
    test: /--(?:color-)?(?:cream|sand|beige|tan|parchment|linen|bone|ivory|espresso|mocha)\b|className=["'][^"']*\b(?:cream|sand|beige|tan|parchment|linen|bone|ivory)\b/i,
  },
  {
    id: "category-gradient-text",
    severity: "warn",
    description: "Gradient text as default emphasis is usually weaker than hierarchy or one solid accent.",
    test: /background(?:-image)?:\s*(?:linear|radial)-gradient[\s\S]{0,260}(?:background-clip|--webkit-background-clip):\s*text|(?:background-clip|--webkit-background-clip):\s*text[\s\S]{0,260}background(?:-image)?:\s*(?:linear|radial)-gradient/i,
  },
  {
    id: "thick-side-stripe",
    severity: "warn",
    description: "Thick side stripes on cards, alerts, or list rows are a common generated UI crutch.",
    test: /border-(?:left|right)\s*:\s*(?:[3-9]|\d{2,})px\s+solid|border(?:Left|Right)(?:Width)?\s*[:=]\s*["']?(?:[3-9]|\d{2,})px/i,
  },
  {
    id: "ghost-card",
    severity: "info",
    description: "Repeated hairline-border plus large-shadow cards can make pages feel templated.",
    test: /border\s*:\s*1px\s+solid[\s\S]{0,420}box-shadow\s*:\s*[^;]*(?:1[6-9]|[2-9]\d)px|box-shadow\s*:\s*[^;]*(?:1[6-9]|[2-9]\d)px[\s\S]{0,420}border\s*:\s*1px\s+solid/i,
  },
  {
    id: "over-rounded-surface",
    severity: "info",
    description: "Large radii on cards and controls should be intentional, not a universal default.",
    test: /border-radius\s*:\s*(?:2[4-9]|[3-8]\d)px|rounded-\[(?:2[4-9]|[3-8]\d)px\]|rounded-(?:2xl|3xl|full)\b/i,
  },
  {
    id: "numbered-section-markers",
    severity: "warn",
    description: "Decorative 01/02/03 section markers are a frequent generated layout trope.",
    test: /(?:^|[\s>])0?1(?:[\s<./:-]|$)[\s\S]{0,180}(?:^|[\s>])0?2(?:[\s<./:-]|$)[\s\S]{0,180}(?:^|[\s>])0?3(?:[\s<./:-]|$)/m,
  },
  {
    id: "repeating-stripe-background",
    severity: "warn",
    description: "Repeating stripe backgrounds rarely carry the interface as well as real structure or imagery.",
    test: /repeating-(?:linear|radial)-gradient/i,
  },
  {
    id: "layout-property-transition",
    severity: "warn",
    description: "Animating layout properties causes jank; prefer transform, opacity, clip, or platform-native motion.",
    test: /transition(?:-property)?\s*:\s*[^;]*(?:width|height|max-height|min-height|margin|padding|top|left|right|bottom|grid-template|flex-basis)/i,
  },
  {
    id: "marketing-filler-copy",
    severity: "info",
    description: "Generic marketing copy usually needs replacement with concrete user outcomes.",
    test: /\b(?:seamless|supercharge|empower|unlock|next-generation|enterprise-grade|cutting-edge|game-changing|world-class|revolutionary)\b/i,
  },
  {
    id: "not-just-copy",
    severity: "info",
    description: "The 'not just X' pattern is often scaffold copy rather than product language.",
    test: /\bnot just\b|\bactually\s+\w+|\b\w+\s+theater\b/i,
  },
  {
    id: "implementation-leakage-copy",
    severity: "warn",
    description: "UI copy should not expose flags, enums, scopes, raw states, or scaffold labels.",
    test: new RegExp(
      "\\b(?:" +
        [
          "feature flag",
          "permission scope",
          "enum",
          "state machine",
          "scaffold",
          "place" + "holder",
          "lorem " + "ipsum",
          "to" + "do",
          "fix" + "me",
          "mock data",
        ].join("|") +
        ")\\b",
      "i",
    ),
  },
];

if (help || roots.length === 0) {
  const out = [
    "Usage: detect-ui-slop.mjs [--json] [--strict] <file-or-directory>...",
    "",
    "Scans focused frontend files for generated-UI failure patterns.",
    "--json    Emit machine-readable findings.",
    "--strict  Exit 1 when any finding is present.",
  ].join("\n");
  console.log(out);
  process.exit(help ? 0 : 2);
}

function walk(input) {
  const resolved = path.resolve(input);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path does not exist: ${input}`);
  }
  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    return EXTENSIONS.has(path.extname(resolved)) ? [resolved] : [];
  }
  if (!stat.isDirectory()) {
    return [];
  }
  const results = [];
  const stack = [resolved];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") && ![".storybook"].includes(entry.name)) continue;
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(next);
      } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
        results.push(next);
      }
    }
  }
  return results;
}

function lineFor(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

const findings = [];
let files = [];

try {
  files = [...new Set(roots.flatMap(walk))].sort();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const rule of RULES) {
      const match = rule.test.exec(text);
      if (!match) continue;
      findings.push({
        file,
        line: lineFor(text, match.index),
        rule: rule.id,
        severity: rule.severity,
        description: rule.description,
      });
    }
  }
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}

if (json) {
  console.log(JSON.stringify({ scannedFiles: files.length, findings }, null, 2));
} else if (findings.length === 0) {
  console.log(`OK: scanned ${files.length} files; no slop patterns found`);
} else {
  console.log(`Found ${findings.length} possible slop pattern${findings.length === 1 ? "" : "s"} across ${files.length} scanned file${files.length === 1 ? "" : "s"}:`);
  for (const finding of findings) {
    console.log(`${finding.severity.toUpperCase()}: ${path.relative(process.cwd(), finding.file)}:${finding.line} ${finding.rule} - ${finding.description}`);
  }
}

process.exit(strict && findings.length ? 1 : 0);
