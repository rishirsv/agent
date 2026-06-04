import path from "node:path";
import type { EvalRunSource } from "../models.ts";
import { exists } from "../project.ts";

export async function attemptsInRun(runRoot: string, caseFolder: string): Promise<Array<{ runSource: EvalRunSource; evidencePath: string }>> {
  const caseRoot = path.join(runRoot, "cases", caseFolder);
  if (await exists(path.join(caseRoot, "final.md"))) {
    return [{ runSource: { kind: "working_payload", label: "Working payload", skill_root: "payload", skill_activation: "forced" }, evidencePath: path.join("cases", caseFolder) }];
  }
  return [];
}
