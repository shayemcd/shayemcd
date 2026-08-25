# shayemcd — Shaye Hopkins' Website

A JSON-driven personal academic/professional website: vanilla HTML/CSS/JS, no build step, deployable to GitHub Pages as-is. Adapted from the [cc-academic-website](https://github.com/mr-devs/cc-academic-website) template.

## Architecture (the one rule that matters)

The site is **multi-page** (no build step, no shared templating) — each page is a standalone HTML file that repeats the same header/footer/cookie-notice markup. **Repeatable, list-style content lives in `data/*.json`, never in HTML.** Each such section is rendered client-side by a matching `js/*.js` module via the `Site.load` helper in `js/utils.js`. A section whose data file is missing, empty, or malformed hides itself silently.

| Page | Section | Data file | Renderer |
| --- | --- | --- | --- |
| `index.html` (Home) | Hero (photo, headline, tagline, CTAs) | `data/profile.json` | `js/profile.js` |
| `index.html` (Home) | About (full bio) | `data/profile.json` | `js/profile.js` |
| `index.html` (Home) | Research Focus (teaser: tags linking to `research.html`) | `data/ongoing_projects.json` | `js/ongoing_projects.js` |
| `research.html` | Research Focus (full cards) | `data/ongoing_projects.json` | `js/ongoing_projects.js` |
| `research.html` | Publications | `data/publications.json` | `js/publications.js` |
| `research.html` | Working Papers | `data/working_papers.json` | `js/working_papers.js` |
| `research.html` | Manuscripts in Preparation (unlinked drafts) | `data/manuscripts_in_prep.json` | `js/manuscripts_in_prep.js` |
| `research.html` | Selected Popular Press | `data/media.json` | `js/media.js` |
| `cv.html` | Header (name, title, affiliation, contact links) | `data/profile.json` | `js/cv.js` |
| `cv.html` | Education | `data/education.json` | `js/education.js` |
| `cv.html` | Academic Experience | `data/employment.json` | `js/employment.js` |
| `cv.html` | Publications, Working Papers, Manuscripts in Preparation (numbered APA citations, not full cards) | same files as `research.html` | same renderers as `research.html` |
| `cv.html` | Selected Popular Press | `data/media.json` | `js/media.js` |
| `cv.html` | Presentations (Talks + Poster Presentations, grouped) | `data/talks.json` | `js/talks.js` |
| `cv.html` | Grants & Funding | `data/grants.json` | `js/grants.js` |
| `cv.html` | Teaching | `data/teaching.json` | `js/teaching.js` |
| `cv.html` | Skills | `data/skills.json` | `js/skills.js` |
| `cv.html` | Involvement & Achievements | `data/involvement.json` | `js/involvement.js` |
| `cv.html` | Memberships & Affiliations | `data/memberships.json` | `js/memberships.js` |
| `cv.html` | References (static "Available upon request.", not data-driven) | — | hardcoded in `cv.html` |

Publications/Working Papers/Manuscripts in Preparation share a two-tier filter bar (`js/paper-filters.js`) driven by each paper's `tags` (topic) and `subtopics` (finer-grained, reusable per topic, both can be multi-valued) fields — on both `research.html` and `cv.html`. The subtopic row is contextual: hidden until a topic is picked, then scoped to that topic's subtopics only, so the bar doesn't dump every subtopic across every topic on the visitor at once. On the CV, the filter also determines what prints (`[hidden]` applies under `@media print`), so it doubles as a way to produce a topic-tailored CV. `cv.html` also has an "on this page" table of contents (`js/cv-toc.js`) that jump-links to whichever sections actually ended up with data, built after every section has loaded.

`js/profile.js` reads `data/profile.json` once and renders into two containers on Home: `#hero-container` (always shown) and `#about-container` (hidden unless `bio` has entries). `data/education.json` is only used on `cv.html`, not Home — the Education section was dropped from `index.html`; see `schemas.md` for how to bring it back there too.

Every page also loads `js/site-chrome.js`, which reads `data/profile.json` to set `document.title` (using the page's `<body data-page-title="...">` attribute), the nav brand text (`#nav-name`), the footer copyright line (`#footer-name`), and the footer contact links (`#footer-links`, from `profile.json`'s `links` field — the same list `cv.html`'s header renders, minus any `"CV"` entry). Set `data-page-title` on every page except `index.html` (Home falls back to the profile title).

**Deliberate exception** — hand-written, not JSON-driven, because it isn't repeatable list content: `contact.html` (`#contact`, a Formspree form). Leave this as static HTML.

`cv.html` used to be a static Google Docs iframe embed (also a deliberate exception) but is now JSON-driven like every other page: it reuses `js/education.js`, `js/publications.js`, `js/working_papers.js`, `js/manuscripts_in_prep.js`, and `js/media.js` verbatim (same container IDs as `research.html`, so no new renderers needed for those), plus a small `js/cv.js` for the name/title/affiliation/contact-links header, sourced from `data/profile.json`'s `links` field. A "Print / Save as PDF" button (`window.print()`) plus an `@media print` block in `css/styles.css` replace the Google Doc's download/export feature. There is no `docs.google.com` reference left anywhere in the repo — the CV data files are the single source of truth now.

`Site.paperCard` (in `js/utils.js`) renders papers differently per page: on `research.html` it's the full portfolio card (tags, TL;DR/abstract toggles, data/code links); on `cv.html` (detected via the presence of `.cv-page`) it instead renders a numbered, hanging-indent APA-style citation with no tags/TL;DR/abstract/data links — just authors, year, title, venue, and the paper's own link. Numbering counts down from the total to 1 (most recent = highest number), via a native `<ol reversed>` on `cv.html`'s three paper containers (`research.html`'s stay plain `<div>`s) — the browser computes the count automatically, nothing to maintain by hand. `Site.boldenAuthors` bolds this site's own byline (matched via a "Hopkins, S." regex) wherever it appears in an author list — used by both paper renderers and `js/media.js`, on both `research.html` and `cv.html`.

`data/news.json` / `data/software.json` don't exist in this repo (an earlier version of this doc claimed they did, as unused hooks carried over from the upstream template — that was wrong; verify against the actual `data/` and `js/` directories before trusting a claim like that again). To add either: create the `data/*.json` file, a `<section>` + container `<div>` + `<script src="./js/*.js">` on the relevant page, and port/write the renderer — see `.claude/skills/update-site-data/references/schemas.md`.

Schemas are documented in `.claude/skills/update-site-data/references/schemas.md`. If you change a schema or renderer, update that file in the same session.

## Cookie notice

`js/cookie-notice.js` + the `#cookie-notice` markup (present on every page) is a small self-hosted banner — no third-party consent widget. Google Analytics (`gtag`) is injected dynamically only after the visitor clicks accept; consent is remembered in `localStorage`.

## Conventions

- Entries in data files go newest-first; match each file's existing indentation.
- No `docs/publications/` per-paper directories (unlike the upstream template) — publications and working papers link straight to their external `url` (DOI, journal page, preprint server).
- After editing any `data/*.json`, validate it: `python3 -m json.tool data/<file>.json`.

## Skills

- `/setup-site` — restyle the site from reference URLs, screenshots, or design notes (for a future redesign; initial design is already done).
- `/update-site-data` — add/convert papers, or add/edit media, education, research-focus, news, or profile entries.
- `/preview-site` — validate data files, serve locally (`python3 -m http.server`), and verify sections render.

## Preview

`python3 -m http.server 8000` from the repo root, then open `http://127.0.0.1:8000/`. Opening `index.html` via `file://` will NOT work — `fetch` needs HTTP.

## Publication automation

- `scripts/fetch_abstracts.py` — fills in missing `abstract` fields on existing `publications.json`/`working_papers.json` entries (Crossref/DataCite/meta-tag scrape). Writes candidates to `scripts/abstracts-preview.json` (gitignored) for manual review; never edits `data/*.json` directly.
- `scripts/sync_openalex.py` — discovers new works via [OpenAlex](https://openalex.org), queried by Shaye's ORCID iD (`0000-0002-3560-7393`), that aren't yet in any of the three paper data files (matched by DOI, falling back to normalized title). Writes candidates to `scripts/openalex-preview.json` for manual review; never edits `data/*.json` directly — a human still has to choose Publications vs. Working Papers, reformat authors to house style, and add real `tags`/`subtopics`.
- `.github/workflows/sync-publications.yml` runs `sync_openalex.py` weekly (Mondays, also triggerable via `workflow_dispatch`) and opens a PR containing `scripts/openalex-preview.json` when it finds something new — nothing is auto-merged or auto-published. Both scripts need real internet access and won't run inside a sandboxed Claude Code session with restricted egress; that's expected, not a bug.
