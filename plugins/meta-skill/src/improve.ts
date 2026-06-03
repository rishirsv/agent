import { promises as fs } from "node:fs";
import path from "node:path";
import { CliError, ensureDir, exists, nextSequencedId, projectPaths, readJson, requirePortableSkill, utcNow, writeJson, writeText } from "./project";

export async function planImprovement(options: { project: string; fromRun?: string; fromReview?: string }): Promise<{ planId: string; planRoot: string }> {
  const root = await requirePortableSkill(options.project);
  if (!options.fromRun && !options.fromReview) {
    throw new CliError("plan requires evidence: pass --from-run <run-id> or --from-review <review-id>");
  }
  const p = projectPaths(root);
  if (options.fromRun && !(await exists(path.join(p.runs, options.fromRun)))) throw new CliError(`eval run does not exist: ${options.fromRun}`);
  if (options.fromReview && !(await exists(path.join(p.reviews, options.fromReview)))) throw new CliError(`review does not exist: ${options.fromReview}`);

  const planId = await nextSequencedId(p.plans, "bounded-improvement");
  const planRoot = path.join(p.plans, planId);
  await ensureDir(planRoot);
  const plan = {
    schema_version: 1,
    plan_id: planId,
    created_at: utcNow(),
    evidence: {
      run_id: options.fromRun || null,
      review_id: options.fromReview || null
    },
    status: "planned",
    summary: "Fill in one bounded working-payload edit tied to the cited evidence before promotion.",
    edits: [] as Array<{ path: string; content: string }>
  };
  await writeJson(path.join(planRoot, "plan.json"), plan);
  await writeText(
    path.join(planRoot, "summary.md"),
    `# Improvement Plan ${planId}\n\nEvidence run: ${options.fromRun || "none"}\nEvidence review: ${options.fromReview || "none"}\n\n## Working Payload Edit\n\nAdd exactly one bounded edit to \`plan.json\` under \`edits\` before running \`meta-skill promote\`.\n`
  );
  return { planId, planRoot };
}

export async function promotePlan(project: string, planId: string): Promise<{ sessionId: string; applied: string[]; sessionRoot: string }> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  const planRoot = path.join(p.plans, planId);
  const planPath = path.join(planRoot, "plan.json");
  if (!(await exists(planPath))) throw new CliError(`plan does not exist: ${planId}`);
  const plan = await readJson<{ edits?: Array<{ path: string; content: string }> }>(planPath);
  const edits = plan.edits || [];
  if (!edits.length) throw new CliError(`plan ${planId} has no edits to promote; fill plan.json edits first`);

  const applied: string[] = [];
  for (const edit of edits) {
    validatePortableEdit(edit.path);
    const target = path.join(root, edit.path);
    await ensureDir(path.dirname(target));
    await fs.writeFile(target, edit.content.endsWith("\n") ? edit.content : `${edit.content}\n`, "utf8");
    applied.push(edit.path);
  }
  const sessionId = await nextSequencedId(p.sessions, "promote");
  const sessionRoot = path.join(p.sessions, sessionId);
  await ensureDir(sessionRoot);
  await writeJson(path.join(sessionRoot, "session.json"), {
    schema_version: 1,
    session_id: sessionId,
    created_at: utcNow(),
    plan_id: planId,
    status: "promoted",
    applied
  });
  return { sessionId, applied, sessionRoot };
}

export async function decideSession(project: string, sessionId: string, decision: "accept" | "reject"): Promise<{ sessionRoot: string }> {
  const root = await requirePortableSkill(project);
  const sessionRoot = path.join(projectPaths(root).sessions, sessionId);
  if (!(await exists(path.join(sessionRoot, "session.json")))) throw new CliError(`session does not exist: ${sessionId}`);
  await writeJson(path.join(sessionRoot, "decision.json"), {
    schema_version: 1,
    session_id: sessionId,
    decision,
    decided_at: utcNow()
  });
  return { sessionRoot };
}

function validatePortableEdit(relative: string): void {
  if (path.isAbsolute(relative) || relative.includes("..")) throw new CliError(`edit path must stay inside portable payload: ${relative}`);
  const first = relative.split(/[\\/]/)[0];
  if (!["SKILL.md", "agents", "references", "scripts", "assets"].includes(first)) {
    throw new CliError(`promote may only edit portable payload files, not ${relative}`);
  }
  if (first === ".meta-skill") throw new CliError("promote must not edit .meta-skill/");
}
