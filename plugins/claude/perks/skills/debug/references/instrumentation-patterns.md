# Instrumentation Patterns

Read this before adding temporary debug probes, runtime logging, or local collector calls. The goal is to test hypotheses without changing behavior or leaving residue.

## Scope Map

- Probe Rules: constraints for behavior-neutral temporary instrumentation.
- Use Existing Signals First: when not to add probes.
- Local Collector Use: safe localhost JSONL collection.
- Probe Payload Shape: structured fields that summarize well.
- JavaScript And TypeScript: browser and Node probe pattern.
- Python: standard-library probe pattern.
- Tests As Probes: when tests beat logging.
- Probe Cleanup: removal and inventory checks.

## Probe Rules

- Add the fewest probes that distinguish hypotheses.
- Mark every probe with `DEBUG_AGENT_PROBE <hypothesis>-<probe>` so cleanup can be verified.
- Log boundaries, not internals everywhere: inputs, outputs, branch decisions, thrown errors, timing, and external responses.
- Keep probes behavior-neutral. They should not change control flow, retries, caching, timing-sensitive sleeps, transactions, or user-visible output.
- Redact or omit secrets, tokens, cookies, credentials, personal data, and large payloads. Prefer IDs, shapes, counts, booleans, hashes, and enum-like values.
- Do not add permanent telemetry, dependencies, package installs, or remote log drains for a temporary investigation.

## Use Existing Signals First

Before editing code, inspect existing evidence:

- failing test output or stack trace
- app/server logs
- browser console/network output
- request IDs and correlation IDs
- feature flags and config values
- recent commits touching the path
- existing debug or trace logging toggles

If an existing signal answers the question, do not add a probe.

## Local Collector Use

Use [scripts/runtime_log_collector.py](../scripts/runtime_log_collector.py) when the agent needs structured logs from a running app and normal stdout, browser console, or test output is insufficient.

Default command from the skill root or copied script location:

```bash
python scripts/runtime_log_collector.py --out .debug-agent/runtime-logs.jsonl
```

The collector binds to `127.0.0.1` by default, generates a token, accepts `POST /log`, writes JSONL, and redacts common secret-looking fields. Keep it local unless the user explicitly approves another bind host.

## Probe Payload Shape

Prefer this shape so logs summarize cleanly:

```json
{
  "probe": "H2-P1",
  "event": "submit-boundary",
  "level": "info",
  "data": {
    "route": "/projects/:id",
    "hasWorkspaceId": false,
    "payloadKeys": ["name", "workspaceId"]
  }
}
```

Use stable, low-volume fields. Avoid dumping full objects unless the shape itself is the issue.

## JavaScript And TypeScript

Use collector calls only at narrow boundaries. For browser code, use `fetch` and swallow collector failures so the probe cannot break the user flow:

```ts
// DEBUG_AGENT_PROBE H1-P1
fetch("http://127.0.0.1:8765/log?token=TOKEN", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    probe: "H1-P1",
    event: "submit-boundary",
    data: { hasId: Boolean(id), keys: Object.keys(payload ?? {}) }
  })
}).catch(() => {});
```

For Node services, prefer the project logger if it is already configured and visible in the local run. Use collector calls only when stdout is inaccessible or too noisy.

## Python

Prefer the project logger or a focused assertion in tests. For collector calls:

```python
# DEBUG_AGENT_PROBE H1-P1
import json
import urllib.request

urllib.request.urlopen(
    urllib.request.Request(
        "http://127.0.0.1:8765/log?token=TOKEN",
        data=json.dumps({
            "probe": "H1-P1",
            "event": "branch-decision",
            "data": {"state": state_name, "item_count": len(items)},
        }).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    ),
    timeout=2,
)
```

Wrap probes in a tiny helper if more than one probe is needed, but keep the helper temporary and marked.

## Tests As Probes

A focused failing test is often better than runtime logging. Use a test as a probe when the bug can be isolated with controlled inputs. Name the test after the behavior, not the implementation. Keep or adapt the test as the regression check after the fix when it remains useful.

## Probe Cleanup

Before finalizing:

1. Remove temporary collector calls, debug prints, helper functions, added dependencies, scratch config, and temporary test bypasses.
2. Run [scripts/probe_inventory.py](../scripts/probe_inventory.py) from the project root or equivalent copied script location.
3. Re-run the key repro or targeted test after cleanup if executable code changed.
