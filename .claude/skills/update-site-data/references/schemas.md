# Data File Schemas

Schemas and examples for every file under `data/`. This site was adapted from the [cc-academic-website](https://github.com/mr-devs/cc-academic-website) template: it's a single page (not the template's multi-section page skeleton is the same, but there's no `docs/publications/` per-paper directory convention here — entries link straight to external URLs), and it adds two sections (`media`, `education`) the upstream template doesn't have.

> **Note:** This describes the schema as last recorded. If the live `data/*.json` files and `js/*.js` renderers diverge from this file, they are ground truth — follow the code and update this file to match.

## data/profile.json — name, bio, links

Object. Rendered by `js/profile.js` into two sections on Home (`index.html`): the hero (`#hero-container`, always shown) and About (`#about-container`, shown when `bio` has entries). Also rendered by `js/cv.js` into the CV header on `cv.html`. `js/site-chrome.js` separately reads this file on every page to set the page title, nav brand name, and footer copyright.

```json
{
  "name": "Shaye Hopkins",
  "title": "PhD Candidate, Behavioral Scientist",
  "affiliation": "Vienna University of Economics and Business (WU Vienna)",
  "photoPath": "./assets/images/shaye-hopkins-portrait.jpg",
  "tagline": "Short 1-2 sentence hero lede.",
  "bio": ["First paragraph.", "Second paragraph.", "Third paragraph."],
  "links": [
    { "label": "LinkedIn", "url": "https://www.linkedin.com/in/shaye-hopkins/" },
    { "label": "Email", "url": "mailto:shaye.mcd@gmail.com" },
    { "label": "CV", "url": "https://..." }
  ]
}
```

- `tagline` renders as the hero's `lede` paragraph, under the "Shaye Hopkins." headline. Optional — the hero still renders without it.
- `bio` is an array of paragraphs rendered in the About section further down Home. Optional — About stays hidden if empty/absent.
- Optional: `photoPath` (omit to render without a photo).
- `links` is rendered by `js/cv.js` as the contact-links line under the name on `cv.html` (Home's nav/footer still hardcode LinkedIn/Email separately). A `{ "label": "CV", ... }` entry is filtered out by `js/cv.js` if present, to avoid a self-referential link on the CV page itself — don't add one back.

## data/education.json — education timeline

Array, newest first. Rendered by `js/education.js` into the Education section on `cv.html` (`#education-container`). Not used on Home — the Education section was dropped from `index.html`; to add it there too, add a `<div id="education-container" class="item-list">` + `<script src="./js/education.js">` to `index.html` (e.g. under the About section).

```json
{
  "degree": "PhD, Economic & Social Sciences",
  "institution": "WU Vienna",
  "term": "2025–present",
  "description": "Focus: Bridging Divides: personalization, belief updating, and trust."
}
```

- Optional: `description`.

## data/publications.json — published papers

Array, ordered by year (newest first). Rendered by `js/publications.js`, via the shared `Site.paperCard` helper in `js/utils.js`.

```json
{
  "title": "Politricks: Teaching political tricks and discernment through active and passive tools",
  "authors": "Hopkins, S. A. M., Rayburn-Reeves, R. M., ...",
  "publication": "PNAS Nexus, 4(8), pgaf245",
  "year": "2025",
  "url": "https://doi.org/10.1093/pnasnexus/pgaf245",
  "tags": ["Misinformation, Trust & Polarization"],
  "subtopics": ["Media Literacy & Discernment Tools"],
  "abstract": "Full abstract text, verbatim from the paper."
}
```

- `year` is a string. `url` is the canonical DOI/publisher link.
- Optional: `pdfPath`, `bibPath` (links only render when present) — unused in this repo since there's no local `docs/publications/` directory; every entry links out via `url` instead.
- Optional: `tags` (array of strings) and `subtopics` (array of strings) — a two-tier taxonomy. Both render as pills on the card (`tags` filled, `subtopics` outlined) and feed the two-tier filter bar (`js/paper-filters.js`, two rows: `#tag-filter-bar` for topic, `#subtopic-filter-bar` for subtopic) above the Publications/Working Papers/Manuscripts in Preparation sections — present on both `research.html` and `cv.html`. Selecting a topic and a subtopic filters with AND logic (a paper must match both); "All" on either row leaves that facet unconstrained. On `cv.html`, filtering also determines what prints, since `[hidden]` applies under print media too — filter down to a subset before hitting "Print / Save as PDF" to produce a topic-tailored CV. By convention `tags` values match the `ongoing_projects.json` research-focus titles; `subtopics` are finer-grained, one clear label per paper's specific angle. Never invent values that don't reflect the paper's actual topic.
- Optional: `abstract`. When present, the card gets a "Show abstract" toggle that reveals this text (expanded by default in print, since the toggle itself doesn't work on a printed page). Use the paper's real, verbatim abstract — never a paraphrase or placeholder. Omit the field entirely if you don't have the real text yet (the toggle simply doesn't render).

## data/working_papers.json — preprints / under review

Array, newest first. Rendered by `js/working_papers.js`, via the same `Site.paperCard` helper. Same shape as `publications.json` (including optional `tags` and `abstract`, see above); `publication` is used as a status note (e.g. `"Under review, SSRN"`) rather than a journal name.

```json
{
  "title": "Dialogues on Democracy: Belief-Tailored AI Conversations Reduce Inaccurate Election Denial Beliefs",
  "authors": "Hopkins, S., Costello, T., Pennycook, G., & Rand, D.",
  "publication": "Under review, Research Square",
  "year": "2026",
  "url": "https://doi.org/10.21203/rs.3.rs-8663921/v1",
  "tags": ["Misinformation, Trust & Polarization"],
  "subtopics": ["AI-Mediated Interventions"]
}
```

- Optional: `publication`, `year`.

## data/manuscripts_in_prep.json — unpublished drafts (extension, not in upstream template)

Array. Rendered by `js/manuscripts_in_prep.js` (also via `Site.paperCard`) as the "Manuscripts in Preparation" section on `research.html`, right after Working Papers. For drafts that don't have a preprint/DOI/URL yet — `Site.paperCard` renders the title as plain text (no link) when `url` is absent, so entries here are intentionally unclickable.

```json
{
  "title": "Life Doesn’t Have To Be About Pain: The Path To Joyful Expertise",
  "authors": "Hopkins, S., Rush, M., Fox, K., ...",
  "publication": "Manuscript in preparation",
  "tags": ["Well-being"]
}
```

- No `url` or `year` — these are pre-submission drafts. Once a manuscript gets a preprint/DOI, move its entry to `working_papers.json` and add `url`.
- Optional: `tags`, `abstract` (same conventions as `publications.json`/`working_papers.json` above).

## data/media.json — popular press (extension, not in upstream template)

Array, newest first. Rendered by `js/media.js` as the "Selected Popular Press" section.

```json
{
  "title": "Why gratitude and support are the missing pieces in workplace well-being",
  "authors": "Hopkins, S. & Shah, K.",
  "outlet": "Employee Benefits News",
  "date": "2025-04-10",
  "url": "https://..."
}
```

- `date` is `YYYY-MM-DD`. Optional: `authors`, `outlet`.

## data/ongoing_projects.json — "Research Focus" cards / Home teaser tags

Array. Currently used for the three research-focus themes (Misinformation/Trust/Polarization, Well-being, Sustainability) rather than literal ongoing-project updates — treat as a general "research themes" list.

```json
{
  "title": "Misinformation, Trust & Polarization",
  "description": "Studying how false beliefs form and persist..."
}
```

`js/ongoing_projects.js` renders this file twice, differently per page (both from the same data, so there's one place to edit topic names):
- `research.html`'s `#projects-container` gets the full cards (`title` + `description`).
- `index.html`'s `#research-teaser-container` gets a compact row of `title`-only tags (class `tag-link`) linking to `research.html#research` — `description` isn't used there. The teaser's lede sentence is static HTML in `index.html`, not data-driven, since it's a one-off sentence rather than repeatable list content.

`title` values double as the `tags` used to filter Publications/Working Papers (see below) — keep them in sync if you rename one.

## data/news.json — news items (currently empty, section hidden)

Array of year groups, newest year first; items within a year are newest first. Rendered by `js/news.js` — **not currently wired into any page/loaded by any script tag.** To use it: add a `<section id="news">` + `<script src="./js/news.js">` back to the relevant page (`research.html` is the natural fit; see the upstream template or git history), then populate this file.

```json
{
  "year": "2026",
  "items": [
    {
      "type": "Preprint",
      "htmltext": "New preprint: <a href='https://doi.org/...' target='_blank'>Paper Title</a>."
    }
  ]
}
```

- `type` is one of: `Publication`, `Preprint`, `Talk`, `Award`, `Media`, `Tool`, `General`.
- `htmltext` conventions: single-quoted HTML attributes; links as `<a href='URL' target='_blank'>`; `<em>` for venues; `<code>` for software names. 1–2 sentences, professional tone, emojis only for big milestones.

## data/talks.json, data/software.json, data/teaching.json — not currently used

These files/renderers exist in the upstream template but are not part of this site's current design (no data files, no section markup, no script tags). If you want one of these sections, create the `data/*.json` file, add a `<section>` + container `<div>` to the relevant page (likely `research.html`), add the matching `<script src="./js/*.js">` tag, and port the renderer JS from the [upstream template](https://github.com/mr-devs/cc-academic-website/tree/main/js) — then document its schema here.

## docs/publications/ directory convention — not used in this repo

The upstream template stores a PDF + `cite.bib` per paper under `docs/publications/`. This repo skips that; every publication/working-paper entry links straight to its external URL (DOI, journal page, preprint server) via the `url` field.
