#!/usr/bin/env python3
"""
Fetches candidate abstract text for papers in data/publications.json and
data/working_papers.json that don't have an "abstract" field yet.

Run locally (needs real internet access — this won't work from a sandboxed
Claude Code session with restricted egress):

    python3 scripts/fetch_abstracts.py

Tries, per paper, in order: Crossref (works for most publisher/preprint
DOIs), DataCite (works for OSF/PsyArXiv DOIs), then a generic <meta> tag
scrape of the paper's URL. Writes everything found to
scripts/abstracts-preview.json for you to review — it does NOT touch
data/*.json directly, since scraped text can be incomplete or wrong and
should be checked against the real abstract before publishing.

No third-party dependencies; standard library only.
"""
import html
import json
import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILES = [ROOT / "data" / "publications.json", ROOT / "data" / "working_papers.json"]
OUTPUT_FILE = Path(__file__).resolve().parent / "abstracts-preview.json"

USER_AGENT = "Mozilla/5.0 (compatible; PersonalSiteAbstractFetcher/1.0; mailto:shaye.mcd@gmail.com)"
TIMEOUT = 15

DOI_RE = re.compile(r"^https?://(dx\.)?doi\.org/(.+)$", re.IGNORECASE)


def extract_doi(url):
    match = DOI_RE.match(url.strip())
    return match.group(2) if match else None


def clean_text(text):
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def http_get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def http_get_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        content_type = resp.headers.get("Content-Type", "")
        if "text/html" not in content_type and "xml" not in content_type:
            return None
        return resp.read().decode("utf-8", errors="replace")


def try_crossref(doi):
    try:
        data = http_get_json(f"https://api.crossref.org/works/{doi}")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
        return None
    abstract = data.get("message", {}).get("abstract")
    return clean_text(abstract) if abstract else None


def try_datacite(doi):
    try:
        data = http_get_json(f"https://api.datacite.org/dois/{doi}")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
        return None
    descriptions = data.get("data", {}).get("attributes", {}).get("descriptions", [])
    for d in descriptions:
        if (d.get("descriptionType") or "").lower() == "abstract":
            return clean_text(d.get("description", ""))
    if descriptions:
        return clean_text(descriptions[0].get("description", ""))
    return None


class MetaTagParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}

    def handle_starttag(self, tag, attrs):
        if tag != "meta":
            return
        attrs_dict = dict(attrs)
        name = (attrs_dict.get("name") or attrs_dict.get("property") or "").lower()
        content = attrs_dict.get("content")
        if name and content and name not in self.meta:
            self.meta[name] = content


META_KEYS_PRIORITY = [
    "citation_abstract",
    "dc.description",
    "dcterms.abstract",
    "og:description",
    "description",
]


def try_meta_scrape(url):
    if url.lower().endswith(".pdf"):
        return None
    try:
        page = http_get_text(url)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return None
    if not page:
        return None
    parser = MetaTagParser()
    try:
        parser.feed(page)
    except Exception:
        return None
    for key in META_KEYS_PRIORITY:
        if key in parser.meta:
            return clean_text(parser.meta[key])
    return None


def fetch_abstract(paper):
    url = paper.get("url", "")
    doi = extract_doi(url)

    if doi:
        abstract = try_crossref(doi)
        if abstract:
            return abstract, "crossref"
        abstract = try_datacite(doi)
        if abstract:
            return abstract, "datacite"

    if url.lower().endswith(".pdf"):
        return None, "pdf-no-metadata"

    abstract = try_meta_scrape(url)
    if abstract:
        return abstract, "meta-scrape"

    return None, "not-found"


def main():
    results = []
    total = 0
    found = 0

    for path in DATA_FILES:
        if not path.exists():
            continue
        papers = json.loads(path.read_text())
        for paper in papers:
            if paper.get("abstract"):
                continue  # already has one — leave it alone
            total += 1
            title = paper.get("title", "(untitled)")
            url = paper.get("url", "")
            print(f"Fetching: {title[:70]}...", file=sys.stderr)
            abstract, source = fetch_abstract(paper)
            if abstract:
                found += 1
            results.append({
                "file": path.name,
                "title": title,
                "url": url,
                "source": source,
                "abstract": abstract,
            })

    OUTPUT_FILE.write_text(json.dumps(results, indent=2))

    print(f"\n{found}/{total} abstracts found. Review {OUTPUT_FILE.relative_to(ROOT)} before merging.")
    for r in results:
        status = r["source"] if r["abstract"] else f"NOT FOUND ({r['source']})"
        print(f"  - [{status}] {r['title'][:70]}")


if __name__ == "__main__":
    main()
