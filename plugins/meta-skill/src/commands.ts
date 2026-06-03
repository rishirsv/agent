import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { importFeedback, initEvals, judgeRun, listRunSummaries, openRun, runEval } from "./evals";
import { decideSession, planImprovement, promotePlan } from "./improve";
import { lintProject } from "./lint";
import { packageProject } from "./package";
import { CliError } from "./project";
import { REPORT_VIEWS, buildMetaSkillReport, isReportView, renderLintReportMarkdown, renderReportHtml, renderReportMarkdown, renderRunListMarkdown } from "./reporting";
import { reviewProject } from "./review";
import { createSkill, initProject } from "./skills";
import { releaseProject } from "./versions";

const execFileAsync = promisify(execFile);

const HELP = `meta-skill

Usage:
  meta-skill create [skill-dir] [--project] --slug <slug> --title <title> --description <text> --job <text>
  meta-skill project init <skill-dir>
  meta-skill lint <project-or-skill> [--run <run-id>] [--json]
  meta-skill report <project> [--view status|runs|eval|review|release|full|lint] [--run <run-id>] [--review <review-id>] [--json] [--html] [--refresh] [--open]
  meta-skill review <project> [--json]
  meta-skill eval init <project>
  meta-skill eval generate <project> [--count <n>] [--family <R|F|T|G>] [--topic <topic>] [--strategy merge|replace] [--json]
  meta-skill eval run <project> [--scenario <id>] [--family <R|F|T|G>] [--topic <topic>] [--label "..."] [--snapshot | --no-skill] [--with-judges] [--no-lint]
  meta-skill eval judge <project> --run <run-id> (--judge <id> | --all-judges) (--scenario <id> | --all-scenarios)
  meta-skill eval feedback import <project> --run <run-id> <feedback.jsonl>
  meta-skill eval open <project> [--run <run-id>] [--list] [--json]
  meta-skill eval list <project> [--limit <n>] [--status <status>] [--json]
  meta-skill eval view <project> [--run <run-id>] [--last] [--json]
  meta-skill plan <project> [--from-run <run-id>] [--from-review <review-id>]
  meta-skill promote <project> --plan <plan-id>
  meta-skill decide <project> --session <session-id> --accept | --reject
  meta-skill release <project> [--from-run <run-id>]
  meta-skill package <project> [--source candidate|release] [--out <zip>] [--out-dir <dir>]
`;

export async function runCommand(argv: string[]): Promise<number> {
  if (!argv.length || argv[0] === "--help" || argv[0] === "-h") {
    console.log(HELP);
    return 0;
  }

  const [command, ...rest] = argv;
  switch (command) {
    case "create":
      return commandCreate(rest);
    case "project":
      return commandProject(rest);
    case "lint":
      return commandLint(rest);
    case "report":
      return commandReport(rest);
    case "review":
      return commandReview(rest);
    case "eval":
      return commandEval(rest);
    case "plan":
      return commandPlan(rest);
    case "promote":
      return commandPromote(rest);
    case "decide":
      return commandDecide(rest);
    case "release":
      return commandRelease(rest);
    case "package":
      return commandPackage(rest);
    default:
      throw new CliError(`unknown command: ${command}\n\n${HELP}`, 2);
  }
}

async function commandCreate(argv: string[]): Promise<number> {
  const args = parse(argv, ["slug", "title", "description", "job", "runtime-reference", "runtime-script", "runtime-asset"], ["project", "force"]);
  const result = await createSkill({
    target: args.positionals[0],
    slug: args.one("slug"),
    title: args.one("title"),
    description: args.one("description"),
    job: args.one("job"),
    project: args.has("project"),
    force: args.has("force"),
    runtimeReferences: args.many("runtime-reference"),
    runtimeScripts: args.many("runtime-script"),
    runtimeAssets: args.many("runtime-asset")
  });
  console.log(`created ${result.project ? "skill project" : "portable skill"}: ${result.path}`);
  console.log(`files: ${result.files.join(", ")}`);
  console.log(`next step: meta-skill lint ${shellPath(result.path)}`);
  return 0;
}

async function commandProject(argv: string[]): Promise<number> {
  const [subcommand, ...rest] = argv;
  if (subcommand !== "init") throw new CliError("project command supports only: meta-skill project init <skill-dir>", 2);
  const args = parse(rest, [], ["force"]);
  const target = args.positionals[0];
  if (!target) throw new CliError("project init requires <skill-dir>", 2);
  const result = await initProject(target, { force: args.has("force") });
  console.log(`initialized .meta-skill workbench: ${result.path}`);
  console.log(`next step: meta-skill lint ${shellPath(result.path)}`);
  return 0;
}

