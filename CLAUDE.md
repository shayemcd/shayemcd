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
| `cv.html` | Education, Publications, Working Papers, Manuscripts in Preparation, Selected Popular Press | same files as `research.html` | same renderers as `research.html` |

Publications/Working Papers/Manuscripts in Preparation share a tag filter bar (`js/paper-filters.js`) driven by each paper's `tags` field — on `research.html` only; `cv.html` doesn't load `paper-filters.js`, since filtering doesn't make sense on a print/PDF CV.

`js/profile.js` reads `data/profile.json` once and renders into two containers on Home: `#hero-container` (always shown) and `#about-container` (hidden unless `bio` has entries). `data/education.json` / `js/education.js` currently aren't wired into any page — the Education section was dropped from Home; see `schemas.md` for how to bring it back.

Every page also loads `js/site-chrome.js`, which reads `data/profile.json` to set `document.title` (using the page's `<body data-page-title="...">` attribute), the nav brand text (`#nav-name`), and the footer copyright line (`#footer-name`). Set `data-page-title` on every page except `index.html` (Home falls back to the profile title).

**Deliberate exception** — hand-written, not JSON-driven, because it isn't repeatable list content: `contact.html` (`#contact`, a Formspree form). Leave this as static HTML.

`cv.html` used to be a static Google Docs iframe embed (also a deliberate exception) but is now JSON-driven like every other page: it reuses `js/education.js`, `js/publications.js`, `js/working_papers.js`, `js/manuscripts_in_prep.js`, and `js/media.js` verbatim (same container IDs as `research.html`, so no new renderers needed for those), plus a small `js/cv.js` for the name/title/affiliation/contact-links header, sourced from `data/profile.json`'s `links` field. A "Print / Save as PDF" button (`window.print()`) plus an `@media print` block in `css/styles.css` replace the Google Doc's download/export feature. There is no `docs.google.com` reference left anywhere in the repo — the CV data files are the single source of truth now.

`data/news.json`, `data/talks.json`, `data/software.json`, `data/teaching.json` exist as unused hooks carried over from the template — no section markup or script tag currently references them. See `.claude/skills/update-site-data/references/schemas.md` for how to wire one back in if needed.

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
