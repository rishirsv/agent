import { promises as fs } from "node:fs";

export interface SkillFrontmatter {
  name?: string;
  description?: string;
}

export interface SkillFrontmatterFull {
  name?: string;
  description?: string;
  license?: string;
  compatibility?: string;
  allowedTools?: string;
  metadata?: Record<string, unknown>;
  keys: string[];
}

export interface AgentManifestMetadata {
  hasInterface: boolean;
  hasPolicy: boolean;
  hasDependencies: boolean;
}

interface YamlLine {
  indent: number;
  text: string;
}

export class MetadataError extends Error {
  exitCode = 1;
}

// Local YAML subset: nested maps, block lists, inline map list items,
// quoted/unquoted scalars, booleans, null, numbers, [] and {}.
export async function parseSkillFrontmatter(skillMd: string): Promise<SkillFrontmatter> {
  const parsed = parseOptionalFrontmatter(await fs.readFile(skillMd, "utf8"), skillMd);
  if (!parsed) return {};
  return decodeSkillFrontmatter(parsed.frontmatter, skillMd);
}

// Spec-complete view of the frontmatter for validation: every agentskills.io
// field plus the raw key set so the linter can flag unknown keys.
export async function parseSkillFrontmatterFull(skillMd: string): Promise<SkillFrontmatterFull> {
  const parsed = parseOptionalFrontmatter(await fs.readFile(skillMd, "utf8"), skillMd);
  if (!parsed) return { keys: [] };
  return decodeSkillFrontmatterFull(parsed.frontmatter, skillMd);
}

export async function parseAgentManifestMetadata(manifestPath: string): Promise<AgentManifestMetadata> {
  const text = await fs.readFile(manifestPath, "utf8");
  const frontmatter = parseYamlObject(text, manifestPath);
  return {
    hasInterface: Object.hasOwn(frontmatter, "interface"),
    hasPolicy: Object.hasOwn(frontmatter, "policy"),
    hasDependencies: Object.hasOwn(frontmatter, "dependencies")
  };
}

function decodeSkillFrontmatter(frontmatter: Record<string, unknown>, filePath: string): SkillFrontmatter {
  return {
    name: decodeString(frontmatter, "name", filePath, { optional: true }),
    description: decodeString(frontmatter, "description", filePath, { optional: true })
  };
}

function decodeSkillFrontmatterFull(frontmatter: Record<string, unknown>, filePath: string): SkillFrontmatterFull {
  return {
    name: decodeString(frontmatter, "name", filePath, { optional: true }),
    description: decodeString(frontmatter, "description", filePath, { optional: true }),
    license: decodeString(frontmatter, "license", filePath, { optional: true }),
    compatibility: decodeString(frontmatter, "compatibility", filePath, { optional: true }),
    allowedTools: decodeString(frontmatter, "allowed-tools", filePath, { optional: true }),
    metadata: decodeOptionalObject(frontmatter, "metadata", filePath),
    keys: Object.keys(frontmatter)
  };
}

function parseOptionalFrontmatter(text: string, filePath: string): { frontmatter: Record<string, unknown>; body: string } | null {
  if (!text.startsWith("---\n")) return null;
  return parseFrontmatter(text, filePath);
}

function parseFrontmatter(text: string, filePath: string): { frontmatter: Record<string, unknown>; body: string } {
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) throw new MetadataError(`${filePath}: frontmatter is not closed`);
  return {
    frontmatter: parseYamlObject(text.slice(4, end), filePath),
    body: text.slice(end + 5)
  };
}

function parseYamlObject(source: string, filePath: string): Record<string, unknown> {
  const lines = source
    .split(/\r?\n/)
    .map((raw) => ({ indent: raw.match(/^ */)?.[0].length || 0, text: raw.trim() }))
    .filter((line) => line.text && !line.text.startsWith("#"));
  const [value] = parseYamlNode(lines, 0, 0, filePath);
  return asObject(value, filePath, "frontmatter");
}

function parseYamlNode(lines: YamlLine[], index: number, indent: number, filePath: string): [unknown, number] {
  if (index >= lines.length || lines[index].indent < indent) return [{}, index];
  if (lines[index].indent === indent && lines[index].text.startsWith("- ")) return parseYamlArray(lines, index, indent, filePath);
  return parseYamlMap(lines, index, indent, filePath);
}

function parseYamlMap(lines: YamlLine[], index: number, indent: number, filePath: string): [Record<string, unknown>, number] {
  const out: Record<string, unknown> = {};
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent || line.text.startsWith("- ")) break;
    if (line.indent > indent) throw new MetadataError(`${filePath}: invalid frontmatter indentation near ${line.text}`);
    const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line.text);
    if (!match) throw new MetadataError(`${filePath}: invalid frontmatter line: ${line.text}`);
    const key = match[1];
    const rest = match[2] || "";
    if (rest) {
      out[key] = parseYamlScalar(rest);
      index += 1;
    } else {
      const nextIndent = lines[index + 1]?.indent;
      if (nextIndent === undefined || nextIndent <= indent) {
        out[key] = null;
        index += 1;
      } else {
        const parsed = parseYamlNode(lines, index + 1, nextIndent, filePath);
        out[key] = parsed[0];
        index = parsed[1];
      }
    }
  }
  return [out, index];
}

function parseYamlArray(lines: YamlLine[], index: number, indent: number, filePath: string): [unknown[], number] {
  const out: unknown[] = [];
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent || !line.text.startsWith("- ")) break;
    if (line.indent > indent) throw new MetadataError(`${filePath}: invalid list indentation near ${line.text}`);
    const rest = line.text.slice(2).trim();
    if (!rest) {
      const parsed = parseYamlNode(lines, index + 1, lines[index + 1]?.indent ?? indent + 2, filePath);
      out.push(parsed[0]);
      index = parsed[1];
      continue;
    }
    const inlineMap = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(rest);
    if (inlineMap) {
      const item: Record<string, unknown> = { [inlineMap[1]]: inlineMap[2] ? parseYamlScalar(inlineMap[2]) : null };
      index += 1;
      while (index < lines.length && lines[index].indent > indent) {
        const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(lines[index].text);
        if (!match) throw new MetadataError(`${filePath}: invalid frontmatter line: ${lines[index].text}`);
        if (match[2]) {
          item[match[1]] = parseYamlScalar(match[2]);
          index += 1;
        } else {
          const parsed = parseYamlNode(lines, index + 1, lines[index + 1]?.indent ?? lines[index].indent + 2, filePath);
          item[match[1]] = parsed[0];
          index = parsed[1];
        }
      }
      out.push(item);
    } else {
      out.push(parseYamlScalar(rest));
      index += 1;
    }
  }
  return [out, index];
}

function parseYamlScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "[]") return [];
  if (trimmed === "{}") return {};
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function decodeString(
  source: Record<string, unknown>,
  key: string,
  filePath: string,
  options: { optional?: true; defaultValue?: string } = {}
): string | undefined {
  const value = source[key];
  if (value === undefined) return options.optional ? undefined : options.defaultValue;
  if (typeof value !== "string") throw new MetadataError(`${filePath}: frontmatter field '${key}' must be a string`);
  return value;
}

function decodeOptionalObject(source: Record<string, unknown>, key: string, filePath: string): Record<string, unknown> | undefined {
  const value = source[key];
  if (value === undefined || value === null) return undefined;
  return asObject(value, filePath, `frontmatter field '${key}'`);
}

function asObject(value: unknown, filePath: string, label: string): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  throw new MetadataError(`${filePath}: ${label} must be an object`);
}
