#!/bin/bash
# Autoresearch optimization loop
#
# Usage:
#   ./run.sh                    # Run until stall limit
#   ./run.sh 10                 # Max 10 experiments
#   ./run.sh --baseline         # Score current target only
#   ./run.sh --preview          # Show current state
#   ./run.sh --review           # Show diff of original vs best
#   ./run.sh --no-dashboard     # Run without dashboard server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load agent functions
source "$SCRIPT_DIR/agents.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Paths
TARGET="$SCRIPT_DIR/target.md"
TARGET_ORIGINAL="$SCRIPT_DIR/target.md.original"
TARGET_BEST="$SCRIPT_DIR/target.md.best"
STATE="$SCRIPT_DIR/state.json"
PROGRESS="$SCRIPT_DIR/progress.md"
GUARDRAILS="$SCRIPT_DIR/guardrails.md"
ERRORS_LOG="$SCRIPT_DIR/errors.log"
CONFIG="$SCRIPT_DIR/config.toml"
PROMPT_TEMPLATE="$SCRIPT_DIR/PROMPT_optimize.md"
HYPOTHESIS_FILE="$SCRIPT_DIR/.hypothesis.tmp"

# Defaults
MAX_EXPERIMENTS=30
STALL_LIMIT=5
AGENT_BACKEND="claude"
DASHBOARD_PORT=8384
DASHBOARD_AUTO_OPEN=true
NO_DASHBOARD=false
DASHBOARD_PID=""
MODE="run"

# ---------------------------------------------------------------------------
# Config parsing (read key values from TOML)
# ---------------------------------------------------------------------------

toml_get() {
  local file="$1" section="$2" key="$3"
  python3 -c "
import sys
section = sys.argv[1]
key = sys.argv[2]
current_section = ''
with open(sys.argv[3]) as f:
    for line in f:
        line = line.strip()
        if line.startswith('[') and not line.startswith('[['):
            current_section = line[1:-1].strip()
        elif '=' in line and current_section == section:
            k, v = line.split('=', 1)
            if k.strip() == key:
                v = v.strip().strip('\"')
                if v == 'true': v = 'true'
                elif v == 'false': v = 'false'
                print(v)
                sys.exit(0)
print('')
" "$section" "$key" "$file" 2>/dev/null
}

load_config() {
  local val
  val=$(toml_get "$CONFIG" "loop" "max_experiments")
  [ -n "$val" ] && MAX_EXPERIMENTS="$val"
  val=$(toml_get "$CONFIG" "loop" "stall_limit")
  [ -n "$val" ] && STALL_LIMIT="$val"
  val=$(toml_get "$CONFIG" "agent" "backend")
  [ -n "$val" ] && AGENT_BACKEND="$val"
  val=$(toml_get "$CONFIG" "dashboard" "port")
  [ -n "$val" ] && DASHBOARD_PORT="$val"
  val=$(toml_get "$CONFIG" "dashboard" "auto_open")
  [ "$val" = "false" ] && DASHBOARD_AUTO_OPEN=false
}

# ---------------------------------------------------------------------------
# State helpers (read/write state.json via python)
# ---------------------------------------------------------------------------

state_get() {
  local key="$1"
  python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
val = data.get(sys.argv[2], '')
if isinstance(val, bool):
    print('true' if val else 'false')
else:
    print(val)
" "$STATE" "$key" 2>/dev/null
}

state_set() {
  local key="$1" value="$2"
  python3 -c "
import json, sys
path, key, raw = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path) as f:
    data = json.load(f)
# Auto-detect type
if raw == 'true': val = True
elif raw == 'false': val = False
else:
    try: val = int(raw)
    except ValueError:
        try: val = float(raw)
        except ValueError: val = raw
data[key] = val
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" "$STATE" "$key" "$value"
}

state_add_experiment() {
  local exp_json="$1"
  python3 -c "
import json, sys
path = sys.argv[1]
exp = json.loads(sys.argv[2])
with open(path) as f:
    data = json.load(f)
data.setdefault('experiments', []).append(exp)
data['current_experiment'] = exp['id']
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" "$STATE" "$exp_json"
}

