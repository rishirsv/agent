#!/usr/bin/env python3
"""Local JSONL runtime log collector for evidence-led debugging.

Starts a localhost HTTP server that accepts POST /log requests and appends
sanitized records to a JSONL file. Designed for temporary debug probes.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import secrets
import signal
import sys
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

SENSITIVE_KEY_RE = re.compile(r"(password|passwd|pwd|secret|token|api[-_]?key|access[-_]?key|auth|authorization|cookie|session|credential)", re.I)
BEARER_RE = re.compile(r"(?i)\b(bearer\s+)[A-Za-z0-9._\-~+/]+=*")
OPENAI_KEY_RE = re.compile(r"\bsk-[A-Za-z0-9_\-]{16,}\b")
AWS_KEY_RE = re.compile(r"\bAKIA[0-9A-Z]{16}\b")


def utc_now() -> str:
    return _dt.datetime.now(_dt.UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def redact(value: Any) -> Any:
    if isinstance(value, dict):
        clean: dict[str, Any] = {}
        for key, item in value.items():
            if SENSITIVE_KEY_RE.search(str(key)):
                clean[str(key)] = "[REDACTED]"
            else:
                clean[str(key)] = redact(item)
        return clean
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, tuple):
        return [redact(item) for item in value]
    if isinstance(value, str):
        value = BEARER_RE.sub(r"\1[REDACTED]", value)
        value = OPENAI_KEY_RE.sub("[REDACTED_OPENAI_KEY]", value)
        value = AWS_KEY_RE.sub("[REDACTED_AWS_KEY]", value)
        return value
    return value


def parse_body(raw: bytes, content_type: str) -> Any:
    text = raw.decode("utf-8", errors="replace")
    if "application/json" in content_type.lower():
        try:
            return json.loads(text) if text else {}
        except json.JSONDecodeError as exc:
            return {"_parse_error": str(exc), "raw": text}
    if "application/x-www-form-urlencoded" in content_type.lower():
        return {key: values[-1] if len(values) == 1 else values for key, values in urllib.parse.parse_qs(text).items()}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"message": text}


def token_from_request(handler: BaseHTTPRequestHandler, parsed: urllib.parse.ParseResult, body: Any) -> str | None:
    query = urllib.parse.parse_qs(parsed.query)
    if query.get("token"):
        return query["token"][-1]
    header = handler.headers.get("X-Debug-Token")
    if header:
        return header.strip()
    auth = handler.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    if isinstance(body, dict) and "_token" in body:
        return str(body.get("_token"))
    return None


class CollectorState:
    def __init__(self, out_path: Path, token: str, max_body_bytes: int, redact_enabled: bool) -> None:
        self.out_path = out_path
        self.token = token
        self.max_body_bytes = max_body_bytes
        self.redact_enabled = redact_enabled
        self.count = 0
        self.lock = threading.Lock()
        self.out_path.parent.mkdir(parents=True, exist_ok=True)

    def append(self, record: dict[str, Any]) -> int:
        if self.redact_enabled:
            record = redact(record)
        line = json.dumps(record, ensure_ascii=False, sort_keys=True)
        with self.lock:
            with self.out_path.open("a", encoding="utf-8") as handle:
                handle.write(line + "\n")
            self.count += 1
            return self.count


class Handler(BaseHTTPRequestHandler):
    state: CollectorState

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[%s] %s\n" % (utc_now(), fmt % args))

    def _headers(self, status: int, content_type: str = "application/json") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Debug-Token, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        self._headers(status)
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._headers(204)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/health":
            self._json(200, {"ok": True, "records": self.state.count, "out": str(self.state.out_path)})
            return
        if parsed.path == "/snippets":
            self._headers(200, "text/plain; charset=utf-8")
            self.wfile.write(snippets(self.server.server_address[0], self.server.server_address[1], self.state.token).encode("utf-8"))
            return
        self._json(404, {"ok": False, "error": "Use POST /log, GET /health, or GET /snippets"})

    def do_POST(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/log":
            self._json(404, {"ok": False, "error": "Use POST /log"})
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        if length > self.state.max_body_bytes:
            self._json(413, {"ok": False, "error": f"Body too large; limit is {self.state.max_body_bytes} bytes"})
            return

        raw = self.rfile.read(length)
        body = parse_body(raw, self.headers.get("Content-Type", ""))
        supplied_token = token_from_request(self, parsed, body)
        if supplied_token != self.state.token:
            self._json(403, {"ok": False, "error": "Missing or invalid debug token"})
            return
        if isinstance(body, dict):
            body.pop("_token", None)

        record = {
            "ts": utc_now(),
            "path": parsed.path,
            "remote": self.client_address[0],
            "method": "POST",
            "headers": {
                "user-agent": self.headers.get("User-Agent"),
                "content-type": self.headers.get("Content-Type"),
            },
            "body": body,
        }
        idx = self.state.append(record)
        self._json(200, {"ok": True, "record": idx})


def snippets(host: str, port: int, token: str) -> str:
    url = f"http://{host}:{port}/log?token={urllib.parse.quote(token)}"
    return f"""Temporary probe snippets. Replace probe/event/data and remove after verification.