async function commandLint(argv: string[]): Promise<number> {
  const args = parse(argv, ["run"], ["json"]);
  const target = args.positionals[0] || ".";
  const report = await lintProject(target, { runId: args.one("run") });
  if (args.has("json")) console.log(JSON.stringify(report, null, 2));
  else console.log(renderLintReportMarkdown(report));
  return report.ok ? 0 : 1;
}

async function commandReport(argv: string[]): Promise<number> {
  const args = parse(argv, ["view", "run", "review"], ["json", "html", "refresh", "open"]);
  const project = args.positionals[0] || ".";
  const view = args.one("view") || "status";
  if (!isReportView(view)) {
    throw new CliError(`--view must be one of ${REPORT_VIEWS.join(", ")}`, 2);
  }
  if (args.has("json") && args.has("html")) throw new CliError("report accepts only one of --json or --html", 2);
  const report = await buildMetaSkillReport({
    project,
    view,
    runId: args.one("run"),
    reviewId: args.one("review"),
    refresh: args.has("refresh") ? "refresh" : "read"
  });
  if (args.has("json")) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }
  if (args.has("html")) {
    const html = renderReportHtml(report, report.subject.view);
    if (args.has("open") && process.stdout.isTTY) {
      const tmp = path.join(os.tmpdir(), `meta-skill-report-${Date.now()}.html`);
      await fs.writeFile(tmp, html.endsWith("\n") ? html : `${html}\n`, "utf8");
      await execFileAsync("open", [tmp]).catch(() => undefined);
      console.log(`html: ${tmp}`);
    } else {
      console.log(html);
    }
    return 0;
  }
  console.log(renderReportMarkdown(report, report.subject.view));
  return report.readiness.status === "blocked" ? 1 : 0;
}

async function commandReview(argv: string[]): Promise<number> {
  const args = parse(argv, [], ["json"]);
  const project = args.positionals[0] || ".";
  const result = await reviewProject(project);
  if (args.has("json")) console.log(JSON.stringify(result.data, null, 2));
  else {
    console.log(`review: ${result.reviewId}`);
    console.log(`score: ${result.score}/100`);
    console.log(`report: ${result.report}`);
    console.log(`next step: meta-skill plan ${shellPath(project)} --from-review ${result.reviewId}`);
  }
  return 0;
}

async function commandEval(argv: string[]): Promise<number> {
  const [subcommand, ...rest] = argv;
  switch (subcommand) {
    case "init":
      return commandEvalInit(rest);
    case "run":
      return commandEvalRun(rest);
    case "generate":
      return commandEvalGenerate(rest);
    case "judge":
      return commandEvalJudge(rest);
    case "feedback":
      return commandEvalFeedback(rest);
    case "open":
      return commandEvalOpen(rest, true);
    case "list":
      return commandEvalList(rest);
    case "view":
      return commandEvalOpen(rest, false);
    default:
      throw new CliError("eval command supports init, generate, run, judge, feedback import, open, list, and view", 2);
  }
}

async function commandEvalInit(argv: string[]): Promise<number> {
  const args = parse(argv, [], []);
  const project = args.positionals[0] || ".";
  const result = await initEvals(project);
  console.log(`eval workbench: ${result.path}`);
  for (const warning of result.warnings) console.log(`warning: ${warning}`);
  console.log(`next step: add scenarios, then meta-skill eval run ${shellPath(project)}`);
  return 0;
}

async function commandEvalRun(argv: string[]): Promise<number> {
  const args = parse(argv, ["scenario", "family", "topic", "label", "compare", "app-server-endpoint"], ["snapshot", "no-skill", "with-judges", "no-lint"]);
  const project = args.positionals[0] || ".";
  if (args.one("app-server-endpoint")) {
    throw new CliError("--app-server-endpoint is not supported yet; omit it to use the managed stdio App Server", 2);
  }
  if (args.one("compare")) throw new CliError("--compare was removed. Run one source at a time: omit source flags for the working payload, pass --snapshot for the saved snapshot payload, or pass --no-skill for unassisted execution.", 2);
  if (args.has("snapshot") && args.has("no-skill")) throw new CliError("eval run accepts only one source flag: --snapshot or --no-skill", 2);
  const family = args.one("family");
  if (family && !["R", "F", "T", "G"].includes(family)) throw new CliError("--family must be one of R, F, T, G", 2);
  const result = await runEval({
    project,
    selector: { scenario: args.many("scenario"), family, topic: args.many("topic") },
    label: args.one("label"),
    runSource: args.has("snapshot") ? "snapshot_payload" : args.has("no-skill") ? "no_skill" : "working_payload",
    withJudges: args.has("with-judges"),
    noLint: args.has("no-lint"),
    appServerEndpoint: undefined
  });
  console.log(formatEvalRunSummary(project, result));
  return result.ok ? 0 : 1;
}

