#!/usr/bin/env python3
"""
sync.py — Content sync script for The Portfolio

Usage:
  python3 sync.py           # sync + commit + push
  python3 sync.py --dry-run # preview changes without writing anything
"""

import json
import os
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).parent
DRY_RUN = "--dry-run" in sys.argv


# ── HTML metadata extraction ──────────────────────────────────────────────────

class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def extract_title(html_path: Path) -> str:
    parser = TitleParser()
    parser.feed(html_path.read_text(encoding="utf-8", errors="ignore"))
    title = parser.title.strip()
    # Strip common suffixes added by report generator
    for suffix in [" — Market Research OS", " · 安祖羊", " | 安祖羊"]:
        if title.endswith(suffix):
            title = title[: -len(suffix)].strip()
    return title


def date_from_filename(filename: str) -> str:
    """Extract YYYY-MM-DD from filenames like 2026-06-09-some-title.html"""
    m = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
    return m.group(1) if m else ""


# ── JSON sync ─────────────────────────────────────────────────────────────────

def sync_reports() -> list[str]:
    """Returns list of change descriptions."""
    json_path = ROOT / "reports" / "reports.json"
    existing = json.loads(json_path.read_text(encoding="utf-8"))
    existing_files = {e["filename"] for e in existing}

    html_files = sorted(
        [f for f in (ROOT / "reports").glob("*.html") if f.name != "index.html"],
        key=lambda f: f.name,
        reverse=True,  # newest first
    )

    new_entries = []
    changes = []

    for f in html_files:
        if f.name not in existing_files:
            title = extract_title(f)
            date = date_from_filename(f.name)
            entry = {
                "filename": f.name,
                "title": title,
                "title_zh": title,
                "date": date,
            }
            new_entries.append(entry)
            changes.append(f"  + reports/{f.name}")
            print(f"  NEW report: {f.name}")
            print(f"    title: {title}")
            print(f"    date:  {date}")

    if new_entries:
        updated = new_entries + existing
        if not DRY_RUN:
            json_path.write_text(
                json.dumps(updated, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
    return changes


def sync_articles() -> tuple[list[str], list[str]]:
    """
    Returns (auto_changes, needs_review).
    Articles with no existing entry get a stub — manual metadata still required
    for excerpt, track, and tags.
    """
    json_path = ROOT / "articles" / "articles.json"
    existing = json.loads(json_path.read_text(encoding="utf-8"))
    existing_files = {e["filename"] for e in existing}

    html_files = sorted(
        [f for f in (ROOT / "articles").glob("*.html") if f.name != "index.html"],
        key=lambda f: f.name,
        reverse=True,
    )

    new_entries = []
    auto_changes = []
    needs_review = []

    for f in html_files:
        if f.name not in existing_files:
            title = extract_title(f)
            date = date_from_filename(f.name)
            entry = {
                "filename": f.name,
                "title": title,
                "title_zh": title,
                "title_en": "",
                "date": date,
                "track": "",
                "track_en": "",
                "excerpt_zh": "",
                "excerpt_en": "",
                "tags": [],
            }
            new_entries.append(entry)
            auto_changes.append(f"  + articles/{f.name}")
            needs_review.append(f.name)
            print(f"  NEW article: {f.name}")
            print(f"    title: {title}")
            print(f"    date:  {date}")
            print(f"    ** Needs metadata: title_en, excerpt_zh, excerpt_en, track, tags")

    if new_entries:
        updated = new_entries + existing
        if not DRY_RUN:
            json_path.write_text(
                json.dumps(updated, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
    return auto_changes, needs_review


# ── Git ───────────────────────────────────────────────────────────────────────

def git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"git {' '.join(args)} failed:\n{result.stderr.strip()}")
        sys.exit(1)
    return result.stdout.strip()


def push_changes(report_changes: list[str], article_changes: list[str]) -> None:
    all_changes = report_changes + article_changes
    if not all_changes:
        return

    files_to_stage = []
    if report_changes:
        files_to_stage.append("reports/reports.json")
    if article_changes:
        files_to_stage.append("articles/articles.json")

    git("add", *files_to_stage)

    n_reports = len(report_changes)
    n_articles = len(article_changes)
    parts = []
    if n_reports:
        parts.append(f"{n_reports} report{'s' if n_reports > 1 else ''}")
    if n_articles:
        parts.append(f"{n_articles} article{'s' if n_articles > 1 else ''}")
    msg = f"sync: add {' and '.join(parts)} to index"

    git("commit", "-m", msg)
    print(f"\n  Committed: {msg}")

    print("  Fetching remote…")
    git("fetch", "origin")
    git("rebase", "origin/main")
    git("push")
    print("  Pushed to GitHub.")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if DRY_RUN:
        print("DRY RUN — no files will be written.\n")

    print("Scanning reports…")
    report_changes = sync_reports()

    print("\nScanning articles…")
    article_changes, needs_review = sync_articles()

    if not report_changes and not article_changes:
        print("\nNothing new. JSON indexes are up to date.")
        return

    print(f"\nChanges detected:")
    for c in report_changes + article_changes:
        print(c)

    if needs_review:
        print(f"\n⚠  Articles need metadata before the site shows them fully:")
        for f in needs_review:
            print(f"   articles/articles.json → find '{f}', fill in title_en, excerpt_zh, excerpt_en, track, tags")

    if DRY_RUN:
        print("\nDry run complete. Run without --dry-run to apply.")
        return

    if needs_review:
        ans = input("\nArticle stubs added. Push now with empty metadata, or fill in first? [push/fill] ").strip().lower()
        if ans != "push":
            print("Skipping push. Fill in the metadata in articles/articles.json, then run sync.py again.")
            return

    push_changes(report_changes, article_changes)
    print("\nDone. Vercel will redeploy in ~1 minute.")


if __name__ == "__main__":
    main()
