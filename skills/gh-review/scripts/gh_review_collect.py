#!/usr/bin/env python3
"""Collect GitHub PR review backlog data for the current repository."""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import json
import re
import subprocess
import sys
from typing import Any


QUERY = r"""
query(
  $owner: String!,
  $repo: String!,
  $number: Int!,
  $commentsCursor: String,
  $reviewsCursor: String,
  $threadsCursor: String
) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      number
      url
      title
      state
      isDraft
      createdAt
      updatedAt
      closedAt
      mergedAt
      author { login }
      headRefName
      baseRefName
      comments(first: 100, after: $commentsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          databaseId
          url
          body
          createdAt
          updatedAt
          author { login }
        }
      }
      reviews(first: 100, after: $reviewsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          databaseId
          url
          state
          body
          submittedAt
          author { login }
        }
      }
      reviewThreads(first: 100, after: $threadsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          originalLine
          originalStartLine
          diffSide
          resolvedBy { login }
          comments(first: 100) {
            nodes {
              id
              databaseId
              url
              body
              createdAt
              updatedAt
              author { login }
            }
          }
        }
      }
    }
  }
}
"""


TRIVIAL_PATTERNS = (
    r"^\s*(lgtm|looks good|approved|thanks|thank you|nice|great)\s*[!.]*\s*$",
    r"^\s*:\+1:\s*$",
)


def die(message: str, code: int = 1) -> None:
    print(f"Error: {message}", file=sys.stderr)
    raise SystemExit(code)


def run(cmd: list[str], stdin: str | None = None) -> str:
    proc = subprocess.run(cmd, input=stdin, text=True, capture_output=True)
    if proc.returncode != 0:
        joined = " ".join(cmd)
        die(f"command failed: {joined}\n{proc.stderr.strip()}")
    return proc.stdout


def run_json(cmd: list[str], stdin: str | None = None) -> Any:
    out = run(cmd, stdin=stdin)
    try:
        return json.loads(out)
    except json.JSONDecodeError as exc:
        die(f"failed to parse JSON from {' '.join(cmd)}: {exc}\n{out[:1000]}")


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def repo_owner_name() -> tuple[str, str]:
    repo = run_json(["gh", "repo", "view", "--json", "nameWithOwner"])
    name_with_owner = repo.get("nameWithOwner")
    if not name_with_owner or "/" not in name_with_owner:
        die("could not resolve current GitHub repository with gh repo view")
    owner, name = name_with_owner.split("/", 1)
    return owner, name


def gh_graphql(owner: str, repo: str, number: int, cursors: dict[str, str | None]) -> dict[str, Any]:
    cmd = [
        "gh",
        "api",
        "graphql",
        "-F",
        "query=@-",
        "-F",
        f"owner={owner}",
        "-F",
        f"repo={repo}",
        "-F",
        f"number={number}",
    ]
    for key, value in cursors.items():
        if value:
            cmd.extend(["-F", f"{key}={value}"])
    payload = run_json(cmd, stdin=QUERY)
    if payload.get("errors"):
        die("GitHub GraphQL errors:\n" + json.dumps(payload["errors"], indent=2))
    return payload


def list_prs(limit: int, state: str = "all") -> list[dict[str, Any]]:
    fields = (
        "number,title,url,state,isDraft,author,headRefName,baseRefName,"
        "createdAt,updatedAt,closedAt,mergedAt,comments,reviewDecision,"
        "mergeable,mergeStateStatus,statusCheckRollup"
    )
    return run_json(["gh", "pr", "list", "--state", state, "--limit", str(limit), "--json", fields])


def touched_since(pr: dict[str, Any], cutoff: datetime) -> bool:
    for key in ("updatedAt", "closedAt", "mergedAt", "createdAt"):
        stamp = parse_time(pr.get(key))
        if stamp and stamp >= cutoff:
            return True
    return False


