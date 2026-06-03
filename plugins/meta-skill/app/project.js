"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORTABLE_DIRS = exports.PORTABLE_FILES = exports.CliError = void 0;
exports.utcNow = utcNow;
exports.slugify = slugify;
exports.assertSlug = assertSlug;
exports.exists = exists;
exports.ensureDir = ensureDir;
exports.readText = readText;
exports.writeText = writeText;
exports.readJson = readJson;
exports.writeJson = writeJson;
exports.appendJsonl = appendJsonl;
exports.touch = touch;
exports.parseSkillFrontmatter = parseSkillFrontmatter;
exports.projectPaths = projectPaths;
exports.requirePortableSkill = requirePortableSkill;
exports.createWorkbench = createWorkbench;
exports.listPortablePayloadFiles = listPortablePayloadFiles;
exports.copyPortablePayload = copyPortablePayload;
exports.nextSequencedId = nextSequencedId;
exports.relativePath = relativePath;
exports.gitContext = gitContext;
exports.sha256File = sha256File;
exports.unavailableTokenUsage = unavailableTokenUsage;
exports.eventEnvelope = eventEnvelope;
const node_child_process_1 = require("node:child_process");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
class CliError extends Error {
    exitCode;
    constructor(message, exitCode = 1) {
        super(message);
        this.exitCode = exitCode;
    }
}
exports.CliError = CliError;
exports.PORTABLE_FILES = new Set(["SKILL.md"]);
exports.PORTABLE_DIRS = new Set(["agents", "references", "scripts", "assets"]);
function utcNow() {
    return new Date().toISOString();
}
function slugify(text, fallback = "item") {
    const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
    return slug || fallback;
}
function assertSlug(slug, label = "slug") {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new CliError(`${label} must use lowercase letters, numbers, and single hyphens`);
    }
}
async function exists(target) {
    try {
        await node_fs_1.promises.access(target);
        return true;
    }
    catch {
        return false;
    }
}
async function ensureDir(target) {
    await node_fs_1.promises.mkdir(target, { recursive: true });
}
async function readText(target) {
    return node_fs_1.promises.readFile(target, "utf8");
}
async function writeText(target, text) {
    await ensureDir(node_path_1.default.dirname(target));
    await node_fs_1.promises.writeFile(target, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}
async function readJson(target) {
    try {
        return JSON.parse(await readText(target));
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new CliError(`${target}: invalid JSON (${detail})`);
    }
}
async function writeJson(target, value) {
    await writeText(target, `${JSON.stringify(value, null, 2)}\n`);
}
async function appendJsonl(target, value) {
    await ensureDir(node_path_1.default.dirname(target));
    await node_fs_1.promises.appendFile(target, `${JSON.stringify(value)}\n`, "utf8");
}
async function touch(target) {
    await ensureDir(node_path_1.default.dirname(target));
    await node_fs_1.promises.appendFile(target, "");
}
async function parseSkillFrontmatter(skillMd) {
    const text = await readText(skillMd);
    if (!text.startsWith("---\n")) {
        return {};
    }
    const end = text.indexOf("\n---\n", 4);
    if (end === -1) {
        return {};
    }
    const raw = text.slice(4, end).split(/\r?\n/);
    const parsed = {};
    for (const line of raw) {
        const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
        if (!match)
            continue;
        const key = match[1];
        const value = match[2].replace(/^['"]|['"]$/g, "").trim();
        if (key === "name")
            parsed.name = value;
        if (key === "description")
            parsed.description = value;
    }
    return parsed;
}
function projectPaths(projectRoot) {
    const root = node_path_1.default.resolve(projectRoot);
    const meta = node_path_1.default.join(root, ".meta-skill");
    return {
        root,
        skillMd: node_path_1.default.join(root, "SKILL.md"),
        meta,
        spec: node_path_1.default.join(meta, "spec.md"),
        evals: node_path_1.default.join(meta, "evals"),
        evalManifest: node_path_1.default.join(meta, "evals", "evals.json"),
        scenarios: node_path_1.default.join(meta, "evals", "scenarios"),
        judges: node_path_1.default.join(meta, "evals", "judges"),
        runs: node_path_1.default.join(meta, "evals", "runs"),
        tests: node_path_1.default.join(meta, "tests"),
        testManifest: node_path_1.default.join(meta, "tests", "manifest.json"),
        unitTests: node_path_1.default.join(meta, "tests", "unit"),
        evalTests: node_path_1.default.join(meta, "tests", "eval"),
        versions: node_path_1.default.join(meta, "versions"),
        release: node_path_1.default.join(meta, "versions", "release"),
        releaseSkill: node_path_1.default.join(meta, "versions", "release", "skill"),
        reviews: node_path_1.default.join(meta, "reviews"),
        plans: node_path_1.default.join(meta, "plans"),
        sessions: node_path_1.default.join(meta, "sessions")
    };
}
async function requirePortableSkill(projectRoot) {
    const root = node_path_1.default.resolve(projectRoot);
    if (!(await exists(node_path_1.default.join(root, "SKILL.md")))) {
        throw new CliError(`portable skill root must contain SKILL.md: ${root}`);
    }
    return root;
}
async function createWorkbench(projectRoot, options = {}) {
    const root = await requirePortableSkill(projectRoot);
    const p = projectPaths(root);
    const frontmatter = await parseSkillFrontmatter(p.skillMd);
    const skillName = frontmatter.name || node_path_1.default.basename(root);
    await ensureDir(p.meta);
    await ensureDir(p.scenarios);
    await ensureDir(p.judges);
    await ensureDir(p.runs);
    await ensureDir(p.unitTests);
    await ensureDir(p.evalTests);
    await ensureDir(p.versions);
    await ensureDir(p.releaseSkill);
    await ensureDir(p.reviews);
    await ensureDir(p.plans);
    await ensureDir(p.sessions);
    if (options.force || !(await exists(p.spec))) {
        await writeText(p.spec, `# ${skillName} Meta Skill Spec\n\n## Purpose\n\nRecord why this skill exists, the workflow boundary, and the release/eval intent.\n\n## Boundaries\n\n- Portable payload lives at the project root.\n- Authoring workbench state lives under \`.meta-skill/\`.\n\n## Open Questions\n\n- None recorded yet.\n`);
    }
    if (options.force || !(await exists(p.evalManifest))) {
        const manifest = {
            schema_version: 1,
            skill_name: skillName,
            suite: {
                name: "default",
                description: "Behavior, routing, gates, and known failure-mode coverage."
            },
            scenarios: { path: "scenarios" },
            defaults: { runner: "app_server", run_source: "working_payload", timeout_ms: 120000 }
        };
        await writeJson(p.evalManifest, manifest);
    }
    if (options.force || !(await exists(p.testManifest))) {
        const tests = { schema_version: 1, tests: [] };
        await writeJson(p.testManifest, tests);
    }
}
async function listPortablePayloadFiles(skillRoot) {
    const root = node_path_1.default.resolve(skillRoot);
    const entries = [];
    if (!(await exists(node_path_1.default.join(root, "SKILL.md")))) {
        throw new CliError(`portable payload is missing SKILL.md: ${root}`);
    }
    async function walk(relativeDir) {
        const absoluteDir = node_path_1.default.join(root, relativeDir);
        for (const dirent of await node_fs_1.promises.readdir(absoluteDir, { withFileTypes: true })) {
            const relative = node_path_1.default.join(relativeDir, dirent.name);
            if (relative === ".meta-skill" || relative.startsWith(`.meta-skill${node_path_1.default.sep}`))
                continue;
            if (!relativeDir && !(exports.PORTABLE_FILES.has(dirent.name) || exports.PORTABLE_DIRS.has(dirent.name)))
                continue;
            if (dirent.isDirectory()) {
                if (!relativeDir && !exports.PORTABLE_DIRS.has(dirent.name))
                    continue;
                await walk(relative);
            }
            else if (dirent.isFile()) {
                entries.push(relative);
            }
        }
    }
    await walk("");
    return entries.sort();
}
async function copyPortablePayload(sourceRoot, destinationRoot) {
    const source = node_path_1.default.resolve(sourceRoot);
    const destination = node_path_1.default.resolve(destinationRoot);
    const files = await listPortablePayloadFiles(source);
    await node_fs_1.promises.rm(destination, { recursive: true, force: true });
    for (const relative of files) {
        const sourceFile = node_path_1.default.join(source, relative);
        const destFile = node_path_1.default.join(destination, relative);
        await ensureDir(node_path_1.default.dirname(destFile));
        await node_fs_1.promises.copyFile(sourceFile, destFile);
    }
    return files;
}
async function nextSequencedId(parent, label) {
    await ensureDir(parent);
    const children = await node_fs_1.promises.readdir(parent, { withFileTypes: true });
    const max = children.reduce((acc, child) => {
        if (!child.isDirectory())
            return acc;
        const match = /^(\d{3})-/.exec(child.name);
        return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);
    const prefix = String(max + 1).padStart(3, "0");
    return `${prefix}-${slugify(label, "run").slice(0, 80)}`;
}
function relativePath(fromDir, toPath) {
    const relative = node_path_1.default.relative(fromDir, toPath) || ".";
    return relative.split(node_path_1.default.sep).join("/");
}
async function gitContext(cwd) {
    try {
        const { stdout: commit } = await execFileAsync("git", ["rev-parse", "--short", "HEAD"], { cwd });
        const { stdout: status } = await execFileAsync("git", ["status", "--short"], { cwd });
        return { git_commit: commit.trim() || null, dirty: status.trim().length > 0 };
    }
    catch {
        return { git_commit: null, dirty: null };
    }
}
async function sha256File(target) {
    const bytes = await node_fs_1.promises.readFile(target);
    return `sha256:${(0, node_crypto_1.createHash)("sha256").update(bytes).digest("hex")}`;
}
function unavailableTokenUsage(reason) {
    return {
        input_tokens: { available: false, reason },
        output_tokens: { available: false, reason },
        total_tokens: { available: false, reason }
    };
}
function eventEnvelope(input) {
    return {
        schema_version: 1,
        created_at: input.created_at || utcNow(),
        ...input
    };
}
