"""Sequential report extraction and verification pipeline."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
from typing import Any

import fitz  # type: ignore
from PIL import Image  # type: ignore
from pptx import Presentation  # type: ignore
from pptx.enum.shapes import MSO_SHAPE_TYPE  # type: ignore
from rapidfuzz import fuzz, process  # type: ignore

from .constants import (
    CANONICAL_SECTION_ORDER,
    LEGAL_EXCLUSION_PATTERNS,
    PLACEHOLDER_EXCLUSION_TYPES,
    SECTION_ALIASES,
    THRESHOLDS,
)

# Silence verbose MuPDF structure warnings; they are captured in manifests via status.
try:
    fitz.TOOLS.mupdf_display_warnings(False)
except Exception:
    pass


SUPPORTED_EXTENSIONS = {".pdf", ".pptx", ".ppt"}


@dataclass
class ExtractedLine:
    """Single extracted line with source location."""

    text: str
    page_num: int


@dataclass
class ExtractionResult:
    """Extraction result for one report."""

    report_id: str
    source_file: str
    source_format: str
    method_used: str
    lines: list[ExtractedLine]
    total_pages: int
    exclusion_stats: dict[str, int]
    warnings: list[str]


def utc_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def normalize_space(text: str) -> str:
    return " ".join(text.split()).strip()


def slugify_report_id(filename: str) -> str:
    stem = Path(filename).stem.lower()
    stem = re.sub(r"[^a-z0-9]+", "-", stem)
    stem = re.sub(r"-+", "-", stem).strip("-")
    return stem or "report"


def ensure_dependencies() -> None:
    missing_cmds: list[str] = []
    for cmd in ("soffice", "pdftotext", "pdftoppm"):
        if shutil.which(cmd) is None:
            missing_cmds.append(cmd)
    if missing_cmds:
        joined = ", ".join(missing_cmds)
        raise RuntimeError(f"Missing required system dependencies: {joined}")


def list_report_files(reports_dir: Path, exclude_substrings: list[str] | None = None) -> list[Path]:
    exclude_substrings = [x.casefold() for x in (exclude_substrings or []) if x.strip()]
    reports: list[Path] = []
    for p in reports_dir.iterdir():
        if not p.is_file():
            continue
        if p.name.startswith("."):
            continue
        if p.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        low = p.name.casefold()
        if any(token in low for token in exclude_substrings):
            continue
        reports.append(p)
    return sorted(reports, key=lambda p: p.name.casefold())


def looks_like_table_row(text: str) -> bool:
    if "|" in text or "\t" in text:
        return True
    tokens = text.split()
    if len(tokens) < 3:
        return False
    if len(tokens) <= 3:
        num_like = sum(
            1
            for t in tokens
            if re.fullmatch(r"[\(\-]?\$?\d[\d,.\)%\-]*", t.replace("'", ""))
        )
        if num_like >= 1:
            return True
    numeric_tokens = 0
    for t in tokens:
        cleaned = t.replace(",", "").replace(".", "").replace("%", "").replace("$", "")
        if cleaned.startswith("(") and cleaned.endswith(")"):
            cleaned = cleaned[1:-1]
        if cleaned.lstrip("-").isdigit():
            numeric_tokens += 1
    return numeric_tokens >= max(2, math.ceil(len(tokens) * 0.45))


def looks_like_page_number(text: str) -> bool:
    low = text.lower().strip()
    if re.fullmatch(r"page\s*\d+(\s*of\s*\d+)?", low):
        return True
    if re.fullmatch(r"\d+\s*/\s*\d+", low):
        return True
    return False


def is_legal_line(text: str) -> bool:
    return any(p.search(text) for p in LEGAL_EXCLUSION_PATTERNS)


def is_navigation_line(text: str) -> bool:
    low = text.lower()
    if " | " in text and text.count("|") >= 2:
        return True
    if low in {"contents", "glossary", "read more", "kpmg contacts"}:
        return True
    if "for illustrative purposes only" in low:
        return True
    if "draft for discussion purposes only" in low:
        return True
    if "private & confidential" in low or "private and confidential" in low:
        return True
    if "executive summary |" in low:
        return True
    return False


def should_exclude_line(text: str) -> tuple[bool, str]:
    if not text:
        return True, "empty"
    if len(text) <= 2:
        return True, "short_noise"
    if len(text.split()) <= 2 and any(ch.isdigit() for ch in text):
        return True, "numeric_stub"
    if text.lower() in {"draft", "contents"}:
        return True, "navigation"
    if re.fullmatch(r"[\$\d,().\- ]{2,}", text):
        return True, "numeric_stub"
    if looks_like_page_number(text):
        return True, "page_number"
    if is_legal_line(text):
        return True, "legal"
    if is_navigation_line(text):
        return True, "navigation"
    if text.lower().startswith("source:"):
        return True, "source_footnote"
    if looks_like_table_row(text):
        return True, "table_like"
    return False, ""


def bbox_intersects(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> bool:
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    return not (ax1 <= bx0 or bx1 <= ax0 or ay1 <= by0 or by1 <= ay0)


def find_table_bboxes(page: fitz.Page) -> list[tuple[float, float, float, float]]:
    bboxes: list[tuple[float, float, float, float]] = []
    finder = getattr(page, "find_tables", None)
    if not callable(finder):
        return bboxes
    try:
        tables = finder()
        for table in getattr(tables, "tables", []):
            bbox = getattr(table, "bbox", None)
            if bbox and len(bbox) == 4:
                bboxes.append((float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])))
    except Exception:
        return bboxes
    return bboxes


def likely_body_zone(y0: float, y1: float, page_h: float) -> bool:
    top_ok = y0 >= THRESHOLDS.header_zone_ratio * page_h
    bottom_ok = y1 <= THRESHOLDS.footer_zone_ratio * page_h
    return top_ok and bottom_ok


def extract_pdf_body_lines(pdf_path: Path) -> tuple[list[ExtractedLine], int, dict[str, int]]:
    doc = fitz.open(str(pdf_path))
    raw: list[dict[str, Any]] = []
    exclusion_stats = Counter()

    for page_idx in range(doc.page_count):
        page = doc[page_idx]
        page_height = float(page.rect.height)
        table_boxes = find_table_bboxes(page)
        page_dict = page.get_text("dict")

        for block in page_dict.get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                bbox = line.get("bbox", (0, 0, 0, 0))
                line_bbox = (float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3]))
                if any(bbox_intersects(line_bbox, tb) for tb in table_boxes):
                    exclusion_stats["table_region"] += 1
                    continue
                if not likely_body_zone(line_bbox[1], line_bbox[3], page_height):
                    exclusion_stats["header_footer_zone"] += 1
                    continue
                spans = line.get("spans", [])
                txt = normalize_space("".join(span.get("text", "") for span in spans))
                if not txt:
                    exclusion_stats["empty"] += 1
                    continue
                raw.append(
                    {
                        "text": txt,
                        "page_num": page_idx + 1,
                        "y0": line_bbox[1],
                        "y1": line_bbox[3],
                        "page_height": page_height,
                    }
                )

    repeated: set[str] = set()
    pages_by_text: dict[str, set[int]] = defaultdict(set)
    for rec in raw:
        key = rec["text"].lower()
        pages_by_text[key].add(rec["page_num"])
    min_pages = max(THRESHOLDS.repeated_line_min_pages, math.ceil(doc.page_count * THRESHOLDS.repeated_line_page_ratio))
    for key, pages in pages_by_text.items():
        if len(pages) >= min_pages:
            repeated.add(key)

    lines: list[ExtractedLine] = []
    for rec in raw:
        text = rec["text"]
        low = text.lower()
        y0 = rec["y0"]
        y1 = rec["y1"]
        page_h = rec["page_height"]

        if low in repeated and (y0 <= THRESHOLDS.header_zone_ratio * page_h or y1 >= THRESHOLDS.footer_zone_ratio * page_h):
            exclusion_stats["repeated_header_footer"] += 1
            continue

        excluded, reason = should_exclude_line(text)
        if excluded:
            exclusion_stats[reason] += 1
            continue

        lines.append(ExtractedLine(text=text, page_num=int(rec["page_num"])))

    if lines:
        return lines, doc.page_count, dict(exclusion_stats)

    # Fallback for documents where block extraction returns empty content.
    proc = subprocess.run(
        ["pdftotext", str(pdf_path), "-"],
        capture_output=True,
        text=True,
        errors="ignore",
        check=False,
    )
    pages = (proc.stdout or "").split("\f")
    fallback_lines: list[ExtractedLine] = []
    for idx, page_text in enumerate(pages, start=1):
        for raw_line in page_text.splitlines():
            text = normalize_space(raw_line)
            if not text:
                exclusion_stats["empty"] += 1
                continue
            excluded, reason = should_exclude_line(text)
            if excluded:
                exclusion_stats[reason] += 1
                continue
            fallback_lines.append(ExtractedLine(text=text, page_num=idx))

    return fallback_lines, doc.page_count, dict(exclusion_stats)


def run_soffice_convert_to_pdf(source_path: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    attempted: list[Path] = [source_path]

    # Some legacy binary PPT files are mislabeled as .pptx.
    if source_path.suffix.lower() == ".pptx":
        alt = out_dir / f"{source_path.stem}.ppt"
        shutil.copyfile(source_path, alt)
        attempted.append(alt)

    last_err = ""
    for candidate in attempted:
        proc = subprocess.run(
            [
                "soffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(out_dir),
                str(candidate),
            ],
            capture_output=True,
            text=True,
            errors="ignore",
            check=False,
        )
        last_err = (proc.stderr or proc.stdout or "").strip()
        pdfs = sorted(out_dir.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
        if pdfs:
            return pdfs[0]

    raise RuntimeError(f"soffice conversion produced no PDF for {source_path.name}. Last output: {last_err}")


def extract_strings_body_lines(path: Path) -> tuple[list[ExtractedLine], int, dict[str, int]]:
    proc = subprocess.run(
        ["strings", str(path)],
        capture_output=True,
        text=True,
        errors="ignore",
        check=False,
    )
    exclusion_stats = Counter()
    lines: list[ExtractedLine] = []
    for raw in proc.stdout.splitlines():
        text = normalize_space(raw)
        if len(text) < 6:
            exclusion_stats["short_noise"] += 1
            continue
        if sum(ch.isalpha() for ch in text) < 4:
            exclusion_stats["non_alpha_noise"] += 1
            continue
        excluded, reason = should_exclude_line(text)
        if excluded:
            exclusion_stats[reason] += 1
            continue
        lines.append(ExtractedLine(text=text, page_num=1))
    return lines, 1, dict(exclusion_stats)


def _touch_pptx_native_for_healthcheck(pptx_path: Path) -> None:
    """Optional sanity check for OOXML content; extraction still uses PDF-first path."""
    try:
        _ = Presentation(str(pptx_path))
    except Exception:
        return


def extract_report_text(report_path: Path, tmp_dir: Path) -> ExtractionResult:
    source_format = report_path.suffix.lower().lstrip(".")
    report_id = slugify_report_id(report_path.name)
    warnings: list[str] = []

    if source_format == "pdf":
        lines, pages, stats = extract_pdf_body_lines(report_path)
        if not lines:
            warnings.append("No extractable body text detected in PDF (likely image-based or restricted text layer).")
        return ExtractionResult(
            report_id=report_id,
            source_file=report_path.name,
            source_format=source_format,
            method_used="fitz_pdf",
            lines=lines,
            total_pages=pages,
            exclusion_stats=stats,
            warnings=warnings,
        )

    if source_format in {"pptx", "ppt"}:
        if source_format == "pptx":
            _touch_pptx_native_for_healthcheck(report_path)

        converted_pdf = run_soffice_convert_to_pdf(report_path, tmp_dir)
        lines, pages, stats = extract_pdf_body_lines(converted_pdf)
        if not lines:
            warnings.append("No extractable body text detected after presentation-to-PDF conversion.")
        return ExtractionResult(
            report_id=report_id,
            source_file=report_path.name,
            source_format=source_format,
            method_used="presentation_to_pdf_then_text_extract",
            lines=lines,
            total_pages=pages,
            exclusion_stats=stats,
            warnings=warnings,
        )

    raise ValueError(f"Unsupported source format: {source_format}")


def clean_heading(text: str) -> str:
    cleaned = text.strip().lower()
    cleaned = re.sub(r"^\d+(\.\d+)*\s*[-:)]?\s*", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip(" :")


def build_alias_lookup() -> tuple[list[str], dict[str, str]]:
    phrases: list[str] = []
    mapping: dict[str, str] = {}
    for section in CANONICAL_SECTION_ORDER:
        candidates = [section.lower(), *SECTION_ALIASES.get(section, [])]
        for phrase in candidates:
            if phrase not in mapping:
                phrases.append(phrase)
                mapping[phrase] = section
    return phrases, mapping


ALIAS_PHRASES, ALIAS_TO_SECTION = build_alias_lookup()


def map_heading_to_section(text: str) -> tuple[str, int, bool]:
    cleaned = clean_heading(text)
    if not cleaned:
        return CANONICAL_SECTION_ORDER[0], 0, False

    for section in CANONICAL_SECTION_ORDER:
        exact_candidates = {section.lower(), *SECTION_ALIASES.get(section, [])}
        if cleaned in exact_candidates:
            return section, 100, True

    for phrase in ALIAS_PHRASES:
        if phrase and phrase in cleaned:
            return ALIAS_TO_SECTION[phrase], 95, False

    matched = process.extractOne(cleaned, ALIAS_PHRASES, scorer=fuzz.token_set_ratio)
    if matched:
        phrase, score, _idx = matched
        return ALIAS_TO_SECTION[phrase], int(score), False

    return CANONICAL_SECTION_ORDER[0], 0, False


def looks_like_heading(text: str) -> bool:
    txt = normalize_space(text)
    if not txt:
        return False
    if len(txt) > THRESHOLDS.heading_max_chars:
        return False
    words = txt.split()
    if len(words) > THRESHOLDS.heading_max_words:
        return False
    digit_count = sum(ch.isdigit() for ch in txt)
    if digit_count / max(len(txt), 1) > THRESHOLDS.heading_max_digit_ratio:
        return False
    if txt.endswith("."):
        return False
    low = clean_heading(txt)
    for alias in ALIAS_PHRASES:
        if alias in low:
            return True
    if txt.isupper():
        return True
    if ":" in txt and len(words) <= 8:
        return True
    return False


def assign_sections(lines: list[ExtractedLine]) -> dict[str, list[tuple[str, str]]]:
    buckets: dict[str, list[tuple[str, str]]] = {section: [] for section in CANONICAL_SECTION_ORDER}
    current = CANONICAL_SECTION_ORDER[0]

    for ln in lines:
        text = ln.text
        if looks_like_heading(text):
            mapped, _score, _exact = map_heading_to_section(text)
            current = mapped
            continue

        items = buckets[current]
        if items and items[-1] == ("text", text):
            continue
        items.append(("text", text))

    return buckets


def render_appendices(entries: list[tuple[str, str]]) -> list[str]:
    sections: list[dict[str, Any]] = [{"name": "Appendix 1: Extracted Appendix Content", "lines": []}]

    for kind, text in entries:
        low = text.lower()
        if "appendix" in low and len(sections) < 3:
            sections.append({"name": f"Appendix {len(sections) + 1}: {text}", "lines": []})
            continue
        sections[-1]["lines"].append(f"- {text}")

    while len(sections) < 3:
        sections.append({"name": f"Appendix {len(sections) + 1}: Not present", "lines": ["Not present in source report"]})

    out: list[str] = []
    for section in sections[:3]:
        out.append(f"## {section['name']}")
        if section["lines"]:
            out.extend(section["lines"])
        else:
            out.append("Not present in source report")
        out.append("")
    return out


def render_markdown(result: ExtractionResult, sections: dict[str, list[tuple[str, str]]]) -> str:
    out: list[str] = []
    out.append(f"# Report Extraction: {result.report_id}")
    out.append("")
    out.append("## Report Metadata")
    out.append("")
    out.append(f"- `SOURCE_FILE`: {result.source_file}")
    out.append(f"- `REPORT_ID`: {result.report_id}")
    out.append(f"- `SOURCE_PATH`: reports/{result.source_file}")
    out.append("- `EXTRACTION_STATUS`: extracted_pending_verification")
    out.append(f"- `EXTRACTION_DATE`: {utc_now()}")
    out.append("")

    for section in CANONICAL_SECTION_ORDER:
        out.append(f"# {section}")
        entries = sections.get(section, [])
        if section == "Appendices":
            out.extend(render_appendices(entries))
            continue

        if not entries:
            out.append("Not present in source report")
            out.append("")
            continue

        for _kind, text in entries:
            if len(text.split()) < 3:
                continue
            out.append(f"- {text}")
        out.append("")

    return "\n".join(out).rstrip() + "\n"


def _page_sort_key(path: Path) -> int:
    m = re.search(r"(\d+)$", path.stem)
    if not m:
        return 0
    return int(m.group(1))


def render_pdf_pages_to_ppm(pdf_path: Path, pages_dir: Path, dpi: int = 160) -> list[Path]:
    pages_dir.mkdir(parents=True, exist_ok=True)
    prefix = pages_dir / "page"
    proc = subprocess.run(
        ["pdftoppm", "-r", str(dpi), "-forcenum", str(pdf_path), str(prefix)],
        capture_output=True,
        text=True,
        errors="ignore",
        check=False,
    )
    if proc.returncode != 0:
        msg = (proc.stderr or proc.stdout or "").strip()
        raise RuntimeError(f"pdftoppm failed for {pdf_path.name}: {msg}")
    outputs = sorted(pages_dir.glob("page-*.ppm"), key=_page_sort_key)
    if not outputs:
        raise RuntimeError(f"pdftoppm produced no PPM pages for {pdf_path.name}")
    return outputs


def build_montages(page_images: list[Path], montage_dir: Path, columns: int = 3, rows: int = 3) -> list[Path]:
    montage_dir.mkdir(parents=True, exist_ok=True)
    per_sheet = columns * rows
    montage_paths: list[Path] = []

    for start in range(0, len(page_images), per_sheet):
        chunk = page_images[start : start + per_sheet]
        images = [Image.open(p).convert("RGB") for p in chunk]
        resized: list[Image.Image] = []
        for im in images:
            copy = im.copy()
            copy.thumbnail((1000, 1000))
            resized.append(copy)

        max_w = max(im.width for im in resized)
        max_h = max(im.height for im in resized)
        padding = 24
        canvas_w = columns * max_w + (columns + 1) * padding
        canvas_h = rows * max_h + (rows + 1) * padding
        canvas = Image.new("RGB", (canvas_w, canvas_h), color="white")

        for idx, im in enumerate(resized):
            row = idx // columns
            col = idx % columns
            x = padding + col * (max_w + padding)
            y = padding + row * (max_h + padding)
            canvas.paste(im, (x, y))

        out_path = montage_dir / f"montage-{(start // per_sheet) + 1:02d}.png"
        canvas.save(out_path)
        montage_paths.append(out_path)

        for im in images:
            im.close()
        for im in resized:
            im.close()

    return montage_paths


def source_to_pdf_for_verification(source_path: Path, tmp_dir: Path) -> Path:
    if source_path.suffix.lower() == ".pdf":
        return source_path
    return run_soffice_convert_to_pdf(source_path, tmp_dir)


def write_json(path: Path, payload: dict[str, Any] | list[Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_review_notes(path: Path, report_id: str, source_file: str) -> None:
    content = f"""# Verification Notes: {report_id}