def fetch_pr(owner: str, repo: str, number: int) -> dict[str, Any]:
    comments: list[dict[str, Any]] = []
    reviews: list[dict[str, Any]] = []
    threads: list[dict[str, Any]] = []
    cursors: dict[str, str | None] = {
        "commentsCursor": None,
        "reviewsCursor": None,
        "threadsCursor": None,
    }
    meta: dict[str, Any] | None = None

    while True:
        payload = gh_graphql(owner, repo, number, cursors)
        pr = payload["data"]["repository"]["pullRequest"]
        if pr is None:
            die(f"PR #{number} was not found in {owner}/{repo}")
        if meta is None:
            meta = {
                key: pr.get(key)
                for key in (
                    "number",
                    "url",
                    "title",
                    "state",
                    "isDraft",
                    "createdAt",
                    "updatedAt",
                    "closedAt",
                    "mergedAt",
                    "author",
                    "headRefName",
                    "baseRefName",
                )
            }

        comment_page = pr["comments"]
        review_page = pr["reviews"]
        thread_page = pr["reviewThreads"]
        comments.extend(comment_page.get("nodes") or [])
        reviews.extend(review_page.get("nodes") or [])
        threads.extend(thread_page.get("nodes") or [])

        cursors = {
            "commentsCursor": comment_page["pageInfo"]["endCursor"]
            if comment_page["pageInfo"]["hasNextPage"]
            else None,
            "reviewsCursor": review_page["pageInfo"]["endCursor"]
            if review_page["pageInfo"]["hasNextPage"]
            else None,
            "threadsCursor": thread_page["pageInfo"]["endCursor"]
            if thread_page["pageInfo"]["hasNextPage"]
            else None,
        }
        if not any(cursors.values()):
            break

    assert meta is not None
    return {
        "pull_request": meta,
        "conversation_comments": comments,
        "reviews": reviews,
        "review_threads": threads,
    }


def body_is_trivial(body: str | None) -> bool:
    text = (body or "").strip()
    if not text:
        return True
    return any(re.match(pattern, text, flags=re.IGNORECASE) for pattern in TRIVIAL_PATTERNS)


def author_login(node: dict[str, Any]) -> str:
    author = node.get("author") or {}
    return author.get("login") or "unknown"


def flatten_comments(payload: dict[str, Any], include_trivial: bool) -> list[dict[str, Any]]:
    pr = payload["pull_request"]
    items: list[dict[str, Any]] = []

    def add_item(item: dict[str, Any]) -> None:
        if include_trivial or not body_is_trivial(item.get("body")):
            items.append(item)

    for comment in payload["conversation_comments"]:
        add_item(
            {
                "kind": "conversation_comment",
                "pr": pr,
                "author": author_login(comment),
                "body": comment.get("body") or "",
                "url": comment.get("url") or pr.get("url"),
                "createdAt": comment.get("createdAt"),
                "updatedAt": comment.get("updatedAt"),
                "path": None,
                "line": None,
                "resolved": None,
                "outdated": None,
            }
        )

    for review in payload["reviews"]:
        if review.get("body"):
            add_item(
                {
                    "kind": "review_body",
                    "pr": pr,
                    "author": author_login(review),
                    "body": review.get("body") or "",
                    "url": review.get("url") or pr.get("url"),
                    "createdAt": review.get("submittedAt"),
                    "updatedAt": review.get("submittedAt"),
                    "path": None,
                    "line": None,
                    "reviewState": review.get("state"),
                    "resolved": None,
                    "outdated": None,
                }
            )

    for thread in payload["review_threads"]:
        for comment in thread.get("comments", {}).get("nodes") or []:
            add_item(
                {
                    "kind": "review_thread_comment",
                    "pr": pr,
                    "author": author_login(comment),
                    "body": comment.get("body") or "",
                    "url": comment.get("url") or pr.get("url"),
                    "createdAt": comment.get("createdAt"),
                    "updatedAt": comment.get("updatedAt"),
                    "path": thread.get("path"),
                    "line": thread.get("line")
                    or thread.get("startLine")
                    or thread.get("originalLine")
                    or thread.get("originalStartLine"),
                    "resolved": thread.get("isResolved"),
                    "outdated": thread.get("isOutdated"),
                    "threadId": thread.get("id"),
                    "resolvedBy": thread.get("resolvedBy"),
                }
            )

    items.sort(key=lambda item: item.get("updatedAt") or item.get("createdAt") or "")
    return items


