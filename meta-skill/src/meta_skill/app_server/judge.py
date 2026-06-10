"""Rubric-backed model grading through Codex App Server."""

import json

from .client import load_sdk, sdk_version
from .evidence import fold_events
from .policy import APP_SERVER_APPROVAL_POLICY, APP_SERVER_SANDBOX, sdk_policy


def judge_output(*, rubric, task_text, output_text, cwd, event_path, expectations=None, expected_text=None, events_text=None, model=None):
    openai_codex, generated = load_sdk()
    sandbox, approval_mode = sdk_policy(openai_codex)
    expectations = expectations or []
    expected_block = f"\n\nHIDDEN EXPECTED OR REFERENCE OUTPUT:\n{expected_text}" if expected_text else ""
    events_block = f"\n\nTRIAL TRANSCRIPT / EVENTS:\n{events_text}" if events_text else ""
    expectations_block = ""
    if expectations:
        expectations_block = "\n\nEXPECTATIONS TO CHECK:\n" + "\n".join(f"- {item}" for item in expectations)
    prompt = (
        "You are grading one agent-eval trial. Judge the outcome first: the final answer, files, artifacts, or state. "
        "Use transcript/events only when the rubric or expectation is about process, tool use, activation, or explaining missing evidence. "
        "Do not reward surface compliance when the underlying task is wrong. The burden of proof is on a pass.\n\n"
        "Return only JSON with keys: score, label, rationale, checks, eval_feedback. "
        "score must be a number from 0 to 1 or null when evidence is insufficient. "
        "label must be pass, partial, fail, unknown, or needs_human_review. "
        "checks must be a list of objects with name, passed, evidence, and optional note. "
        "eval_feedback must be a list of concise notes about weak, unverifiable, missing, always-pass, or unfair checks; use [] when there is nothing material to flag.\n\n"
        "For every check, cite specific evidence from the solver output, expected/reference material, or transcript. "
        "If an expectation cannot be verified from available evidence, mark that check failed or unknown and explain why. "
        "If the task is ambiguous or the grader seems to require behavior not visible in the task, use needs_human_review.\n\n"
        f"RUBRIC:\n{rubric}\n\n"
        f"TASK SHOWN TO SOLVER:\n{task_text}\n\n"
        f"SOLVER OUTPUT:\n{output_text}"
        f"{expectations_block}"
        f"{expected_block}"
        f"{events_block}\n"
    )
    config = openai_codex.CodexConfig(cwd=str(cwd), client_name="meta_skill_cli", client_title="Meta Skill CLI")
    with openai_codex.Codex(config=config) as codex:
        thread = codex.thread_start(
            approval_mode=approval_mode,
            cwd=str(cwd),
            sandbox=sandbox,
            ephemeral=False,
            model=model,
        )
        turn = thread.turn([openai_codex.TextInput(text=prompt)], cwd=str(cwd), sandbox=sandbox, model=model)
        folded = fold_events(turn, generated, event_path)
    raw = folded["final_response"]
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {
            "score": None,
            "label": "fail",
            "rationale": f"judge emitted invalid JSON: {raw[:500]}",
            "checks": [],
            "eval_feedback": [],
        }
    return {
        "score": parsed.get("score"),
        "label": parsed.get("label") or "fail",
        "rationale": parsed.get("rationale") or "",
        "checks": parsed.get("checks", []),
        "eval_feedback": parsed.get("eval_feedback", []),
        "thread_id": thread.id,
        "turn_id": turn.id,
        "thread_persistence": "persistent",
        "usage": folded["usage"],
        "events": folded["event_count"],
        "sdk_version": sdk_version(),
        "runtime_version": None,
        "sandbox": APP_SERVER_SANDBOX,
        "runtime_approval_policy": APP_SERVER_APPROVAL_POLICY,
        "raw_response": raw,
    }