state_update_eval_breakdown() {
  local results_json="$1"
  python3 -c "
import json, sys
state_path = sys.argv[1]
results = json.loads(sys.argv[2])
with open(state_path) as f:
    data = json.load(f)
data['eval_breakdown'] = results.get('eval_breakdown', [])
with open(state_path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" "$STATE" "$results_json"
}

# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

start_dashboard() {
  if [ "$NO_DASHBOARD" = "true" ]; then
    return
  fi
  if [ -f "$SCRIPT_DIR/dashboard.py" ] && [ -f "$SCRIPT_DIR/dashboard.html" ]; then
    AUTORESEARCH_DASHBOARD_PORT="$DASHBOARD_PORT" python3 "$SCRIPT_DIR/dashboard.py" &
    DASHBOARD_PID=$!
    echo -e "${CYAN}Dashboard: http://localhost:${DASHBOARD_PORT}${NC}"
    if [ "$DASHBOARD_AUTO_OPEN" = "true" ]; then
      sleep 1
      open "http://localhost:${DASHBOARD_PORT}" 2>/dev/null || true
    fi
  fi
}

stop_dashboard() {
  if [ -n "$DASHBOARD_PID" ]; then
    kill "$DASHBOARD_PID" 2>/dev/null || true
    wait "$DASHBOARD_PID" 2>/dev/null || true
    DASHBOARD_PID=""
  fi
}

# ---------------------------------------------------------------------------
# Agent invocation
# ---------------------------------------------------------------------------

call_optimizer() {
  local experiment_num="$1"
  local current_score="$2"
  local best_score="$3"
  local stall_count="$4"
  local score_breakdown="$5"

  # Read template
  local template
  template=$(cat "$PROMPT_TEMPLATE")

  # Read program.md
  local program_content=""
  if [ -f "$SCRIPT_DIR/program.md" ]; then
    program_content=$(cat "$SCRIPT_DIR/program.md")
  fi

  # Read guardrails
  local guardrails_content=""
  if [ -f "$GUARDRAILS" ]; then
    guardrails_content=$(cat "$GUARDRAILS")
  fi

  # Get recent history (last 5 experiments)
  local recent_history
  recent_history=$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
exps = data.get('experiments', [])[-5:]
for e in exps:
    status = 'KEPT' if e.get('kept') else 'DISCARDED'
    print(f\"Exp {e['id']}: {e.get('hypothesis', 'n/a')} — {e.get('score_before', 0):.1%} → {e.get('score_after', 0):.1%} [{status}]\")
" "$STATE" 2>/dev/null || echo "No history yet.")

  # Count evals and inputs
  local num_evals num_inputs max_score
  num_evals=$(python3 -c "
import sys
count = 0
with open(sys.argv[1]) as f:
    for line in f:
        if line.strip().startswith('[[evals]]'):
            count += 1
print(count)
" "$CONFIG" 2>/dev/null || echo "0")
  num_inputs=$(ls "$SCRIPT_DIR/test_inputs/"*.md 2>/dev/null | wc -l | tr -d ' ')
  max_score=$((num_evals * num_inputs))

  # Render template
  local prompt="$template"
  prompt="${prompt//\{\{TARGET_PATH\}\}/$TARGET}"
  prompt="${prompt//\{\{EXPERIMENT_NUMBER\}\}/$experiment_num}"
  prompt="${prompt//\{\{CURRENT_SCORE\}\}/$current_score}"
  prompt="${prompt//\{\{BEST_SCORE\}\}/$best_score}"
  prompt="${prompt//\{\{STALL_COUNT\}\}/$stall_count}"
  prompt="${prompt//\{\{STALL_LIMIT\}\}/$STALL_LIMIT}"
  prompt="${prompt//\{\{MAX_SCORE\}\}/$max_score}"
  prompt="${prompt//\{\{NUM_EVALS\}\}/$num_evals}"
  prompt="${prompt//\{\{NUM_INPUTS\}\}/$num_inputs}"
  prompt="${prompt//\{\{SCORE_BREAKDOWN\}\}/$score_breakdown}"
  prompt="${prompt//\{\{PROGRAM_CONTENT\}\}/$program_content}"
  prompt="${prompt//\{\{RECENT_HISTORY\}\}/$recent_history}"
  prompt="${prompt//\{\{GUARDRAILS_CONTENT\}\}/$guardrails_content}"
  prompt="${prompt//\{\{HYPOTHESIS_PATH\}\}/$HYPOTHESIS_FILE}"

  # Call agent
  case "$AGENT_BACKEND" in
    claude) run_claude "$prompt" ;;
    codex)  run_codex "$prompt" ;;
    *)      run_custom "$prompt" "$AGENT_BACKEND" ;;
  esac
}