async function commandEvalGenerate(argv: string[]): Promise<number> {
  parse(argv, ["count", "family", "topic", "strategy", "from-review", "from-run"], ["dry-run", "json"]);
  throw new CliError("eval generate is scaffolded but not implemented yet; create scenarios manually under .meta-skill/evals/scenarios/. Baseline-compatible generation remains future work because the current runner force-attaches the skill.", 2);
}

export function formatEvalRunSummary(
  project: string,
  result: { runId: string; status: string; manualReviewRequired: boolean; failureClassifications: string[]; report: string }
): string {
  const reportJson = path.join(path.dirname(result.report), "report.json");
  const lines = [
    `run: ${result.runId}`,
    `status: ${result.status}`,
    `manual review required: ${result.manualReviewRequired ? "yes" : "no"}`,
    `failure classifications: ${result.failureClassifications.length ? result.failureClassifications.join(", ") : "none"}`,
    `report.html: ${result.report}`,
    `report.json: ${reportJson}`
  ];
  if (result.status === "needs_review") {
    lines.push("note: needs_review is unresolved evidence, not pass proof.");
  }
  return lines.join("\n");
}

async function commandEvalJudge(argv: string[]): Promise<number> {
  const args = parse(argv, ["run", "judge", "scenario"], ["all-judges", "all-scenarios"]);
  const project = args.positionals[0] || ".";
  const runId = args.one("run");
  if (!runId) throw new CliError("eval judge requires --run <run-id>", 2);
  const result = await judgeRun({
    project,
    runId,
    judge: args.one("judge"),
    allJudges: args.has("all-judges"),
    scenario: args.one("scenario"),
    allScenarios: args.has("all-scenarios")
  });
  console.log(`judge annotations: ${result.annotations}`);
  console.log(`report refreshed: .meta-skill/evals/runs/${runId}/report.html`);
  console.log(`next step: meta-skill report ${shellPath(project)} --view eval --run ${runId}`);
  return result.ok ? 0 : 1;
}

async function commandEvalFeedback(argv: string[]): Promise<number> {
  const [subcommand, ...rest] = argv;
  if (subcommand !== "import") throw new CliError("eval feedback supports only: meta-skill eval feedback import <project> --run <run-id> <feedback.jsonl>", 2);
  const args = parse(rest, ["run"], []);
  const project = args.positionals[0] || ".";
  const feedback = args.positionals[1];
  const runId = args.one("run");
  if (!runId) throw new CliError("feedback import requires --run <run-id>", 2);
  if (!feedback) throw new CliError("feedback import requires <feedback.jsonl>", 2);
  const result = await importFeedback(project, runId, feedback);
  console.log(`imported feedback rows: ${result.rows}`);
  console.log(`report refreshed: ${result.report}`);
  console.log(`next step: meta-skill report ${shellPath(project)} --view eval --run ${runId}`);
  return 0;
}

async function commandEvalOpen(argv: string[], openHtml: boolean): Promise<number> {
  const args = parse(argv, ["run", "limit", "status"], ["list", "json", "last"]);
  const project = args.positionals[0] || ".";
  if (args.has("list")) {
    const runs = await listRunSummaries(project, parseRunListOptions(args));
    if (args.has("json")) console.log(JSON.stringify(runs, null, 2));
    else console.log(renderRunListMarkdown(runs));
    return 0;
  }
  const result = await openRun(project, args.one("run"));
  if (args.has("json")) {
    console.log(JSON.stringify(result.data, null, 2));
    return 0;
  }
  if (openHtml && process.stdout.isTTY) {
    await execFileAsync("open", [result.report]).catch(() => undefined);
  }
  if (openHtml) {
    console.log(`report: ${result.report}`);
    console.log(`json: ${result.reportJson}`);
  } else {
    const report = await buildMetaSkillReport({ project, view: "eval", runId: result.runId, refresh: "read" });
    console.log(renderReportMarkdown(report, "eval"));
  }
  return 0;
}

async function commandEvalList(argv: string[]): Promise<number> {
  const args = parse(argv, ["limit", "status"], ["json"]);
  const project = args.positionals[0] || ".";
  const runs = await listRunSummaries(project, parseRunListOptions(args));
  if (args.has("json")) console.log(JSON.stringify(runs, null, 2));
  else console.log(renderRunListMarkdown(runs));
  return 0;
}

