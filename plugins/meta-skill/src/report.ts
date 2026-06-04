import { promises as fs } from "node:fs";
import path from "node:path";
import type { CheckRef, EvidenceReport, FactRow, MissingCheck, ReportCase, ReportError, ReportObservation, RunTokenUsageSummary, TokenUsage } from "./models.ts";
import { readFacts } from "./facts.ts";
import { exists, projectPaths, readText, requirePortableSkill } from "./project.ts";

type FactWithLine = FactRow & { line: number };

export async function buildRunEvidenceReport(runRoot: string, options: { caseId?: string } = {}): Promise<EvidenceReport> {
  const facts = await readFacts(runRoot);
  const runId = facts[0]?.run_id || path.basename(runRoot);
  const caseDefinitions = facts.filter((fact) => fact.type === "case_defined");
  const cases: ReportCase[] = [];
  const missing: MissingCheck[] = [];
  const errors: ReportError[] = [];
  const decisions: EvidenceReport["decisions"] = [];

  for (const fact of facts) {
    if (fact.type === "decision_recorded") {
      decisions.push({ decision: String(fact.payload.decision || "unknown"), evidence: ref(fact), payload: fact.payload });
    }
    if (fact.type === "case_trial_finished" && fact.payload.error) {
      errors.push({
        case_id: fact.case_id,
        message: String(fact.payload.error),
        classification: fact.payload.failure_classification ? String(fact.payload.failure_classification) : undefined,
        evidence: ref(fact)
      });
    }
    if (fact.type === "check_observed" && String(fact.payload.outcome || "") === "error") {
      errors.push({
        case_id: fact.case_id,
        message: String(fact.payload.message || "check error"),
        classification: fact.payload.classification ? String(fact.payload.classification) : undefined,
        evidence: ref(fact)
      });
    }
  }

  for (const definition of caseDefinitions) {
    const caseId = String(definition.case_id || definition.payload.id || "");
    if (options.caseId && options.caseId !== caseId && options.caseId !== String(definition.payload.folder || "")) continue;
    const checks = checksFromDefinition(definition);
    const observations = observationsFor(facts, caseId);
    const observed = new Set(observations.filter((row) => row.kind === "test" || row.kind === "judge").map((row) => `${row.kind}:${row.id}`));
    const missingChecks = checks.filter((check) => !observed.has(`${check.kind}:${check.id}`));
    if (missingChecks.length) missing.push({ case_id: caseId, checks: missingChecks });
    const trial = latestFact(facts.filter((fact) => fact.type === "case_trial_finished" && fact.case_id === caseId));
    cases.push({
      id: caseId,
      folder: String(definition.payload.folder || caseId),
      title: definition.payload.title ? String(definition.payload.title) : undefined,
      checks,
      observations,
      final: trial?.payload.final_path ? { path: String(trial.payload.final_path) } : undefined,
      rpc: trial?.payload.rpc_path ? { path: String(trial.payload.rpc_path) } : undefined,
      usage: normalizeTokenUsage(trial?.payload.usage)
    });
  }

  return {
    subject: { kind: options.caseId ? "case" : "run", id: options.caseId || runId },
    missing,
    errors,
    usage: summarizeUsage(cases),
    cases,
    decisions
  };
}

export async function buildProjectEvidenceReport(project: string): Promise<EvidenceReport> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  const runs: NonNullable<EvidenceReport["runs"]> = [];
  if (await exists(p.runs)) {
    for (const entry of (await fs.readdir(p.runs, { withFileTypes: true })).filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const runRoot = path.join(p.runs, entry.name);
      const facts = await readFacts(runRoot);
      const started = facts.find((fact) => fact.type === "run_started");
      const finished = latestFact(facts.filter((fact) => fact.type === "run_finished"));
      runs.push({
        id: entry.name,
        label: (started?.payload.label as string | null | undefined) || null,
        created_at: started?.created_at,
        finished_at: finished?.created_at,
        case_count: facts.filter((fact) => fact.type === "case_defined").length
      });
    }
  }
  return { subject: { kind: "project" }, runs, missing: [], errors: [], usage: emptyUsage(), cases: [], decisions: [] };
}

export async function latestRunId(project: string): Promise<string | undefined> {
  const root = await requirePortableSkill(project);
  const runs = projectPaths(root).runs;
  if (!(await exists(runs))) return undefined;
  return (await fs.readdir(runs, { withFileTypes: true })).filter((item) => item.isDirectory()).map((item) => item.name).sort((a, b) => a.localeCompare(b)).at(-1);
}