- Source file: `{source_file}`
- Reviewer: `<required>`
- Review status: `<pass|needs_revision|blocked>`
- Review date: `<YYYY-MM-DD>`

## Checklist

- [ ] Reviewed full montage PNGs against extracted markdown
- [ ] Confirmed body text is captured appropriately
- [ ] Confirmed table text is excluded
- [ ] Confirmed image-derived text is excluded
- [ ] Confirmed legal/footer/navigation noise is excluded
- [ ] Confirmed incremental sections are captured under nearest canonical section

## Notes

- <add findings here>
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def section_counts(sections: dict[str, list[tuple[str, str]]]) -> dict[str, int]:
    return {section: sum(1 for kind, _ in items if kind == "text") for section, items in sections.items()}


def build_report_manifest(
    result: ExtractionResult,
    sections: dict[str, list[tuple[str, str]]],
    verification_status: str,
    source_path: Path,
) -> dict[str, Any]:
    counts = section_counts(sections)
    return {
        "report_id": result.report_id,
        "source_file": result.source_file,
        "source_path": str(source_path),
        "source_format": result.source_format,
        "method_used": result.method_used,
        "total_pages": result.total_pages,
        "line_count": len(result.lines),
        "section_counts": counts,
        "missing_sections": [sec for sec, c in counts.items() if c == 0],
        "exclusion_stats": result.exclusion_stats,
        "warnings": result.warnings,
        "verification_status": verification_status,
        "updated_at": utc_now(),
    }


