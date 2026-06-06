import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { parseAgentManifestMetadata, parseSkillFrontmatter } from "./metadata.ts";

describe("metadata parsing", () => {
  it("decodes skill frontmatter with the shared YAML subset", async () => {
    const skillMd = await tempFile(
      "SKILL.md",
      `---
name: "demo-skill"
description: 'Use when testing shared metadata; not for production.'
---

# Demo
`
    );

    assert.deepEqual(await parseSkillFrontmatter(skillMd), {
      name: "demo-skill",
      description: "Use when testing shared metadata; not for production."
    });
  });

  it("detects documented sections and ignores top-level name/description", async () => {
    const manifest = await tempFile(
      "openai.yaml",
      `name: demo-skill
description: Top-level name/description are not a documented openai.yaml shape.
policy:
  allow_implicit_invocation: false
dependencies:
  tools: []
`
    );

    assert.deepEqual(await parseAgentManifestMetadata(manifest), {
      hasInterface: false,
      hasPolicy: true,
      hasDependencies: true
    });
  });

  it("keeps documented interface manifests detectable", async () => {
    const manifest = await tempFile(
      "openai.yaml",
      `interface:
  default_prompt: Use $demo-skill.
`
    );

    assert.deepEqual(await parseAgentManifestMetadata(manifest), {
      hasInterface: true,
      hasPolicy: false,
      hasDependencies: false
    });
  });
});

async function tempFile(name: string, text: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-metadata-"));
  const target = path.join(root, name);
  await fs.writeFile(target, text, "utf8");
  return target;
}
