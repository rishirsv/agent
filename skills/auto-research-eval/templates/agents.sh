#!/usr/bin/env bash
# Agent execution backends for autoresearch.
# Each function takes a prompt string as its first argument.

DEFAULT_AGENT="claude"

run_claude() {
  local prompt="$1"
  claude -p --dangerously-skip-permissions "$prompt"
}

run_codex() {
  local prompt_file
  prompt_file=$(mktemp)
  printf '%s' "$1" > "$prompt_file"
  codex exec --yolo --skip-git-repo-check - < "$prompt_file"
  local rc=$?
  rm -f "$prompt_file"
  return $rc
}

run_custom() {
  local prompt="$1"
  local cmd="$2"
  if [[ "$cmd" == *"{prompt}"* ]]; then
    local tmpfile
    tmpfile=$(mktemp)
    printf '%s' "$prompt" > "$tmpfile"
    eval "${cmd//\{prompt\}/$tmpfile}"
    local rc=$?
    rm -f "$tmpfile"
    return $rc
  else
    printf '%s' "$prompt" | eval "$cmd"
  fi
}
