import path from "node:path";
import { AppServerJsonClient, AppServerUnavailableError, appServerConfig } from "../app-server/client.ts";
import { appendFact } from "../facts.ts";
import { CliError, appendJsonl, exists, projectPaths, readText, relativePath, requirePortableSkill } from "../project.ts";
import { buildRunEvidenceReport } from "../report.ts";
import { loadRunCaseSnapshots } from "./cases.ts";
import { attemptsInRun } from "./results.ts";
import type { JudgeExecutionInput, JudgeOptions, JudgeRunResult, RunFailureClassification } from "./types.ts";

export async function judgeRun(options: JudgeOptions): Promise<JudgeRunResult> {
  const root = await requirePortableSkill(options.project);
  const p = projectPaths(root);
  const runRoot = path.join(p.runs, options.runId);
  if (!(await exists(runRoot))) throw new CliError(`run does not exist: ${options.runId}`);
  if (!options.judge && !options.allJudges) throw new CliError("judge requires --judge <id> or --all-judges", 2);
  if (!options.case && !options.allCases) throw new CliError("judge requires --case <id> or --all-cases", 2);

  const cases = await loadRunCaseSnapshots(root, runRoot, options.allCases ? {} : { case: [options.case as string] });
  let annotations = 0;
  let ok = true;
  const failureClassifications = new Set<RunFailureClassification>();
  let judgeClient: AppServerJsonClient | undefined;
  let judgeExecutor = options.judgeExecutor;
  let rpcPath = path.join(runRoot, "rpc.jsonl");
  try {
    if (!judgeExecutor) {
      const appServer = await appServerConfig();
      judgeClient = new AppServerJsonClient(async (line) => {
        await appendJsonl(rpcPath, {
          schema_version: 1,
          direction: line.direction,
          message: line.message
        });
      });
      await judgeClient.connect(appServer);
      judgeExecutor = (input) => runJudge(judgeClient as AppServerJsonClient, input);
    }
    for (const item of cases) {
      const judgeIds = options.allJudges ? (item.criteria.judges || []).map((judge) => judge.id) : [options.judge as string];
      for (const judgeId of judgeIds) {
        const judgePath = path.join(p.judges, `${judgeId}.md`);
        if (!(await exists(judgePath))) throw new CliError(`judge does not exist: ${judgeId}`);
        const judgePrompt = await readText(judgePath);
        const threshold = (item.criteria.judges || []).find((judge) => judge.id === judgeId)?.threshold;
        for (const attempt of await attemptsInRun(runRoot, item.folder)) {
          const finalPath = path.join(runRoot, attempt.evidencePath, "final.md");
          if (!(await exists(finalPath))) {
            ok = false;
            failureClassifications.add("runner_unavailable");
            await appendFact(runRoot, {
              type: "check_observed",
              run_id: options.runId,
              case_id: item.id,
              source: judgeId,
              payload: { kind: "judge", id: judgeId, outcome: "error", classification: "runner_unavailable", message: `missing case final evidence: ${relativePath(runRoot, finalPath)}` }
            });
            annotations += 1;
            continue;
          }
          const final = await readText(finalPath);
          rpcPath = path.join(runRoot, attempt.evidencePath, "rpc.jsonl");
          const result = await judgeExecutor({ projectRoot: root, judgeId, judgePrompt, case: item, runSourceLabel: attempt.runSource.label, final });
          await appendFact(runRoot, {
            type: "check_observed",
            run_id: options.runId,
            case_id: item.id,
            source: judgeId,
            payload: { kind: "judge", id: judgeId, threshold: threshold || null, result }
          });
          annotations += 1;
        }
      }
    }
  } catch (error) {
    ok = false;
    const message = error instanceof Error ? error.message : String(error);
    const classification: RunFailureClassification = error instanceof AppServerUnavailableError ? "app_server_unavailable" : "judge_failure";
    failureClassifications.add(classification);
    for (const item of cases) {
      const judgeIds = options.allJudges ? (item.criteria.judges || []).map((judge) => judge.id) : [options.judge as string];
      for (const judgeId of judgeIds) {
        await appendFact(runRoot, {
          type: "check_observed",
          run_id: options.runId,
          case_id: item.id,
          source: judgeId,
          payload: { kind: "judge", id: judgeId, outcome: "error", classification, message }
        });
        annotations += 1;
      }
    }
  } finally {
    await judgeClient?.flush();
    judgeClient?.close();
  }
  await buildRunEvidenceReport(runRoot);
  return { annotations, ok, failureClassifications: [...failureClassifications].sort() };
}

async function runJudge(
  client: AppServerJsonClient,
  input: JudgeExecutionInput
): Promise<Record<string, unknown>> {
  const start = await client.request("thread/start", {
    cwd: input.projectRoot,
    runtimeWorkspaceRoots: [input.projectRoot],
    approvalPolicy: "never",
    sandbox: "read-only",
    experimentalRawEvents: false,
    persistExtendedHistory: false,
    ephemeral: true,
    baseInstructions: "You are a strict Meta Skill eval judge. Return only JSON.",
    developerInstructions: "Evaluate the saved case evidence against the judge prompt. Do not use tools."
  });
  const threadId = (start.thread as { id?: string } | undefined)?.id;
  if (!threadId) throw new Error("judge thread/start response did not include thread.id");
  const mark = client.eventCount();
  const prompt = [
    "# Judge Prompt",
    input.judgePrompt,
    "# Case",
    JSON.stringify({ id: input.case.id, folder: input.case.folder, run_source: input.runSourceLabel, metadata: input.case.metadata, criteria: input.case.criteria }, null, 2),
    "# Final Output",
    input.final,
    "# Required Output",
    'Return compact JSON with: {"overall": number from 1 to 5, "pass": boolean, "rationale": string, "dimensions": object}.'
  ].join("\n\n");
  const turn = await client.request("turn/start", {
    threadId,
    input: [{ type: "text", text: prompt, text_elements: [] }],
    cwd: input.projectRoot,
    runtimeWorkspaceRoots: [input.projectRoot],
    approvalPolicy: "never",
    sandboxPolicy: { type: "readOnly", networkAccess: false }
  });
  const turnId = (turn.turn as { id?: string } | undefined)?.id;
  if (!turnId) throw new Error("judge turn/start response did not include turn.id");
  const completed = await client.waitFor((message) => {
    const msg = message.msg as { type?: string } | undefined;
    return msg?.type === "thread/turn/completed" || msg?.type === "turn/completed";
  }, 120000);
  const final = extractFinalJson(client.eventsSince(mark), completed);
  if (!final) throw new Error("judge did not return JSON");
  return final;
}

function extractFinalJson(events: Record<string, unknown>[], completed: Record<string, unknown>): Record<string, unknown> | undefined {
  const candidates = [...events, completed].flatMap((event) => stringsFrom(event)).reverse();
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate.trim()) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      // Keep scanning for the final JSON candidate.
    }
  }
  return undefined;
}

function stringsFrom(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(stringsFrom);
  return Object.values(value as Record<string, unknown>).flatMap(stringsFrom);
}
