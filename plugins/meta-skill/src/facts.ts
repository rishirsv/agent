import { promises as fs } from "node:fs";
import path from "node:path";
import type { FactKind, FactRow } from "./models.ts";
import { appendJsonl, exists, utcNow } from "./project.ts";

export function factsPath(runRoot: string): string {
  return path.join(runRoot, "facts.jsonl");
}

export async function appendFact(
  runRoot: string,
  input: {
    type: FactKind;
    run_id: string;
    case_id?: string;
    source: string;
    payload: Record<string, unknown>;
  }
): Promise<void> {
  await appendJsonl(factsPath(runRoot), {
    type: input.type,
    run_id: input.run_id,
    ...(input.case_id ? { case_id: input.case_id } : {}),
    created_at: utcNow(),
    source: input.source,
    payload: input.payload
  });
}

export async function readFacts(runRoot: string): Promise<Array<FactRow & { line: number }>> {
  const target = factsPath(runRoot);
  if (!(await exists(target))) return [];
  return (await fs.readFile(target, "utf8"))
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim())
    .map(({ line, index }) => ({ ...(JSON.parse(line) as FactRow), line: index + 1 }));
}