JavaScript / TypeScript:
// DEBUG_AGENT_PROBE H1-P1
fetch("{url}", {{
  method: "POST",
  headers: {{"Content-Type": "application/json"}},
  body: JSON.stringify({{probe: "H1-P1", event: "describe-event", data: {{}}}})
}}).catch(() => {{}});

Python:
# DEBUG_AGENT_PROBE H1-P1
import json, urllib.request
urllib.request.urlopen(urllib.request.Request(
    "{url}",
    data=json.dumps({{"probe": "H1-P1", "event": "describe-event", "data": {{}}}}).encode(),
    headers={{"Content-Type": "application/json"}},
    method="POST",
), timeout=2)

Shell / curl:
curl -sS -X POST "{url}" -H 'Content-Type: application/json' \\
  --data '{{"probe":"H1-P1","event":"describe-event","data":{{}}}}'
"""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a localhost JSONL log collector for temporary debug probes.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host. Keep 127.0.0.1 unless you intentionally need remote access.")
    parser.add_argument("--port", type=int, default=8765, help="Bind port.")
    parser.add_argument("--out", default=".debug-agent/runtime-logs.jsonl", help="JSONL output path.")
    parser.add_argument("--token", default=None, help="Debug token. Generated when omitted.")
    parser.add_argument("--append", action="store_true", help="Append to an existing output file instead of starting fresh.")
    parser.add_argument("--max-body-bytes", type=int, default=1_000_000, help="Maximum accepted POST body size.")
    parser.add_argument("--no-redact", action="store_true", help="Disable best-effort secret redaction.")
    parser.add_argument("--quiet", action="store_true", help="Do not print probe snippets on startup.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    out_path = Path(args.out).expanduser().resolve()
    if out_path.exists() and not args.append:
        out_path.unlink()
    token = args.token or secrets.token_urlsafe(16)

    state = CollectorState(out_path=out_path, token=token, max_body_bytes=args.max_body_bytes, redact_enabled=not args.no_redact)
    Handler.state = state

    try:
        server = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as exc:
        print(f"error: cannot bind {args.host}:{args.port}: {exc}", file=sys.stderr)
        return 1

    def stop(_signum: int, _frame: Any) -> None:
        print("\nStopping collector...", file=sys.stderr)
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    actual_host, actual_port = server.server_address
    print(f"Runtime log collector listening on http://{actual_host}:{actual_port}")
    print(f"Output JSONL: {out_path}")
    print(f"Debug token: {token}")
    print("Health check: GET /health")
    if not args.quiet:
        print()
        print(snippets(actual_host, actual_port, token))
    try:
        server.serve_forever()
    finally:
        server.server_close()
    print(f"Wrote {state.count} records to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