async function commandPlan(argv: string[]): Promise<number> {
  const args = parse(argv, ["from-run", "from-review"], []);
  const project = args.positionals[0] || ".";
  const result = await planImprovement({ project, fromRun: args.one("from-run"), fromReview: args.one("from-review") });
  console.log(`plan: ${result.planId}`);
  console.log(`path: ${result.planRoot}`);
  console.log(`next step: fill plan.json edits, then meta-skill promote ${shellPath(project)} --plan ${result.planId}`);
  return 0;
}

async function commandPromote(argv: string[]): Promise<number> {
  const args = parse(argv, ["plan"], []);
  const project = args.positionals[0] || ".";
  const planId = args.one("plan");
  if (!planId) throw new CliError("promote requires --plan <plan-id>", 2);
  const result = await promotePlan(project, planId);
  console.log(`promoted plan: ${planId}`);
  console.log(`session: ${result.sessionId}`);
  console.log(`files: ${result.applied.join(", ")}`);
  console.log(`next step: meta-skill decide ${shellPath(project)} --session ${result.sessionId} --accept`);
  return 0;
}

async function commandDecide(argv: string[]): Promise<number> {
  const args = parse(argv, ["session"], ["accept", "reject"]);
  const project = args.positionals[0] || ".";
  const sessionId = args.one("session");
  if (!sessionId) throw new CliError("decide requires --session <session-id>", 2);
  if (args.has("accept") === args.has("reject")) throw new CliError("decide requires exactly one of --accept or --reject", 2);
  const decision = args.has("accept") ? "accept" : "reject";
  const result = await decideSession(project, sessionId, decision);
  console.log(`decision: ${decision}`);
  console.log(`path: ${result.sessionRoot}`);
  return 0;
}

async function commandRelease(argv: string[]): Promise<number> {
  const args = parse(argv, ["from-run"], []);
  const project = args.positionals[0] || ".";
  const result = await releaseProject(project, { fromRun: args.one("from-run") });
  console.log(`release: ${result.releaseRoot}`);
  console.log(`files: ${result.files.join(", ")}`);
  console.log(`next step: meta-skill package ${shellPath(project)} --source release`);
  return 0;
}

function parseRunListOptions(args: ParsedArgs): { limit?: number; status?: string } {
  const rawLimit = args.one("limit");
  const limit = rawLimit === undefined ? undefined : Number(rawLimit);
  if (rawLimit !== undefined) {
    const parsed = Number(rawLimit);
    if (!Number.isInteger(parsed) || parsed < 1) throw new CliError("--limit must be a positive integer", 2);
    return { limit: parsed, status: args.one("status") };
  }
  return { limit, status: args.one("status") };
}

async function commandPackage(argv: string[]): Promise<number> {
  const args = parse(argv, ["source", "out", "out-dir"], []);
  const project = args.positionals[0] || ".";
  const source = args.one("source");
  if (source && !["candidate", "release"].includes(source)) throw new CliError("--source must be candidate or release", 2);
  const result = await packageProject({
    project,
    source: source as "candidate" | "release" | undefined,
    out: args.one("out"),
    outDir: args.one("out-dir")
  });
  console.log(`package: ${result.artifact}`);
  console.log(`metadata: ${result.metadata}`);
  console.log(`files: ${result.files.join(", ")}`);
  return 0;
}

class ParsedArgs {
  constructor(
    public positionals: string[],
    private values: Map<string, string[]>,
    private booleans: Set<string>
  ) {}

  one(name: string): string | undefined {
    return this.values.get(name)?.at(-1);
  }

  many(name: string): string[] {
    return this.values.get(name) || [];
  }

  has(name: string): boolean {
    return this.booleans.has(name);
  }
}

function parse(argv: string[], valueFlags: string[], booleanFlags: string[]): ParsedArgs {
  const valueSet = new Set(valueFlags);
  const booleanSet = new Set(booleanFlags);
  const values = new Map<string, string[]>();
  const booleans = new Set<string>();
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const name = token.slice(2);
    if (booleanSet.has(name)) {
      booleans.add(name);
      continue;
    }
    if (!valueSet.has(name)) throw new CliError(`unknown flag: --${name}`, 2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) throw new CliError(`--${name} requires a value`, 2);
    if (!values.has(name)) values.set(name, []);
    values.get(name)?.push(value);
    index += 1;
  }
  return new ParsedArgs(positionals, values, booleans);
}

function shellPath(target: string): string {
  return target.includes(" ") ? JSON.stringify(target) : target;
}
