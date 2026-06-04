import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { packageProject } from "./package.ts";
import { createSkill } from "./skills.ts";
import { exists, readJson } from "./project.ts";

describe("project packaging", () => {
  it("packages only the current portable payload", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-package-"));
    const target = path.join(root, "pkg-check");
    await createSkill({
      target,
      project: true,
      slug: "pkg-check",
      title: "Package Check",
      description: "Use when checking package behavior; not for unrelated tasks.",
      job: "Package."
    });
    await fs.mkdir(path.join(target, ".meta-skill", "private"), { recursive: true });
    await fs.writeFile(path.join(target, ".meta-skill", "private", "secret.txt"), "secret\n");

    const outDir = path.join(root, "artifact");
    const result = await packageProject({ project: target, outDir });

    assert.equal(await exists(path.join(result.artifact, "SKILL.md")), true);
    assert.equal(await exists(path.join(result.artifact, ".meta-skill")), false);
    const metadata = await readJson<{ source: string }>(result.metadata);
    assert.equal(metadata.source, "current");
  });
});
