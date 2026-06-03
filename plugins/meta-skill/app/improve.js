"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.planImprovement = planImprovement;
exports.promotePlan = promotePlan;
exports.decideSession = decideSession;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const project_1 = require("./project");
async function planImprovement(options) {
    const root = await (0, project_1.requirePortableSkill)(options.project);
    if (!options.fromRun && !options.fromReview) {
        throw new project_1.CliError("plan requires evidence: pass --from-run <run-id> or --from-review <review-id>");
    }
    const p = (0, project_1.projectPaths)(root);
    if (options.fromRun && !(await (0, project_1.exists)(node_path_1.default.join(p.runs, options.fromRun))))
        throw new project_1.CliError(`eval run does not exist: ${options.fromRun}`);
    if (options.fromReview && !(await (0, project_1.exists)(node_path_1.default.join(p.reviews, options.fromReview))))
        throw new project_1.CliError(`review does not exist: ${options.fromReview}`);
    const planId = await (0, project_1.nextSequencedId)(p.plans, "bounded-improvement");
    const planRoot = node_path_1.default.join(p.plans, planId);
    await (0, project_1.ensureDir)(planRoot);
    const plan = {
        schema_version: 1,
        plan_id: planId,
        created_at: (0, project_1.utcNow)(),
        evidence: {
            run_id: options.fromRun || null,
            review_id: options.fromReview || null
        },
        status: "planned",
        summary: "Fill in one bounded working-payload edit tied to the cited evidence before promotion.",
        edits: []
    };
    await (0, project_1.writeJson)(node_path_1.default.join(planRoot, "plan.json"), plan);
    await (0, project_1.writeText)(node_path_1.default.join(planRoot, "summary.md"), `# Improvement Plan ${planId}\n\nEvidence run: ${options.fromRun || "none"}\nEvidence review: ${options.fromReview || "none"}\n\n## Working Payload Edit\n\nAdd exactly one bounded edit to \`plan.json\` under \`edits\` before running \`meta-skill promote\`.\n`);
    return { planId, planRoot };
}
async function promotePlan(project, planId) {
    const root = await (0, project_1.requirePortableSkill)(project);
    const p = (0, project_1.projectPaths)(root);
    const planRoot = node_path_1.default.join(p.plans, planId);
    const planPath = node_path_1.default.join(planRoot, "plan.json");
    if (!(await (0, project_1.exists)(planPath)))
        throw new project_1.CliError(`plan does not exist: ${planId}`);
    const plan = await (0, project_1.readJson)(planPath);
    const edits = plan.edits || [];
    if (!edits.length)
        throw new project_1.CliError(`plan ${planId} has no edits to promote; fill plan.json edits first`);
    const applied = [];
    for (const edit of edits) {
        validatePortableEdit(edit.path);
        const target = node_path_1.default.join(root, edit.path);
        await (0, project_1.ensureDir)(node_path_1.default.dirname(target));
        await node_fs_1.promises.writeFile(target, edit.content.endsWith("\n") ? edit.content : `${edit.content}\n`, "utf8");
        applied.push(edit.path);
    }
    const sessionId = await (0, project_1.nextSequencedId)(p.sessions, "promote");
    const sessionRoot = node_path_1.default.join(p.sessions, sessionId);
    await (0, project_1.ensureDir)(sessionRoot);
    await (0, project_1.writeJson)(node_path_1.default.join(sessionRoot, "session.json"), {
        schema_version: 1,
        session_id: sessionId,
        created_at: (0, project_1.utcNow)(),
        plan_id: planId,
        status: "promoted",
        applied
    });
    return { sessionId, applied, sessionRoot };
}
async function decideSession(project, sessionId, decision) {
    const root = await (0, project_1.requirePortableSkill)(project);
    const sessionRoot = node_path_1.default.join((0, project_1.projectPaths)(root).sessions, sessionId);
    if (!(await (0, project_1.exists)(node_path_1.default.join(sessionRoot, "session.json"))))
        throw new project_1.CliError(`session does not exist: ${sessionId}`);
    await (0, project_1.writeJson)(node_path_1.default.join(sessionRoot, "decision.json"), {
        schema_version: 1,
        session_id: sessionId,
        decision,
        decided_at: (0, project_1.utcNow)()
    });
    return { sessionRoot };
}
function validatePortableEdit(relative) {
    if (node_path_1.default.isAbsolute(relative) || relative.includes(".."))
        throw new project_1.CliError(`edit path must stay inside portable payload: ${relative}`);
    const first = relative.split(/[\\/]/)[0];
    if (!["SKILL.md", "agents", "references", "scripts", "assets"].includes(first)) {
        throw new project_1.CliError(`promote may only edit portable payload files, not ${relative}`);
    }
    if (first === ".meta-skill")
        throw new project_1.CliError("promote must not edit .meta-skill/");
}
