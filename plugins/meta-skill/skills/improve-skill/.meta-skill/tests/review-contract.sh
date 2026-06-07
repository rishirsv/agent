#!/usr/bin/env bash
set -euo pipefail

root="${META_SKILL_PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"

skill="$root/SKILL.md"
criteria="$root/references/review-criteria.md"
doctor="$root/references/prompt-doctor.md"

grep -q "mirror those Quality, Implementation, and Validation dimensions" "$skill"
grep -q "Never fabricate validation rows, deterministic test status, scores, run IDs, or evidence files" "$skill"
grep -q "Eval Dimension Alignment" "$criteria"
grep -q "Do not fabricate validation tables, deterministic test status, run IDs, or evidence paths" "$criteria"
grep -q "Validation is deterministic. Do not rescore it by feel." "$criteria"
grep -q "completed \`.meta-skill/review.md\` with a concrete finding heading" "$doctor"
grep -q "Generated review worksheets that still contain \`Agent review required\` placeholders are not edit evidence" "$doctor"

if grep -q "../../references/cli-conventions.md" "$skill"; then
  echo "improve-skill should not link outside its packaged payload" >&2
  exit 1
fi

if grep -q "sibling .*create-skill" "$skill"; then
  echo "improve-skill should not depend on sibling skill references" >&2
  exit 1
fi

echo "review-contract ok"