# ---------------------------------------------------------------------------
# Progress logging
# ---------------------------------------------------------------------------

log_progress() {
  local exp_id="$1" hypothesis="$2" score_before="$3" score_after="$4" kept="$5"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local status_label
  [ "$kept" = "true" ] && status_label="KEPT" || status_label="DISCARDED"

  cat >> "$PROGRESS" <<EOF

## $timestamp — Experiment $exp_id [$status_label]

- **Hypothesis:** $hypothesis
- **Score:** $score_before → $score_after
- **Status:** $status_label

---
EOF
}

log_error() {
  local message="$1"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] $message" >> "$ERRORS_LOG"
}

# ---------------------------------------------------------------------------
# Score formatting
# ---------------------------------------------------------------------------

format_breakdown() {
  local results_json="$1"
  python3 -c "
import json, sys
results = json.loads(sys.argv[1])
for name, data in results.get('by_input', {}).items():
    total = data['pass'] + data['fail']
    rate = data['pass'] / total if total > 0 else 0
    print(f'  {name}: {data[\"pass\"]}/{total} ({rate:.0%})')
    for d in data.get('details', []):
        icon = '✓' if d['result'] == 'Pass' else '✗'
        print(f'    {icon} {d[\"eval\"]}: {d[\"result\"]}')
" "$results_json" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------

do_baseline() {
  echo -e "${CYAN}Running baseline evaluation...${NC}"
  local results
  results=$(python3 "$SCRIPT_DIR/evaluate.py" --json --baseline)
  local score
  score=$(echo "$results" | python3 -c "import json,sys; print(json.load(sys.stdin)['aggregate'])")

  echo -e "${GREEN}Baseline score: ${BOLD}${score}${NC}"
  echo ""
  format_breakdown "$results"
  state_set "status" "baseline"
}

do_preview() {
  echo -e "${BOLD}Autoresearch State${NC}"
  echo ""
  echo "  Status:         $(state_get status)"
  echo "  Best score:     $(state_get best_score)"
  echo "  Best experiment: $(state_get best_experiment)"
  echo "  Current:        $(state_get current_experiment)"
  echo "  Stall count:    $(state_get stall_count) / $STALL_LIMIT"
  echo "  Max experiments: $MAX_EXPERIMENTS"
  echo ""

  local exp_count
  exp_count=$(python3 -c "
import json, sys
with open(sys.argv[1]) as f: data = json.load(f)
exps = data.get('experiments', [])
print(len(exps))
for e in exps:
    s = 'KEPT' if e.get('kept') else 'DISC'
    print(f\"  {e['id']:3d}  {e.get('score_before',0):.1%} → {e.get('score_after',0):.1%}  [{s}]  {e.get('hypothesis','')[:60]}\")
" "$STATE" 2>/dev/null)
  echo "$exp_count"
}

do_review() {
  echo -e "${BOLD}Review: Original vs Best${NC}"
  echo ""

  if command -v diff &>/dev/null; then
    diff --color=auto -u "$TARGET_ORIGINAL" "$TARGET_BEST" || true
  else
    diff -u "$TARGET_ORIGINAL" "$TARGET_BEST" || true
  fi

  echo ""
  echo -e "${BOLD}Experiment Summary${NC}"
  python3 -c "
import json, sys
with open(sys.argv[1]) as f: data = json.load(f)
exps = data.get('experiments', [])
kept = sum(1 for e in exps if e.get('kept'))
disc = len(exps) - kept
print(f'  Total experiments: {len(exps)}')
print(f'  Kept: {kept}  Discarded: {disc}')
print(f'  Baseline: {exps[0][\"score_after\"]:.1%}' if exps else '')
print(f'  Best: {data.get(\"best_score\", 0):.1%}')
print()
print('  Kept experiments:')
for e in exps:
    if e.get('kept') and e['id'] > 0:
        print(f\"    Exp {e['id']}: {e.get('hypothesis', '')}\")
        print(f\"      {e.get('score_before',0):.1%} → {e.get('score_after',0):.1%}\")
" "$STATE" 2>/dev/null

  echo ""
  echo -e "${YELLOW}Review guidance:${NC} Treat this like a junior engineer's PR."
  echo "  - Accept genuine improvements"
  echo "  - Reject changes that game the evals without real improvement"
  echo "  - Watch for removed features not covered by test inputs"
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

do_run() {
  local max_iter="$1"
  [ -z "$max_iter" ] && max_iter="$MAX_EXPERIMENTS"

  start_dashboard
  trap 'stop_dashboard; exit' INT TERM EXIT

  # Check if we have a baseline
  local status
  status=$(state_get status)
  if [ "$status" = "ready" ]; then
    echo -e "${YELLOW}No baseline found. Running baseline first...${NC}"
    do_baseline
    echo ""
  fi

  state_set "status" "running"
  state_set "stall_limit" "$STALL_LIMIT"

  local experiment_num stall_count best_score
  experiment_num=$(($(state_get current_experiment) + 1))
  stall_count=$(state_get stall_count)
  best_score=$(state_get best_score)

  local start_exp="$experiment_num"
  local end_exp=$((start_exp + max_iter - 1))

  echo -e "${BOLD}Starting autoresearch loop${NC}"
  echo "  Experiments: $start_exp to $end_exp (max $max_iter)"
  echo "  Stall limit: $STALL_LIMIT"
  echo "  Best score: $best_score"
  echo ""

  while [ "$experiment_num" -le "$end_exp" ]; do
    echo -e "${CYAN}━━━ Experiment $experiment_num ━━━${NC}"

    # Check stall limit
    if [ "$stall_count" -ge "$STALL_LIMIT" ]; then
      echo -e "${YELLOW}Stall limit reached ($stall_count consecutive no-improvement).${NC}"
      break
    fi

    # 1. Score before
    echo -e "  Scoring current target..."
    local before_json before_score
    before_json=$(python3 "$SCRIPT_DIR/evaluate.py" --json 2>&1) || {
      log_error "Experiment $experiment_num: evaluate.py failed (before)"
      echo -e "  ${RED}Evaluation failed. Skipping experiment.${NC}"
      experiment_num=$((experiment_num + 1))
      continue
    }
    before_score=$(echo "$before_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['aggregate'])" 2>/dev/null)
    if [ -z "$before_score" ]; then
      log_error "Experiment $experiment_num: failed to parse before-score"
      echo -e "  ${RED}Score parse failed. Skipping experiment.${NC}"
      experiment_num=$((experiment_num + 1))
      continue
    fi
    echo -e "  Before: ${before_score}"

    # 2. Call optimizer
    echo -e "  Calling optimizer agent..."
    local breakdown
    breakdown=$(format_breakdown "$before_json" 2>/dev/null || echo "")
    call_optimizer "$experiment_num" "$before_score" "$best_score" "$stall_count" "$breakdown" \
      > /dev/null 2>&1 || {
      log_error "Experiment $experiment_num: optimizer agent failed"
      echo -e "  ${RED}Optimizer failed. Skipping.${NC}"
      experiment_num=$((experiment_num + 1))
      continue
    }

    # Read hypothesis
    local hypothesis="no hypothesis recorded"
    if [ -f "$HYPOTHESIS_FILE" ]; then
      hypothesis=$(head -1 "$HYPOTHESIS_FILE" 2>/dev/null || echo "no hypothesis")
      rm -f "$HYPOTHESIS_FILE"
    fi

    # 3. Score after
    echo -e "  Scoring modified target..."
    local after_json after_score
    after_json=$(python3 "$SCRIPT_DIR/evaluate.py" --json 2>&1) || {
      log_error "Experiment $experiment_num: evaluate.py failed (after)"
      echo -e "  ${RED}Post-optimization eval failed. Reverting.${NC}"
      cp "$TARGET_BEST" "$TARGET"
      stall_count=$((stall_count + 1))
      state_set "stall_count" "$stall_count"
      experiment_num=$((experiment_num + 1))
      continue
    }
    after_score=$(echo "$after_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['aggregate'])" 2>/dev/null)
    if [ -z "$after_score" ]; then
      log_error "Experiment $experiment_num: failed to parse after-score"
      cp "$TARGET_BEST" "$TARGET"
      stall_count=$((stall_count + 1))
      state_set "stall_count" "$stall_count"
      experiment_num=$((experiment_num + 1))
      continue
    fi
    echo -e "  After: ${after_score}"

    # 4. Keep or revert
    local improved="false" kept="false"
    if python3 -c "exit(0 if float('$after_score') > float('$best_score') else 1)" 2>/dev/null; then
      improved="true"
      kept="true"
      best_score="$after_score"
      cp "$TARGET" "$TARGET_BEST"
      stall_count=0
      state_set "best_score" "$best_score"
      state_set "best_experiment" "$experiment_num"
      state_set "stall_count" "0"
      state_update_eval_breakdown "$after_json"
      echo -e "  ${GREEN}✓ KEPT — new best: ${best_score}${NC}"
    else
      kept="false"
      stall_count=$((stall_count + 1))
      cp "$TARGET_BEST" "$TARGET"
      state_set "stall_count" "$stall_count"
      echo -e "  ${RED}✗ DISCARDED — stall $stall_count/$STALL_LIMIT${NC}"
    fi

    # 5. Record experiment
    local details_before details_after
    details_before=$(echo "$before_json" | python3 -c "
import json, sys
r = json.load(sys.stdin)
d = {k: {'pass': v['pass'], 'fail': v['fail']} for k, v in r.get('by_input', {}).items()}
print(json.dumps(d))
" 2>/dev/null || echo "{}")
    details_after=$(echo "$after_json" | python3 -c "
import json, sys
r = json.load(sys.stdin)
d = {k: {'pass': v['pass'], 'fail': v['fail']} for k, v in r.get('by_input', {}).items()}
print(json.dumps(d))
" 2>/dev/null || echo "{}")

    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

    local exp_record
    exp_record=$(python3 -c "
import json, sys
print(json.dumps({
    'id': int(sys.argv[1]),
    'hypothesis': sys.argv[2],
    'score_before': float(sys.argv[3]),
    'score_after': float(sys.argv[4]),
    'improved': sys.argv[5] == 'true',
    'kept': sys.argv[6] == 'true',
    'details_before': json.loads(sys.argv[7]),
    'details_after': json.loads(sys.argv[8]),
    'timestamp': sys.argv[9],
}))
" "$experiment_num" "$hypothesis" "$before_score" "$after_score" \
  "$improved" "$kept" "$details_before" "$details_after" "$timestamp")

    state_add_experiment "$exp_record"

    # 6. Log progress
    log_progress "$experiment_num" "$hypothesis" "$before_score" "$after_score" "$kept"

    echo ""
    experiment_num=$((experiment_num + 1))
  done

  state_set "status" "complete"

  # Print summary
  echo -e "${BOLD}━━━ Run Complete ━━━${NC}"
  echo ""
  local total_exps=$((experiment_num - start_exp))
  echo "  Experiments run: $total_exps"
  echo "  Best score: $best_score"
  echo "  Stall count: $stall_count"
  echo ""
  echo -e "  Review results: ${CYAN}./run.sh --review${NC}"
  if [ "$NO_DASHBOARD" = "false" ] && [ -n "$DASHBOARD_PID" ]; then
    echo -e "  Dashboard: ${CYAN}http://localhost:${DASHBOARD_PORT}${NC}"
  fi
}

# ---------------------------------------------------------------------------
# Parse arguments and dispatch
# ---------------------------------------------------------------------------

load_config

while [ $# -gt 0 ]; do
  case "$1" in
    --baseline)
      MODE="baseline"
      shift
      ;;
    --preview)
      MODE="preview"
      shift
      ;;
    --review)
      MODE="review"
      shift
      ;;
    --no-dashboard)
      NO_DASHBOARD=true
      shift
      ;;
    --help|-h)
      echo "Usage: ./run.sh [options] [max-experiments]"
      echo ""
      echo "Options:"
      echo "  --baseline       Score current target only"
      echo "  --preview        Show current state"
      echo "  --review         Show diff of original vs best"
      echo "  --no-dashboard   Run without dashboard server"
      echo "  [number]         Max experiments to run"
      exit 0
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_EXPERIMENTS="$1"
      else
        echo -e "${RED}Unknown argument: $1${NC}"
        exit 1
      fi
      shift
      ;;
  esac
done

case "$MODE" in
  baseline) do_baseline ;;
  preview)  do_preview ;;
  review)   do_review ;;
  run)      do_run "$MAX_EXPERIMENTS" ;;
esac
