import path from "node:path";
import { AppServerJsonClient, AppServerUnavailableError, appServerConfig } from "../app-server/client";
import { CliError, appendJsonl, eventEnvelope, exists, projectPaths, readText, relativePath, requirePortableSkill } from "../project";
import { writeEvalReport } from "../report";
import { loadRunScenarioSnapshots } from "./scenarios";
import { attemptsInRun } from "./results";
import type { JudgeExecutionInput, JudgeOptions, JudgeRunResult, RunFailureClassification } from "./types";

export async function judgeRun(options: JudgeOptions): Promise<JudgeRunResult> {
  const root = await requirePortableSkill(options.project);
  const p = projectPaths(root);
  const runRoot = path.join(p.runs, options.runId);
  if (!(await exists(runRoot))) throw new CliError(`run does not exist: ${options.runId}`);
  if (!options.judge && !options.allJudges) throw new CliError("eval judge requires --judge <id> or --all-judges", 2);
  if (!options.scenario && !options.allScenarios) throw new CliError("eval judge requires --scenario <id> or --all-scenarios", 2);

  const scenarios = await loadRunScenarioSnapshots(root, runRoot, options.allScenarios ? {} : { scenario: [options.scenario as string] });
  let annotations = 0;
  let ok = true;
  const failureClassifications = new Set<RunFailureClassification>();
  let judgeClient: AppServerJsonClient | undefined;
  let judgeExecutor = options.judgeExecutor;
  try {
    if (!judgeExecutor) {
      const appServer = await appServerConfig();
      judgeClient = new AppServerJsonClient(async (line) => {
        await appendJsonl(path.join(runRoot, "grades.rpc.jsonl"), {
          schema_version: 1,
          direction: line.direction,
          message: line.message
        });
      });
      await judgeClient.connect(appServer);
      judgeExecutor = (input) => runJudge(judgeClient as AppServerJsonClient, input);
    }
    for (const scenario of scenarios) {
      const judgeIds = options.allJudges ? (scenario.criteria.judges || []).map((judge) => judge.id) : [options.judge as string];
      for (const judgeId of judgeIds) {
        const judgePath = path.join(p.judges, `${judgeId}.md`);
        if (!(await exists(judgePath))) throw new CliError(`judge does not exist: ${judgeId}`);
        const judgePrompt = await readText(judgePath);
        const threshold = (scenario.criteria.judges || []).find((judge) => judge.id === judgeId)?.threshold;
        for (const attempt of await attemptsInRun(runRoot, scenario.folder)) {
          const finalPath = path.join(runRoot, attempt.evidencePath, "final.md");
          if (!(await exists(finalPath))) {
            ok = false;
            failureClassifications.add("harness_unavailable");
            await appendJsonl(
              path.join(runRoot, "grades.jsonl"),
              eventEnvelope({
                type: "judge_result",
                run_id: options.runId,
                scenario_id: scenario.id,
                ...(attempt.legacySide ? { side: attempt.legacySide } : {}),
                source: judgeId,
                payload: {
                  judge_id: judgeId,
                  run_source: attempt.runSource,
                  status: "unavailable",
                  failure_classification: "harness_unavailable",
                  reason: `missing scenario final evidence: ${relativePath(runRoot, finalPath)}`
                }
              })
            );
            annotations += 1;
            continue;
          }
          const final = await readText(finalPath);
          const result = await judgeExecutor({ projectRoot: root, judgeId, judgePrompt, scenario, runSourceLabel: attempt.runSource.label, final });
          const passed = judgePassed(result, threshold);
          ok = ok && passed;
          if (!passed) failureClassifications.add("judge_failure");
          await appendJsonl(
            path.join(runRoot, "grades.jsonl"),
            eventEnvelope({
              type: "judge_result",
              run_id: options.runId,
              scenario_id: scenario.id,
              ...(attempt.legacySide ? { side: attempt.legacySide } : {}),
              source: judgeId,
              payload: {
                judge_id: judgeId,
                run_source: attempt.runSource,
                status: passed ? "passed" : "failed",
                failure_classification: passed ? null : "judge_failure",
                threshold: threshold || null,
                evidence_basis: scenario.evidence_basis || "run_snapshot",
                result
              }
            })
          );
          annotations += 1;
        }
      }
    }
  } catch (error) {
    ok = false;
    const message = error instanceof Error ? error.message : String(error);
    const classification: RunFailureClassification = error instanceof AppServerUnavailableError ? "app_server_unavailable" : "judge_failure";
    failureClassifications.add(classification);
    for (const scenario of scenarios) {
      const judgeIds = options.allJudges ? (scenario.criteria.judges || []).map((judge) => judge.id) : [options.judge as string];
      for (const judgeId of judgeIds) {
        for (const attempt of await attemptsInRun(runRoot, scenario.folder)) {
          await appendJsonl(
            path.join(runRoot, "grades.jsonl"),
            eventEnvelope({
              type: "judge_result",
              run_id: options.runId,
              scenario_id: scenario.id,
              ...(attempt.legacySide ? { side: attempt.legacySide } : {}),
              source: judgeId,
              payload: {
                judge_id: judgeId,
                run_source: attempt.runSource,
                status: "unavailable",
                failure_classification: classification,
                reason: message
              }
            })
          );
          annotations += 1;
        }
      }
    }
  } finally {
    await judgeClient?.flush();
    judgeClient?.close();
  }
  await writeEvalReport(runRoot);
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
    developerInstructions: "Evaluate the saved scenario evidence against the judge prompt. Do not use tools."
  });
  const threadId = (start.thread as { id?: string } | undefined)?.id;
  if (!threadId) throw new Error("judge thread/start response did not include thread.id");
  const mark = client.eventCount();
  const prompt = [
    "# Judge Prompt",
    input.judgePrompt,
    "# Scenario",
    JSON.stringify({ id: input.scenario.id, folder: input.scenario.folder, run_source: input.runSourceLabel, evidence_basis: input.scenario.evidence_basis || "run_snapshot", metadata: input.scenario.metadata, criteria: input.scenario.criteria }, null, 2),
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
  await client.waitFor(
    (message) => message.method === "turn/completed" && (message.params as { threadId?: string; turn?: { id?: string } } | undefined)?.threadId === threadId && (message.params as { turn?: { id?: string } } | undefined)?.turn?.id === turnId,
    120000
  );
  const text = client
    .eventsSince(mark)
    .filter((message) => message.method === "item/agentMessage/delta" && (message.params as { turnId?: string } | undefined)?.turnId === turnId)
    .map((message) => String((message.params as { delta?: string }).delta || ""))
    .join("")
    .trim();
  return parseJudgeJson(text);
}

function parseJudgeJson(text: string): Record<string, unknown> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const raw = fenced ? fenced[1] : text;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { overall: 0, pass: false, rationale: text || "Judge returned no parseable JSON.", dimensions: {} };
  }
}

export function judgePassed(result: Record<string, unknown>, threshold?: { overall_min?: number; dimensions?: Record<string, number> }): boolean {
  const overall = typeof result.overall === "number" ? result.overall : 0;
  if (threshold?.overall_min !== undefined && overall < threshold.overall_min) return false;
  for (const [name, min] of Object.entries(threshold?.dimensions || {})) {
    const dimensions = result.dimensions && typeof result.dimensions === "object" ? (result.dimensions as Record<string, unknown>) : {};
    const value = Number(dimensions[name] ?? 0);
    if (value < min) return false;
  }
  if (typeof result.pass === "boolean") return result.pass;
  return overall >= 3;
}