def write_processing_order(files: list[Path], manifests_dir: Path) -> list[dict[str, Any]]:
    order: list[dict[str, Any]] = []
    for idx, report in enumerate(files, start=1):
        order.append(
            {
                "index": idx,
                "source_file": report.name,
                "source_path": str(report.resolve()),
                "format": report.suffix.lower().lstrip("."),
                "report_id": slugify_report_id(report.name),
            }
        )
    write_json(manifests_dir / "processing-order.json", order)
    return order


def write_tracker(rows: list[dict[str, str]], manifests_dir: Path) -> None:
    lines = [
        "# Extraction Tracker",
        "",
        "| Report File | Report ID | Status | Output File | Notes |",
        "|---|---|---|---|---|",
    ]
    for row in rows:
        lines.append(
            f"| {row['source_file']} | {row['report_id']} | {row['status']} | {row['output_file']} | {row['notes']} |"
        )
    lines.append("")
    (manifests_dir / "tracker.md").write_text("\n".join(lines), encoding="utf-8")
    write_json(manifests_dir / "tracker.json", rows)


def process_one_report(
    source_path: Path,
    extracted_dir: Path,
    verification_root: Path,
    manifests_dir: Path,
    tmp_root: Path,
) -> dict[str, str]:
    report_id = slugify_report_id(source_path.name)
    tmp_dir = tmp_root / report_id
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    try:
        extraction = extract_report_text(source_path, tmp_dir)
        sections = assign_sections(extraction.lines)
        md = render_markdown(extraction, sections)
        output_md = extracted_dir / f"{report_id}.md"
        output_md.parent.mkdir(parents=True, exist_ok=True)
        output_md.write_text(md, encoding="utf-8")

        verification_dir = verification_root / report_id
        pages_dir = verification_dir / "pages"
        montage_dir = verification_dir / "montage"
        verification_dir.mkdir(parents=True, exist_ok=True)

        counts = section_counts(sections)
        verification_payload = {
            "report_id": report_id,
            "source_file": source_path.name,
            "status": "pending_second_pass",
            "page_count": 0,
            "markdown_path": str(output_md),
            "montage_files": [],
            "section_coverage": counts,
            "missing_sections": [sec for sec, count in counts.items() if count == 0],
            "reviewer": None,
            "review_notes_file": str(verification_dir / "review-notes.md"),
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }

        verification_status = "pending_second_pass"
        try:
            verification_pdf = source_to_pdf_for_verification(source_path, tmp_dir)
            page_images = render_pdf_pages_to_ppm(verification_pdf, pages_dir)
            montage_paths = build_montages(page_images, montage_dir)
            verification_payload["page_count"] = len(page_images)
            verification_payload["montage_files"] = [str(p) for p in montage_paths]
        except Exception as exc:
            verification_status = "blocked"
            verification_payload["status"] = "blocked"
            verification_payload["verification_error"] = str(exc)

        write_json(verification_dir / "verification.json", verification_payload)
        write_review_notes(verification_dir / "review-notes.md", report_id, source_path.name)

        manifest_payload = build_report_manifest(
            result=extraction,
            sections=sections,
            verification_status=verification_status,
            source_path=source_path,
        )
        write_json(manifests_dir / f"{report_id}.json", manifest_payload)

        return {
            "source_file": source_path.name,
            "report_id": report_id,
            "status": "done_pending_review" if verification_status != "blocked" else "done_blocked_verification",
            "output_file": str(output_md),
            "notes": extraction.method_used,
        }
    finally:
        if tmp_dir.exists():
            shutil.rmtree(tmp_dir)


