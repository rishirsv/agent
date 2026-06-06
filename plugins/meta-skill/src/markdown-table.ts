export function splitMarkdownTableRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

export function normalizeMarkdownTableHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ");
}

export function markdownTableHeadersMatch(actual: string[], expected: string[]): boolean {
  return expected.every((column, index) => actual[index] === column);
}
