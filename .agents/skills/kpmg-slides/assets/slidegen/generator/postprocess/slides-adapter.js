import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_TIMEOUT_MS = 180000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve a usable slides runtime directory.
 * @returns {string|null}
 */
function resolveSlidesDir() {
  const envDir = process.env.SLIDES_SKILL_DIR;
  const bundledRuntime = path.resolve(__dirname, 'slides-runtime');
  const repoRelativeSkills = path.resolve(process.cwd(), '..', '..', '.agents', 'skills', 'oai-skills', 'slides');
  const repoRelativeLegacy = path.resolve(process.cwd(), '..', '..', '.agents', 'oai-skills', 'slides');
  const homeRelativeSkills = path.join(os.homedir(), '.agents', 'skills', 'oai-skills', 'slides');
  const homeRelativeLegacy = path.join(os.homedir(), '.agents', 'oai-skills', 'slides');
  const candidates = [
    envDir,
    bundledRuntime,
    repoRelativeSkills,
    repoRelativeLegacy,
    homeRelativeSkills,
    homeRelativeLegacy,
  ].filter(Boolean);
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    const required = ['render_slides.py', 'create_montage.py', 'slides_test.py'];
    if (required.every((name) => fs.existsSync(path.join(dir, name)))) return dir;
  }
  return null;
}

/**
 * Parse failing slide indices from slides_test stdout.
 * @param {string} output
 * @returns {number[]}
 */
function parseFailingSlides(output = '') {
  const match = output.match(/indexing\):\s*([0-9,\s]+)/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0);
}

/**
 * Build a resilient adapter around embedded oai-skills/slides scripts.
 * All methods return status objects; none throw.
 * @returns {object}
 */
export function createSlidesAdapter() {
  const slidesDir = resolveSlidesDir();
  const python = process.env.PYTHON_BIN || 'python3';
  const scripts = {
    render: slidesDir ? path.join(slidesDir, 'render_slides.py') : null,
    montage: slidesDir ? path.join(slidesDir, 'create_montage.py') : null,
    overflow: slidesDir ? path.join(slidesDir, 'slides_test.py') : null,
  };
  const pythonExists =
    spawnSync('bash', ['-lc', `command -v ${python} >/dev/null 2>&1`], { stdio: 'ignore' }).status === 0;

  const availability = (() => {
    if (!slidesDir) {
      return {
        available: false,
        reason: 'slides_runtime_not_found',
        slidesDir: null,
        python,
      };
    }
    if (!pythonExists) {
      return {
        available: false,
        reason: 'python_not_found',
        slidesDir,
        python,
      };
    }
    return {
      available: true,
      reason: null,
      slidesDir,
      python,
    };
  })();

  function runScript(scriptPath, args = []) {
    if (!availability.available) {
      return {
        ok: false,
        status: 'skipped',
        reason: availability.reason || 'unavailable',
        stdout: '',
        stderr: '',
        code: null,
      };
    }
    const result = spawnSync(python, [scriptPath, ...args], {
      cwd: slidesDir,
      encoding: 'utf8',
      timeout: DEFAULT_TIMEOUT_MS,
    });
    const code = result.status;
    return {
      ok: code === 0,
      status: code === 0 ? 'ok' : 'error',
      reason: code === 0 ? null : 'script_failed',
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      code,
    };
  }

  function toAbsPath(targetPath) {
    return path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);
  }

  return {
    detectAvailability() {
      return { ...availability };
    },

    renderPreview({ pptxPath, outputDir, width = 1600, height = 900 }) {
      if (!availability.available) {
        return {
          status: 'skipped',
          reason: availability.reason,
          outputDir,
          slideImageCount: 0,
        };
      }
      const absPptxPath = toAbsPath(pptxPath);
      const absOutputDir = toAbsPath(outputDir);
      fs.mkdirSync(absOutputDir, { recursive: true });
      const run = runScript(scripts.render, [
        absPptxPath,
        '--output_dir',
        absOutputDir,
        '--width',
        String(width),
        '--height',
        String(height),
      ]);
      if (!run.ok) {
        return {
          status: 'error',
          reason: run.reason,
          outputDir: absOutputDir,
          slideImageCount: 0,
          stderr: run.stderr,
        };
      }
      const files = fs.readdirSync(absOutputDir).filter((name) => /^slide-\d+\.png$/i.test(name));
      return {
        status: 'ok',
        reason: null,
        outputDir: absOutputDir,
        slideImageCount: files.length,
        width,
        height,
      };
    },

    createMontage({ inputDir, outputFile, numCol = 5, labelMode = 'number' }) {
      if (!availability.available) {
        return {
          status: 'skipped',
          reason: availability.reason,
          path: outputFile,
        };
      }
      const absInputDir = toAbsPath(inputDir);
      const absOutputFile = toAbsPath(outputFile);
      fs.mkdirSync(path.dirname(absOutputFile), { recursive: true });
      const run = runScript(scripts.montage, [
        '--input_dir',
        absInputDir,
        '--output_file',
        absOutputFile,
        '--num_col',
        String(numCol),
        '--label_mode',
        labelMode,
      ]);
      if (!run.ok) {
        return {
          status: 'error',
          reason: run.reason,
          path: absOutputFile,
          stderr: run.stderr,
        };
      }
      return {
        status: fs.existsSync(absOutputFile) ? 'ok' : 'error',
        reason: fs.existsSync(absOutputFile) ? null : 'montage_not_created',
        path: absOutputFile,
        numCol,
        labelMode,
      };
    },

    runVisualOverflow({ pptxPath, width = 1600, height = 900, padPx = 100 }) {
      if (!availability.available) {
        return {
          status: 'skipped',
          reason: availability.reason,
          failingSlides: [],
          imagePaths: [],
        };
      }
      const absPptxPath = toAbsPath(pptxPath);
      const run = runScript(scripts.overflow, [
        absPptxPath,
        '--width',
        String(width),
        '--height',
        String(height),
        '--pad_px',
        String(padPx),
      ]);
      const output = `${run.stdout || ''}\n${run.stderr || ''}`;
      const failingSlides = parseFailingSlides(output);
      const imagePaths = output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.endsWith('.png') && fs.existsSync(line));

      if (/Test passed\./i.test(output)) {
        return {
          status: 'pass',
          reason: null,
          failingSlides: [],
          imagePaths: [],
        };
      }
      if (/Slides with content overflowing/i.test(output) || failingSlides.length > 0) {
        return {
          status: 'fail',
          reason: 'overflow_detected',
          failingSlides,
          imagePaths,
        };
      }
      if (!run.ok) {
        return {
          status: 'error',
          reason: 'script_failed',
          failingSlides: [],
          imagePaths: [],
          stderr: run.stderr,
        };
      }
      return {
        status: 'error',
        reason: 'unknown_output',
        failingSlides: [],
        imagePaths: [],
      };
    },
  };
}