def run_pipeline(
    reports_dir: Path,
    extracted_dir: Path,
    verification_dir: Path,
    manifests_dir: Path,
    tmp_root: Path,
    max_reports: int | None,
    start_index: int,
    skip_existing: bool,
    exclude_substrings: list[str] | None,
) -> None:
    ensure_dependencies()

    files = list_report_files(reports_dir, exclude_substrings=exclude_substrings)
    if start_index > 0:
        files = files[start_index:]
    if max_reports is not None:
        files = files[:max_reports]

    manifests_dir.mkdir(parents=True, exist_ok=True)
    extracted_dir.mkdir(parents=True, exist_ok=True)
    verification_dir.mkdir(parents=True, exist_ok=True)
    tmp_root.mkdir(parents=True, exist_ok=True)

    _order = write_processing_order(files, manifests_dir)

    tracker_rows: list[dict[str, str]] = []
    for source in files:
        report_id = slugify_report_id(source.name)
        output_md = extracted_dir / f"{report_id}.md"
        if skip_existing and output_md.exists():
            tracker_rows.append(
                {
                    "source_file": source.name,
                    "report_id": report_id,
                    "status": "skipped_existing",
                    "output_file": str(output_md),
                    "notes": "already exists",
                }
            )
            write_tracker(tracker_rows, manifests_dir)
            continue

        try:
            row = process_one_report(
                source_path=source,
                extracted_dir=extracted_dir,
                verification_root=verification_dir,
                manifests_dir=manifests_dir,
                tmp_root=tmp_root,
            )
        except Exception as exc:
            report_id = slugify_report_id(source.name)
            error_payload = {
                "report_id": report_id,
                "source_file": source.name,
                "source_path": str(source),
                "verification_status": "blocked",
                "error": str(exc),
                "updated_at": utc_now(),
            }
            write_json(manifests_dir / f"{report_id}.json", error_payload)
            row = {
                "source_file": source.name,
                "report_id": report_id,
                "status": "blocked",
                "output_file": str(extracted_dir / f"{report_id}.md"),
                "notes": str(exc),
            }
        tracker_rows.append(row)
        write_tracker(tracker_rows, manifests_dir)


