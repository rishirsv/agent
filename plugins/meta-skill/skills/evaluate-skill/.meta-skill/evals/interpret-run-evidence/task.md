# Interpret Run Evidence Honestly

## Problem Description

A maintainer ran an eval suite for a skill and wants help interpreting the saved evidence.

Run summary:

- run ID: `2026-06-06T1900-working-payload`
- selected evals: `normal-doc-update`, `durable-capture-boundary`, `stale-link-cleanup`
- executed evals: `normal-doc-update`, `durable-capture-boundary`, `stale-link-cleanup`
- evidence root: `.meta-skill/runs/2026-06-06T1900-working-payload/`
- saved case files: each case has `task.md`, `rpc.jsonl`, `transcript.json`, and `response.md`
- score status: review required for all three evals
- token usage: exact totals are available for the first two evals and unavailable for `stale-link-cleanup`
- execution error: `stale-link-cleanup` ended with an App Server process-exit failure after one respawn attempt
- lint after the run recorded no failures

## Output Specification

Return an evidence interpretation summary that:

- names what ran and what errored
- lists the evidence paths a reviewer should inspect
- reports score status without inventing pass/fail results
- reports token usage availability
- explains what the run proves and does not prove
- recommends the next useful step

## Task

Interpret this run evidence for the maintainer.
