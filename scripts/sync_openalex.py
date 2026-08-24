#!/usr/bin/env python3
"""
Finds publications on OpenAlex (https://openalex.org), keyed by Shaye's ORCID
iD, that aren't yet in data/publications.json, data/working_papers.json, or
data/manuscripts_in_prep.json.

Run locally or via .github/workflows/sync-publications.yml (needs real
internet access — this won't work from a sandboxed Claude Code session with
restricted egress):

    python3 scripts/sync_openalex.py

This is a *discovery* tool, not a publisher: it never edits data/*.json
directly. New/unmatched works are written to scripts/openalex-preview.json
for manual review — a human still decides which data file an entry belongs
in (Publications vs. Working Papers) and adds the site's own `tags` /
`subtopics` / house-style author formatting, none of which OpenAlex knows.
Nothing is written if there's nothing new to report.

No third-party dependencies; standard library only.
"""
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORCID = "0000-0002-3560-7393"
KNOWN_PAPER_FILES = [
    ROOT / "data" / "publications.json",
    ROOT / "data" / "working_papers.json",
    ROOT / "data" / "manuscripts_in_prep.json",
]
OUTPUT_FILE = Path(__file__).resolve().parent / "openalex-preview.json"

USER_AGENT = "Mozilla/5.0 (compatible; PersonalSiteOpenAlexSync/1.0; mailto:shaye.mcd@gmail.com)"
API_URL = (
    f"https://api.openalex.org/works"
    f"?filter=author.orcid:{ORCID}"
    f"&per-page=200"
    f"&mailto=shaye.mcd@gmail.com"
)
TIMEOUT = 20

DOI_RE = re.compile(r"^https?://(dx\.)?doi\.org/(.+)$", re.IGNORECASE)


def extract_doi(url):
    if not url:
        return None
    match = DOI_RE.match(url.strip())
    return match.group(2).lower() if match else None


def normalize_title(title):
    return re.sub(r"[^a-z0-9]+", " ", (title or "").lower()).strip()


def load_known_papers():
    known_dois = set()
    known_titles = set()
    for path in KNOWN_PAPER_FILES:
        if not path.exists():
            continue
        for paper in json.loads(path.read_text()):
            doi = extract_doi(paper.get("url", ""))
            if doi:
                known_dois.add(doi)
            known_titles.add(normalize_title(paper.get("title", "")))
    return known_dois, known_titles


def fetch_openalex_works():
    req = urllib.request.Request(API_URL, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        data = json.loads(resp.read().decode("utf-8", errors="replace"))
    return data.get("results", [])


def reconstruct_abstract(inverted_index):
    if not inverted_index:
        return None
    max_pos = max(pos for positions in inverted_index.values() for pos in positions)
    words = [None] * (max_pos + 1)
    for word, positions in inverted_index.items():
        for pos in positions:
            words[pos] = word
    return " ".join(w for w in words if w) or None


def describe_work(work):
    authorships = work.get("authorships") or []
    authors = ", ".join(a.get("author", {}).get("display_name", "") for a in authorships if a.get("author"))

    source = (work.get("primary_location") or {}).get("source") or {}
    venue = source.get("display_name")

    doi_url = work.get("doi")  # already a full https://doi.org/... URL, or None
    landing = (work.get("primary_location") or {}).get("landing_page_url")

    return {
        "title": work.get("display_name") or work.get("title"),
        "authors_raw": authors,
        "venue": venue,
        "year": str(work.get("publication_year") or ""),
        "type": work.get("type"),
        "url": doi_url or landing,
        "abstract": reconstruct_abstract(work.get("abstract_inverted_index")),
        "note": "Auto-discovered from OpenAlex — needs house-style author formatting, "
        "a choice of data/publications.json vs. data/working_papers.json, "
        "and real tags/subtopics before merging. Delete this file once reviewed.",
    }


def main():
    known_dois, known_titles = load_known_papers()

    try:
        works = fetch_openalex_works()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as exc:
        print(f"Failed to query OpenAlex: {exc}", file=sys.stderr)
        sys.exit(1)

    new_entries = []
    for work in works:
        doi = extract_doi(work.get("doi"))
        title = normalize_title(work.get("display_name") or work.get("title"))
        if doi and doi in known_dois:
            continue
        if not doi and title in known_titles:
            continue
        new_entries.append(describe_work(work))

    if new_entries:
        OUTPUT_FILE.write_text(json.dumps(new_entries, indent=2) + "\n")
        print(f"{len(new_entries)} new work(s) found — wrote {OUTPUT_FILE.relative_to(ROOT)}", file=sys.stderr)
        for entry in new_entries:
            print(f"  - {entry['title']}", file=sys.stderr)
    else:
        if OUTPUT_FILE.exists():
            OUTPUT_FILE.unlink()
        print("No new works found on OpenAlex beyond what's already in data/.", file=sys.stderr)


if __name__ == "__main__":
    main()