def mark_reviewed(
    manifests_dir: Path,
    verification_dir: Path,
    report_id: str,
    reviewer: str,
    status: str,
    notes: str | None,
) -> None:
    verification_path = verification_dir / report_id / "verification.json"
    manifest_path = manifests_dir / f"{report_id}.json"

    if not verification_path.exists():
        raise FileNotFoundError(f"Verification file not found: {verification_path}")
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest file not found: {manifest_path}")

    verification = json.loads(verification_path.read_text(encoding="utf-8"))
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    verification["status"] = status
    verification["reviewer"] = reviewer
    verification["reviewed_at"] = utc_now()
    if notes:
        verification["review_notes"] = notes
    verification["updated_at"] = utc_now()

    manifest["verification_status"] = status
    manifest["reviewer"] = reviewer
    manifest["reviewed_at"] = utc_now()
    manifest["updated_at"] = utc_now()
    if notes:
        manifest["review_notes"] = notes

    write_json(verification_path, verification)
    write_json(manifest_path, manifest)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Sequential report extraction + visual verification")
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Run sequential extraction pipeline")
    run.add_argument("--reports-dir", default="reports", help="Source reports directory")
    run.add_argument("--extracted-dir", default="reports/extracted", help="Markdown output directory")
    run.add_argument("--verification-dir", default="reports/verification", help="Verification output directory")
    run.add_argument("--manifests-dir", default="reports/manifests", help="Manifest output directory")
    run.add_argument("--tmp-dir", default="reports/tmp", help="Temporary working directory")
    run.add_argument("--max-reports", type=int, default=None, help="Optional max reports to process")
    run.add_argument("--start-index", type=int, default=0, help="Optional 0-based start index in ordered queue")
    run.add_argument("--skip-existing", action="store_true", help="Skip reports with existing markdown outputs")
    run.add_argument(
        "--exclude-substring",
        action="append",
        default=[],
        help="Exclude reports whose filenames contain this substring (case-insensitive). Repeatable.",
    )

    review = sub.add_parser("mark-reviewed", help="Mark verification outcome for a report")
    review.add_argument("--report-id", required=True, help="Report id (slug)")
    review.add_argument("--reviewer", required=True, help="Reviewer name/id")
    review.add_argument("--status", choices=["pass", "needs_revision", "blocked"], required=True)
    review.add_argument("--notes", default=None, help="Optional review notes")
    review.add_argument("--verification-dir", default="reports/verification", help="Verification directory")
    review.add_argument("--manifests-dir", default="reports/manifests", help="Manifest directory")

    preflight = sub.add_parser("preflight", help="Check required dependencies")
    _ = preflight

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "preflight":
        ensure_dependencies()
        print("Preflight OK: required dependencies are installed.")
        return

    if args.command == "run":
        run_pipeline(
            reports_dir=Path(args.reports_dir).resolve(),
            extracted_dir=Path(args.extracted_dir).resolve(),
            verification_dir=Path(args.verification_dir).resolve(),
            manifests_dir=Path(args.manifests_dir).resolve(),
            tmp_root=Path(args.tmp_dir).resolve(),
            max_reports=args.max_reports,
            start_index=args.start_index,
            skip_existing=bool(args.skip_existing),
            exclude_substrings=list(args.exclude_substring or []),
        )
        print("Pipeline completed.")
        return

    if args.command == "mark-reviewed":
        mark_reviewed(
            manifests_dir=Path(args.manifests_dir).resolve(),
            verification_dir=Path(args.verification_dir).resolve(),
            report_id=args.report_id,
            reviewer=args.reviewer,
            status=args.status,
            notes=args.notes,
        )
        print(f"Marked {args.report_id} as {args.status}.")
        return

    raise RuntimeError(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    main()