def one_line(text: str, limit: int = 140) -> str:
    collapsed = re.sub(r"\s+", " ", text).strip()
    if len(collapsed) <= limit:
        return collapsed
    return collapsed[: limit - 1].rstrip() + "..."


def status_check_summary(rollup: Any) -> str:
    if not rollup:
        return "checks unknown"
    if not isinstance(rollup, list):
        return "checks present"

    total = len(rollup)
    if total == 0:
        return "no checks reported"

    failing = []
    pending = []
    passing = 0
    for check in rollup:
        name = check.get("name") or check.get("workflowName") or check.get("context") or "check"
        conclusion = (check.get("conclusion") or "").upper()
        status = (check.get("status") or "").upper()
        if conclusion in {"FAILURE", "CANCELLED", "TIMED_OUT", "ACTION_REQUIRED"}:
            failing.append(name)
        elif conclusion in {"SUCCESS", "NEUTRAL", "SKIPPED"}:
            passing += 1
        elif status and status != "COMPLETED":
            pending.append(name)
        else:
            pending.append(name)

    parts = []
    if failing:
        parts.append(f"{len(failing)} failing")
    if pending:
        parts.append(f"{len(pending)} pending")
    if passing:
        parts.append(f"{passing} passing")
    return ", ".join(parts) if parts else f"{total} checks reported"


def review_summary(pr: dict[str, Any]) -> str:
    decision = pr.get("reviewDecision")
    if decision:
        return str(decision)
    comments = pr.get("comments")
    if comments:
        return f"review unknown; {comments} comments"
    return "review unknown"


def plain_pr_summary(pr: dict[str, Any]) -> str:
    title = pr.get("title") or "Untitled PR"
    lowered = title.lower()
    if any(word in lowered for word in ("fix", "repair", "restore", "resolve")):
        return "A fix-oriented PR that likely addresses a bug, regression, or review issue."
    if any(word in lowered for word in ("add", "ship", "create", "introduce")):
        return "A feature-oriented PR that likely adds a new capability or user-facing surface."
    if any(word in lowered for word in ("refactor", "cleanup", "canonicalize", "remove", "consolidate")):
        return "A maintenance-oriented PR that likely changes structure, ownership, or cleanup behavior."
    if any(word in lowered for word in ("doc", "tracker", "plan", "roadmap")):
        return "A documentation or planning PR that likely updates project state or guidance."
    return "A PR that needs a quick diff/readme pass to classify confidently."


def next_step_for_pr(pr: dict[str, Any]) -> str:
    if pr.get("isDraft"):
        return "Draft: review context is useful, but do not merge yet."
    checks = status_check_summary(pr.get("statusCheckRollup")).lower()
    if "failing" in checks:
        return "Fix CI before review or merge."
    decision = (pr.get("reviewDecision") or "").upper()
    comments = pr.get("comments") or 0
    if decision in {"CHANGES_REQUESTED", "REVIEW_REQUIRED"} or comments:
        return "Inspect review comments and decide whether to address or defer them."
    mergeable = (pr.get("mergeable") or "").upper()
    if mergeable in {"MERGEABLE", "UNKNOWN"}:
        return "Ready-looking; do a final review/readiness check before merging."
    return "Check mergeability and review state before taking action."


def render_prs_markdown(prs: list[dict[str, Any]]) -> str:
    if not prs:
        return "No open PRs found."
    lines = ["# Open PR Triage", ""]
    for pr in prs:
        author = author_login(pr)
        draft = " draft" if pr.get("isDraft") else ""
        decision = review_summary(pr)
        comments = pr.get("comments")
        checks = status_check_summary(pr.get("statusCheckRollup"))
        lines.append(f"- #{pr['number']} {pr['title']} ({pr.get('state')}{draft})")
        lines.append(f"  - URL: {pr.get('url')}")
        lines.append(f"  - Plain read: {plain_pr_summary(pr)}")
        lines.append(f"  - Branch: {pr.get('headRefName')} -> {pr.get('baseRefName')}")
        lines.append(f"  - Author: {author}; updated: {pr.get('updatedAt')}")
        lines.append(f"  - State: review {decision}; comments: {comments}; checks: {checks}; mergeable: {pr.get('mergeable') or 'unknown'}")
        lines.append(f"  - Initial thought: {next_step_for_pr(pr)}")
    return "\n".join(lines)


