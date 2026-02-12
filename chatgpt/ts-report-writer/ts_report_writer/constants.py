"""Configuration constants for report extraction."""

from __future__ import annotations

from dataclasses import dataclass
import re


CANONICAL_SECTION_ORDER = [
    "Executive Summary",
    "Key Findings",
    "Business Overview",
    "Summary Financials",
    "Profit and Loss Overview / Financial Performance",
    "Quality of Earnings",
    "Income Statement",
    "Balance Sheet",
    "Net Working Capital",
    "Net Debt (Cash)",
    "Cash Flows",
    "Related Parties",
    "Reporting Environment",
    "Forecast Trading",
    "Industry Analysis",
    "Quality of Net Assets",
    "Gross Margin by LOB",
    "Appendices",
]


SECTION_ALIASES = {
    "Executive Summary": ["executive summary", "summary"],
    "Key Findings": ["key findings", "highlights", "deal considerations"],
    "Business Overview": ["business overview", "company overview", "transaction perimeter"],
    "Summary Financials": ["summary financials", "summary financial information"],
    "Profit and Loss Overview / Financial Performance": [
        "profit and loss overview",
        "financial performance",
        "historical trading",
        "profit & loss overview",
        "income statement overview",
        "consolidated financial performance",
    ],
    "Quality of Earnings": ["quality of earnings", "qoe", "quality of earning"],
    "Income Statement": ["income statement", "p&l", "profit and loss"],
    "Balance Sheet": ["balance sheet", "statement of financial position"],
    "Net Working Capital": ["net working capital", "nwc", "working capital"],
    "Net Debt (Cash)": ["net debt", "net cash", "debt cash"],
    "Cash Flows": ["cash flows", "cash flow"],
    "Related Parties": ["related parties", "related party transactions", "related party balances"],
    "Reporting Environment": ["reporting environment", "financial reporting environment"],
    "Forecast Trading": ["forecast trading", "budget outlook", "forecast"],
    "Industry Analysis": ["industry analysis", "market overview"],
    "Quality of Net Assets": ["quality of net assets"],
    "Gross Margin by LOB": ["gross margin by lob"],
    "Appendices": ["appendices", "appendix"],
}


LEGAL_EXCLUSION_PATTERNS = [
    re.compile(x, re.IGNORECASE)
    for x in [
        r"\bimportant notice\b",
        r"\bprivate and confidential\b",
        r"\ball rights reserved\b",
        r"\bnon[- ]reliance\b",
        r"\bscope of work\b",
        r"\bbasis of preparation\b",
        r"\bengagement letter\b",
        r"\bkpmg\b",
        r"\bdeloitte\b",
        r"\bey\b",
        r"\bpwc\b",
        r"\bmember firm\b",
        r"\blegal member firm name\b",
        r"\bdocument classification\b",
        r"\byours faithfully\b",
        r"\byours sincerely\b",
    ]
]


PLACEHOLDER_EXCLUSION_TYPES = {
    # pptx placeholder ids for footer/date/slide number
    7,   # DATE
    8,   # SLIDE_NUMBER
    9,   # FOOTER
}


@dataclass(frozen=True)
class Thresholds:
    """Thresholds for filtering and heading detection."""

    header_zone_ratio: float = 0.12
    footer_zone_ratio: float = 0.88
    repeated_line_page_ratio: float = 0.20
    repeated_line_min_pages: int = 3
    heading_fuzzy_match_min: int = 66
    heading_max_words: int = 12
    heading_max_chars: int = 110
    heading_max_digit_ratio: float = 0.35


THRESHOLDS = Thresholds()
