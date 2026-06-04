import { initEvals, importFeedback, judgeRun, runEval } from "./evals.ts";
import { recordDecision } from "./improve.ts";
import { lintProject } from "./lint.ts";
import { packageProject } from "./package.ts";
import { CliError } from "./project.ts";
import { buildProjectEvidenceReport, buildRunEvidenceReport, renderEvidenceReportJson, renderEvidenceReportMarkdown, renderLintReportMarkdown } from "./reporting.ts";
import { createSkill, initProject } from "./skills.ts";
import { projectPaths, requirePortableSkill } from "./project.ts";
import path from "node:path";

const HELP = `meta-skill

Usage:
  meta-skill create [skill-dir] [--project] --slug <slug> --title <title> --description <text> --job <text>
  meta-skill project init <skill-dir>
  meta-skill lint <project-or-skill> [--run <run-id>] [--json]
  meta-skill report [run-id] [case-id] [--project <dir>] [--json]
  meta-skill run <project> [--case <id>] [--type <R|F|G>] [--topic <topic>] [--label "..."] [--no-skill] [--with-judges] [--no-lint]
  meta-skill judge <project> --run <run-id> (--judge <id> | --all-judges) (--case <id> | --all-cases)
  meta-skill feedback import <project> --run <run-id> <feedback.jsonl>
  meta-skill decide <project> --run <run-id> --evidence <path[:line]> [--evidence <path[:line]> ...] [--commit <sha>] --accept | --reject
  meta-skill package <project> [--out <zip>] [--out-dir <dir>]
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
    case "run":
      return commandRun(rest);
    case "judge":
      return commandJudge(rest);
    case "feedback":
      return commandFeedback(rest);
    case "decide":
      return commandDecide(rest);
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
  await initEvals(result.path);
  console.log(`initialized .meta-skill workbench: ${result.path}`);
  console.log(`next step: add cases, then meta-skill run ${shellPath(result.path)}`);
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
  const args = parse(argv, ["project"], ["json"]);
  const project = args.one("project") || ".";
  const root = await requirePortableSkill(project);
  const runId = args.positionals[0];
  const caseId = args.positionals[1];
  const report = runId
    ? await buildRunEvidenceReport(path.join(projectPaths(root).runs, runId), { caseId })
    : await buildProjectEvidenceReport(root);
  if (args.has("json")) console.log(renderEvidenceReportJson(report));
  else console.log(renderEvidenceReportMarkdown(report));
  return 0;
}

async function commandRun(argv: string[]): Promise<number> {
  const args = parse(argv, ["case", "type", "topic", "label", "app-server-endpoint"], ["no-skill", "with-judges", "no-lint"]);
  const project = args.positionals[0] || ".";
  if (args.one("app-server-endpoint")) throw new CliError("--app-server-endpoint is not supported yet; omit it to use the managed stdio App Server", 2);
  const type = args.one("type");
  if (type && !["R", "F", "G"].includes(type)) throw new CliError("--type must be one of R, F, G", 2);
  const result = await runEval({
    project,
    selector: { case: args.many("case"), type, topic: args.many("topic") },
    label: args.one("label"),
    runSource: args.has("no-skill") ? "no_skill" : "working_payload",
    withJudges: args.has("with-judges"),
    noLint: args.has("no-lint"),
    appServerEndpoint: undefined
  });
  const report = await buildRunEvidenceReport(result.runRoot);
  console.log(renderEvidenceReportMarkdown(report));
  return result.ok ? 0 : 1;
}

async function commandJudge(argv: string[]): Promise<number> {
  const args = parse(argv, ["run", "judge", "case"], ["all-judges", "all-cases"]);
  const project = args.positionals[0] || ".";
  const runId = args.one("run");
  if (!runId) throw new CliError("judge requires --run <run-id>", 2);
  const result = await judgeRun({
    project,
    runId,
    judge: args.one("judge"),
    allJudges: args.has("all-judges"),
    case: args.one("case"),
    allCases: args.has("all-cases")
  });
  console.log(`judge observations: ${result.annotations}`);
  console.log(`next step: meta-skill report ${runId} --project ${shellPath(project)}`);
  return result.ok ? 0 : 1;
}

async function commandFeedback(argv: string[]): Promise<number> {
  const [subcommand, ...rest] = argv;
  if (subcommand !== "import") throw new CliError("feedback supports only: meta-skill feedback import <project> --run <run-id> <feedback.jsonl>", 2);
  const args = parse(rest, ["run"], []);
  const project = args.positionals[0] || ".";
  const feedback = args.positionals[1];
  const runId = args.one("run");
  if (!runId) throw new CliError("feedback import requires --run <run-id>", 2);
  if (!feedback) throw new CliError("feedback import requires <feedback.jsonl>", 2);
  const result = await importFeedback(project, runId, feedback);
  console.log(`imported feedback rows: ${result.rows}`);
  console.log(`next step: meta-skill report ${runId} --project ${shellPath(project)}`);
  return 0;
}

async function commandDecide(argv: string[]): Promise<number> {
  const args = parse(argv, ["run", "evidence", "commit"], ["accept", "reject"]);
  const project = args.positionals[0] || ".";
  const runId = args.one("run");
  if (!runId) throw new CliError("decide requires --run <run-id>", 2);
  if (args.has("accept") === args.has("reject")) throw new CliError("decide requires exactly one of --accept or --reject", 2);
  const decision = args.has("accept") ? "accept" : "reject";
  const result = await recordDecision({
    project,
    runId,
    decision,
    evidence: args.many("evidence").map(parseEvidenceRef),
    commit: args.one("commit")
  });
  console.log(`decision: ${decision}`);
  console.log(`run: ${runId}`);
  console.log(`path: ${result.runRoot}`);
  return 0;
}

async function commandPackage(argv: string[]): Promise<number> {
  const args = parse(argv, ["out", "out-dir"], []);
  const project = args.positionals[0] || ".";
  const result = await packageProject({ project, out: args.one("out"), outDir: args.one("out-dir") });
  console.log(`package: ${result.artifact}`);
  console.log(`metadata: ${result.metadata}`);
  console.log(`files: ${result.files.join(", ")}`);
  return 0;
}

class ParsedArgs {
  positionals: string[];
  private values: Map<string, string[]>;
  private booleans: Set<string>;

  constructor(positionals: string[], values: Map<string, string[]>, booleans: Set<string>) {
    this.positionals = positionals;
    this.values = values;
    this.booleans = booleans;
  }

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

function parseEvidenceRef(value: string) {
  const match = /^(.*):([1-9][0-9]*)$/.exec(value);
  if (!match) return { path: value };
  return { path: match[1], line: Number(match[2]) };
}