def render_comments_markdown(items: list[dict[str, Any]], since_days: int | None) -> str:
    title = "PR Review Comments"
    if since_days:
        title += f" From Last {since_days} Days"
    lines = [f"# {title}", ""]
    if not items:
        lines.append("No matching review comments found.")
        return "\n".join(lines)

    current_pr: int | None = None
    for idx, item in enumerate(items, start=1):
        pr = item["pr"]
        if pr["number"] != current_pr:
            current_pr = pr["number"]
            lines.append("")
            lines.append(f"## PR #{pr['number']}: {pr['title']}")
            lines.append(f"- URL: {pr.get('url')}")
            lines.append(f"- State: {pr.get('state')}; branch: {pr.get('headRefName')} -> {pr.get('baseRefName')}")
            lines.append("")
        location = item.get("path") or "conversation"
        if item.get("line"):
            location += f":{item['line']}"
        flags = []
        if item.get("resolved") is True:
            flags.append("resolved")
        if item.get("resolved") is False:
            flags.append("unresolved")
        if item.get("outdated"):
            flags.append("outdated")
        flag_text = f" [{' / '.join(flags)}]" if flags else ""
        lines.append(f"{idx}. **{item['kind']}** by `{item['author']}` at `{location}`{flag_text}")
        lines.append(f"   - Source: {item.get('url')}")
        lines.append(f"   - Summary: {one_line(item.get('body') or '')}")
    return "\n".join(lines).strip()


def cmd_open_prs(args: argparse.Namespace) -> None:
    prs = list_prs(args.limit, state="open")
    if args.format == "json":
        print(json.dumps(prs, indent=2))
    else:
        print(render_prs_markdown(prs))


def cmd_triage(args: argparse.Namespace) -> None:
    prs = list_prs(args.limit, state="open")
    if args.format == "json":
        print(json.dumps({"mode": "triage", "pull_requests": prs}, indent=2))
    else:
        print(render_prs_markdown(prs))


def cmd_comments(args: argparse.Namespace) -> None:
    owner, repo = repo_owner_name()
    if args.pr:
        numbers = [int(value) for value in args.pr]
    else:
        cutoff = datetime.now(timezone.utc) - timedelta(days=args.since_days)
        numbers = [
            int(pr["number"])
            for pr in list_prs(args.limit, state=args.state)
            if touched_since(pr, cutoff)
        ]

    collected: list[dict[str, Any]] = []
    for number in numbers:
        payload = fetch_pr(owner, repo, number)
        collected.extend(flatten_comments(payload, include_trivial=args.all_comments))

    result = {
        "repo": f"{owner}/{repo}",
        "since_days": None if args.pr else args.since_days,
        "pr_numbers": numbers,
        "comments": collected,
    }

    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        print(render_comments_markdown(collected, None if args.pr else args.since_days))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    open_prs = sub.add_parser("open-prs", help="List open PRs in the current repo.")
    open_prs.add_argument("--limit", type=int, default=50)
    open_prs.add_argument("--format", choices=("markdown", "json"), default="markdown")
    open_prs.set_defaults(func=cmd_open_prs)

    triage = sub.add_parser("triage", help="Triage open PRs with review/check/merge signals.")
    triage.add_argument("--limit", type=int, default=50)
    triage.add_argument("--format", choices=("markdown", "json"), default="markdown")
    triage.set_defaults(func=cmd_triage)

    comments = sub.add_parser("comments", help="Collect PR review comments.")
    comments.add_argument("--pr", action="append", help="PR number to inspect. Repeat for multiple PRs.")
    comments.add_argument("--since-days", type=int, default=7)
    comments.add_argument("--limit", type=int, default=100)
    comments.add_argument("--state", choices=("open", "closed", "merged", "all"), default="all")
    comments.add_argument("--all-comments", action="store_true", help="Include trivial praise/thanks comments.")
    comments.add_argument("--format", choices=("markdown", "json"), default="markdown")
    comments.set_defaults(func=cmd_comments)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
