import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

describe("runtime package layout", () => {
  it("runs TypeScript source directly without a committed app build", async () => {
    const root = process.cwd();
    const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")) as {
      bin: Record<string, string>;
      engines: Record<string, string>;
      scripts: Record<string, string>;
      type: string;
    };
    const tsconfig = JSON.parse(await fs.readFile(path.join(root, "tsconfig.json"), "utf8")) as { compilerOptions: Record<string, unknown>; exclude?: string[] };
    const launcher = await fs.readFile(path.join(root, "scripts", "meta-skill.js"), "utf8");

    assert.equal(packageJson.bin["meta-skill"], "./scripts/meta-skill.js");
    assert.equal(packageJson.type, "module");
    assert.equal(packageJson.engines.node, ">=22.18");
    assert.equal(packageJson.scripts.test, 'node --test "src/**/*.test.ts"');
    assert.equal(packageJson.scripts.typecheck, "tsc -p tsconfig.json --noEmit");
    assert.equal(packageJson.scripts.build, undefined);
    assert.equal(packageJson.scripts["build:test"], undefined);
    assert.equal(packageJson.scripts["check:app"], undefined);
    assert.equal(tsconfig.compilerOptions.module, "NodeNext");
    assert.equal(tsconfig.compilerOptions.moduleResolution, "NodeNext");
    assert.equal(tsconfig.compilerOptions.allowImportingTsExtensions, true);
    assert.equal(tsconfig.compilerOptions.erasableSyntaxOnly, true);
    assert.equal(tsconfig.compilerOptions.noEmit, true);
    assert.equal(tsconfig.compilerOptions.outDir, undefined);
    assert.equal(tsconfig.exclude, undefined);
    assert.match(launcher, /src", "main\.ts/);
  });
});
