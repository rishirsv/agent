# Dashboard Specification

Live web dashboard at `http://localhost:{port}` for visualizing autoresearch
experiment results in real time.

## Architecture

- **`dashboard.py`** — Python `http.server` (~50 lines). Serves `dashboard.html`
  at `/` and `state.json` at `/api/state`. Re-reads state.json from disk on every
  request. No external dependencies.
- **`dashboard.html`** — Single-page app with inline CSS and JS. Fetches
  `/api/state` every 5 seconds and re-renders. Uses Chart.js from CDN.

## Data Contract

The dashboard reads `state.json` written by `run.sh`. Required fields:

```json
{
  "skill_name": "string",
  "current_experiment": 0,
  "best_score": 0.0,
  "best_experiment": 0,
  "stall_count": 0,
  "status": "ready | baseline | running | complete",
  "experiments": [
    {
      "id": 0,
      "hypothesis": "string",
      "score_before": 0.0,
      "score_after": 0.0,
      "improved": false,
      "kept": true,
      "timestamp": "ISO 8601"
    }
  ],
  "eval_breakdown": [
    {
      "name": "string",
      "total_pass": 0,
      "total_runs": 0
    }
  ]
}
```

## Views

### 1. Score Progression Chart (top)

- Line chart: X = experiment number, Y = pass rate (0-100%)
- Points colored by status: blue (baseline), green (kept), red (discarded)
- Best score highlighted
- Status badge in header: Running / Baseline / Complete / Stalled

### 2. Experiment Table (middle)

- Columns: #, Hypothesis, Before, After, Delta, Status
- Sorted newest-first
- Kept rows: green left border
- Discarded rows: red left border
- Baseline row: blue left border

### 3. Eval Breakdown (bottom)

- Horizontal bar chart: one bar per eval
- Sorted worst-to-best (weakest eval at top)
- Color gradient: red (< 50%) → yellow (50-80%) → green (> 80%)

## Styling

- White background, system sans-serif font
- Responsive layout (works at any width)
- Soft colors: green (#28a745), red (#dc3545), blue (#007bff), gray (#6c757d)
- No heavy frameworks — vanilla HTML/CSS/JS + Chart.js CDN only

## Lifecycle

- `run.sh` starts `dashboard.py` as a background process on loop start
- `run.sh` opens the browser automatically (configurable via `auto_open` in config.toml)
- `run.sh` kills the dashboard process on exit (trap EXIT)
- The dashboard can also be started standalone: `python3 dashboard.py`
