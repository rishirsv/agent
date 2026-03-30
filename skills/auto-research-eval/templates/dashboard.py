#!/usr/bin/env python3
"""Localhost dashboard server for autoresearch results.

Serves dashboard.html at / and exposes state.json via /api/state.
Re-reads state.json from disk on every request so it always reflects
the latest data written by run.sh.

Usage:
    python3 dashboard.py                              # Default port 8384
    AUTORESEARCH_DASHBOARD_PORT=9000 python3 dashboard.py
"""

from __future__ import annotations

import http.server
import os
import sys
from pathlib import Path


PORT = int(os.environ.get("AUTORESEARCH_DASHBOARD_PORT", 8384))
SCRIPT_DIR = Path(__file__).resolve().parent
STATE_FILE = SCRIPT_DIR / "state.json"
DASHBOARD_FILE = SCRIPT_DIR / "dashboard.html"


class Handler(http.server.BaseHTTPRequestHandler):

    def do_GET(self) -> None:
        if self.path in ("/", "/index.html"):
            self._serve_file(DASHBOARD_FILE, "text/html")
        elif self.path == "/api/state":
            self._serve_file(STATE_FILE, "application/json", no_cache=True)
        else:
            self.send_error(404)

    def _serve_file(self, path: Path, content_type: str, no_cache: bool = False) -> None:
        if not path.exists():
            self.send_error(404, f"Not found: {path.name}")
            return
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if no_cache:
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args: object) -> None:
        pass  # Suppress request logs to keep terminal clean


def main() -> int:
    server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Dashboard: http://localhost:{PORT}")
    print(f"State:     {STATE_FILE}")
    print("Press Ctrl+C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard stopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
