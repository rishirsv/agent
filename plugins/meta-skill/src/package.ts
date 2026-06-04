import { promises as fs } from "node:fs";
import path from "node:path";
import { lintProject } from "./lint.ts";
import { CliError, copyPortablePayload, ensureDir, exists, listPortablePayloadFiles, projectPaths, requirePortableSkill, sha256File, utcNow, writeJson } from "./project.ts";

export interface PackageOptions {
  project: string;
  out?: string;
  outDir?: string;
}

export async function packageProject(options: PackageOptions): Promise<{ artifact: string; metadata: string; files: string[] }> {
  const root = await requirePortableSkill(options.project);
  const sourceRoot = root;
  const source = "current";
  const lint = await lintProject(root);
  if (!lint.ok) throw new CliError(`package validation failed:\n${lint.failures.map((failure) => `- ${failure.message}`).join("\n")}`);

  const files = await listPortablePayloadFiles(sourceRoot);
  if (options.outDir) {
    const outDir = path.resolve(options.outDir);
    await copyPortablePayload(sourceRoot, outDir);
    const metadata = path.join(outDir, "..", `${path.basename(outDir)}.meta-skill-package.json`);
    await writePackageMetadata(metadata, { source, sourceRoot, artifact: outDir, files });
    return { artifact: outDir, metadata, files };
  }

  const artifact = path.resolve(options.out || path.join(root, `${path.basename(root)}.zip`));
  await writeZip(sourceRoot, artifact, files);
  const metadata = `${artifact}.metadata.json`;
  await writePackageMetadata(metadata, { source, sourceRoot, artifact, files });
  return { artifact, metadata, files };
}

async function writePackageMetadata(target: string, data: { source: string; sourceRoot: string; artifact: string; files: string[] }): Promise<void> {
  await writeJson(target, {
    schema_version: 1,
    created_at: utcNow(),
    source: data.source,
    source_path: data.sourceRoot,
    artifact: data.artifact,
    files: data.files
  });
}

async function writeZip(sourceRoot: string, target: string, files: string[]): Promise<void> {
  await ensureDir(path.dirname(target));
  const records: Array<{ name: string; crc: number; size: number; offset: number }> = [];
  const chunks: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = file.split(path.sep).join("/");
    const data = await fs.readFile(path.join(sourceRoot, file));
    const nameBytes = Buffer.from(name);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBytes, data);
    records.push({ name, crc, size: data.length, offset });
    offset += local.length + nameBytes.length + data.length;
  }

  const centralStart = offset;
  for (const record of records) {
    const nameBytes = Buffer.from(record.name);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(record.crc, 16);
    central.writeUInt32LE(record.size, 20);
    central.writeUInt32LE(record.size, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(record.offset, 42);
    chunks.push(central, nameBytes);
    offset += central.length + nameBytes.length;
  }
  const centralSize = offset - centralStart;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(records.length, 8);
  end.writeUInt16LE(records.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);
  chunks.push(end);
  await fs.writeFile(target, Buffer.concat(chunks));
  await sha256File(target);
}

let crcTable: number[] | undefined;

function crc32(buffer: Buffer): number {
  const table = crcTable || (crcTable = makeCrcTable());
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}
