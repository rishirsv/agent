#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const STRICT = process.argv.includes('--strict');
const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, 'generator', 'builders');
const HEX_PATTERN = /['"`]([0-9A-Fa-f]{6})['"`]/g;
const FONT_SIZE_PATTERN = /\bfontSize\s*:\s*(\d+(?:\.\d+)?)\b/g;

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    if (entry.isFile() && abs.endsWith('.js')) out.push(abs);
  }
  return out;
}

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

const findings = [];
for (const abs of walkFiles(TARGET_DIR)) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const source = fs.readFileSync(abs, 'utf8');

  for (const match of source.matchAll(HEX_PATTERN)) {
    findings.push({
      file: rel,
      line: lineOf(source, match.index),
      message: `raw hex color literal "${match[1]}"`,
    });
  }
  for (const match of source.matchAll(FONT_SIZE_PATTERN)) {
    findings.push({
      file: rel,
      line: lineOf(source, match.index),
      message: `raw fontSize literal ${match[1]}`,
    });
  }
}

if (findings.length === 0) {
  console.log('Builder style grep: no raw hex/font-size literals.');
  process.exit(0);
}

console.log(`Builder style grep findings: ${findings.length}`);
for (const finding of findings.slice(0, 120)) {
  console.log(`${finding.file}:${finding.line} ${finding.message}`);
}
if (findings.length > 120) {
  console.log(`...and ${findings.length - 120} more`);
}

if (STRICT) process.exit(1);
