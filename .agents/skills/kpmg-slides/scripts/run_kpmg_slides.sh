#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run_kpmg_slides.sh --in <deckspec.json> [--out-dir <dir>]

Defaults:
  --out-dir outputs/skill-run

This runner always enables visual postprocess:
  --with-preview --with-montage --with-visual-overflow
EOF
}

IN_PATH=""
OUT_DIR="outputs/skill-run"
CALLER_ROOT="$(pwd -P)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
BUNDLE_ROOT="$SKILL_ROOT/assets/slidegen"
GENERATOR_ENTRY="$BUNDLE_ROOT/generator/index.js"

abspath() {
  local p="$1"
  if [[ "$p" = /* ]]; then
    echo "$p"
  else
    echo "$CALLER_ROOT/$p"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --in)
      IN_PATH="${2:-}"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$IN_PATH" ]]; then
  echo "Missing required --in <deckspec.json>" >&2
  usage
  exit 1
fi

IN_PATH="$(abspath "$IN_PATH")"
OUT_DIR="$(abspath "$OUT_DIR")"

if [[ ! -f "$IN_PATH" ]]; then
  echo "Input deckSpec not found: $IN_PATH" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but not found on PATH" >&2
  exit 1
fi

if [[ ! -f "$GENERATOR_ENTRY" ]]; then
  echo "Bundled generator not found: $GENERATOR_ENTRY" >&2
  echo "Run: npm run skill:sync" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
DECK_OUT="$OUT_DIR/deck.pptx"
QA_OUT="$OUT_DIR/qa.json"
PREVIEW_DIR="$OUT_DIR/preview"
MONTAGE_OUT="$OUT_DIR/montage.png"

node "$GENERATOR_ENTRY" \
  --in "$IN_PATH" \
  --out "$DECK_OUT" \
  --qa-out "$QA_OUT" \
  --with-preview \
  --with-montage \
  --with-visual-overflow \
  --preview-dir "$PREVIEW_DIR" \
  --montage-out "$MONTAGE_OUT"

missing=0
for path in "$DECK_OUT" "$QA_OUT"; do
  if [[ ! -f "$path" ]]; then
    echo "Missing required artifact: $path" >&2
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

POSTPROCESS_SUMMARY=$(node -e "const fs=require('fs');const q=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const pp=q.postprocess||{};const s=(k)=>pp?.[k]?.status||'not-run';console.log('preview='+s('preview')+' montage='+s('montage')+' overflowVisual='+s('overflowVisual'));" "$QA_OUT")

echo "DeckSpec: $IN_PATH"
echo "PPTX: $DECK_OUT"
echo "QA: $QA_OUT"
echo "Preview dir (if available): $PREVIEW_DIR"
echo "Montage (if available): $MONTAGE_OUT"
echo "Postprocess status: $POSTPROCESS_SUMMARY"
