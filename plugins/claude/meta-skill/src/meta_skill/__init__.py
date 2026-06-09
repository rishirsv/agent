"""Meta Skill CLI package."""

from .app_server.trial import app_server_run
from .artifacts import candidate_source, thread_evidence, trial_record
from .candidates import (
    DEFAULT_EXCLUDES,
    current_branch,
    git,
    git_ref,
    parse_frontmatter,
    payload_digest,
    resolve_candidate,
    resolve_skill_md,
    resolve_target_payload,
    skill_input_name,
)
from .cli import *  # noqa: F401,F403
from .errors import CliError
from .exec_fallback import exec_run
from .grading import grade_run, validator_command
from .ids import require_id, run_id, slug, utc_now
from .io import append_jsonl, emit, fail, normalize_usage, read_json, read_jsonl, resolve_run_dir, to_jsonable, write_json, write_jsonl
from .manifest import (
    DEFAULT_EVALS,
    case_dir,
    case_task_info,
    load_manifest,
    project_from_suite,
    select_candidates,
    select_cases,
    suite_path,
    trial_prompt,
    workbench_from_suite,
)
from .packaging import package_skill
from .report import build_report, list_runs, render_markdown
from .runner import progress_snapshot, run_eval, run_trial, terminal_count
from .staging import copy_payload, safe_case_file, stage_solver_workspace
from .validation import validate_report
from .workbench import init_workbench, materialize_cases