export function renderEvidenceReportMarkdown(report: EvidenceReport): string {
  if (report.subject.kind === "project") {
    const rows = (report.runs || []).map((run) => `| ${run.id} | ${run.created_at || ""} | ${run.finished_at || ""} | ${run.case_count} |`);
    return [`# Meta Skill Runs`, "", "| Run | Started | Finished | Cases |", "|---|---|---|---:|", rows.length ? rows.join("\n") : "| none |  |  | 0 |"].join("\n");
  }

  const title = report.subject.kind === "case" ? `# Case ${report.subject.id}` : `# Eval Run ${report.subject.id}`;
  const lines = [title, "", `Token cost: ${formatTokens(report.usage.total_tokens)} total tokens`, `Unavailable usage cases: ${report.usage.unavailable_case_count}`];
  if (report.errors.length) {
    lines.push("", "## Errors", "", ...report.errors.map((error) => `- ${error.case_id ? `${error.case_id}: ` : ""}${error.message} (${formatRef(error.evidence)})`));
  }
  if (report.missing.length) {
    lines.push("", "## Missing Checks", "", "| Case | Missing |", "|---|---|");
    for (const item of report.missing) lines.push(`| ${item.case_id} | ${item.checks.map((check) => `${check.kind}: ${check.id}`).join(", ")} |`);
  }
  lines.push("", "## Cases", "", "| Case | Checks | Observations | Final |", "|---|---|---|---|");
  for (const item of report.cases) {
    const checks = item.checks.map((check) => `${check.kind}: ${check.id}`).join(", ") || "none";
    const observations = item.observations.map((row) => `${row.kind}: ${row.id}${row.outcome ? ` (${row.outcome})` : ""}`).join(", ") || "none";
    lines.push(`| ${item.title || item.id} | ${checks} | ${observations} | ${item.final?.path || ""} |`);
  }
  if (report.decisions.length) {
    lines.push("", "## Decisions", "", ...report.decisions.map((item) => `- ${item.decision} (${formatRef(item.evidence)})`));
  }
  return lines.join("\n");
}

export function renderEvidenceReportJson(report: EvidenceReport): string {
  return `${JSON.stringify(stripMarkdownOnlyFields(report), null, 2)}\n`;
}

function checksFromDefinition(fact: FactWithLine): CheckRef[] {
  const tests = Array.isArray(fact.payload.tests) ? fact.payload.tests.map(String).map((id) => ({ kind: "test" as const, id })) : [];
  const judges = Array.isArray(fact.payload.judges) ? fact.payload.judges.map(String).map((id) => ({ kind: "judge" as const, id })) : [];
  return [...tests, ...judges].sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`));
}

function observationsFor(facts: FactWithLine[], caseId: string): ReportObservation[] {
  return facts
    .filter((fact) => (fact.type === "check_observed" || fact.type === "feedback_imported") && fact.case_id === caseId)
    .map((fact): ReportObservation => {
      const kind: ReportObservation["kind"] = fact.type === "feedback_imported" ? "feedback" : String(fact.payload.kind || "test") === "judge" ? "judge" : "test";
      return {
        kind,
        id: String(fact.payload.id || fact.payload.source || fact.source),
        outcome: fact.payload.outcome ? String(fact.payload.outcome) : fact.payload.label ? String(fact.payload.label) : undefined,
        evidence: ref(fact)
      };
    })
    .sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`));
}

function latestFact<T extends FactWithLine>(facts: T[]): T | undefined {
  return [...facts].sort((a, b) => a.line - b.line).at(-1);
}

function ref(fact: FactWithLine) {
  return { path: "facts.jsonl", line: fact.line };
}

function normalizeTokenUsage(value: unknown): TokenUsage | undefined {
  const object = objectValue(value);
  if (!Object.keys(object).length) return undefined;
  return {
    input_tokens: nullableNumber(object.input_tokens),
    output_tokens: nullableNumber(object.output_tokens),
    total_tokens: nullableNumber(object.total_tokens),
    cached_input_tokens: nullableNumber(object.cached_input_tokens),
    reasoning_tokens: nullableNumber(object.reasoning_tokens),
    model_context_window: nullableNumber(object.model_context_window),
    unavailable_reason: object.unavailable_reason === null || object.unavailable_reason === undefined ? null : String(object.unavailable_reason)
  };
}

function summarizeUsage(cases: ReportCase[]): RunTokenUsageSummary {
  const usages = cases.map((item) => item.usage).filter((item): item is TokenUsage => Boolean(item));
  const available = usages.filter((item) => item.total_tokens !== null && !item.unavailable_reason);
  return {
    input_tokens: sumNullable(available.map((item) => item.input_tokens)),
    output_tokens: sumNullable(available.map((item) => item.output_tokens)),
    total_tokens: sumNullable(available.map((item) => item.total_tokens)),
    case_count: cases.length,
    unavailable_case_count: cases.length - available.length
  };
}

function emptyUsage(): RunTokenUsageSummary {
  return { input_tokens: null, output_tokens: null, total_tokens: null, case_count: 0, unavailable_case_count: 0 };
}

function stripMarkdownOnlyFields(report: EvidenceReport): EvidenceReport {
  return {
    ...report,
    cases: report.cases.map(({ title: _title, ...item }) => item)
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sumNullable(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) : null;
}

function formatTokens(value: number | null): string {
  return value === null ? "unavailable" : String(value);
}

function formatRef(value: { path: string; line?: number }): string {
  return value.line ? `${value.path}:${value.line}` : value.path;
}
