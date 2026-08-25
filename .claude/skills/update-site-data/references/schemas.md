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
    { "label": "ORCID", "url": "https://orcid.org/0000-0002-3560-7393" },
    { "label": "Google Scholar", "url": "https://scholar.google.com/citations?..." },
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

## data/employment.json — professional/academic experience

Array, newest-ending-first (an ongoing "present" role goes first, then most recent end date). Rendered by `js/employment.js` into the "Academic Experience" section on `cv.html` (`#employment-container`). Not used anywhere else.

```json
{
  "role": "Teaching & Research Associate",
  "institution": "Vienna University of Economics & Business, Vienna, AT",
  "term": "2025–present"
}
```

- `institution` conventionally includes the city/country, since there's no separate location field.

## data/publications.json — published papers

Array. `js/publications.js` sorts entries by `year` (newest first, via `Site.sortByYear` in `js/utils.js`) before rendering, so display order doesn't depend on the file's entry order — but keep new entries roughly newest-first in the file too, for readability and because `Site.sortByYear` falls back to file order as a stable tiebreak between same-year entries. Rendered via the shared `Site.paperCard` helper in `js/utils.js`. `Site.paperCard` renders differently per page: the full card described below on `research.html`, or a numbered APA-style citation (authors, year, title, venue, link only — no tags/tldr/abstract/data links) on `cv.html`, via `Site.paperCitation` — see the note at the end of this section. Everywhere an `authors` string is rendered (both card modes, plus `js/media.js`), `Site.boldenAuthors` bolds this site owner's own byline within it — matched under either surname it's been published under, "Hopkins, S." (current) or "McDonald, S." (before a name change), see the note under `media.json` below.

```json
{
  "title": "Politricks: Teaching political tricks and discernment through active and passive tools",
  "authors": "Hopkins, S. A. M., Rayburn-Reeves, R. M., ...",
  "publication": "PNAS Nexus, 4(8), pgaf245",
  "year": "2025",
  "url": "https://doi.org/10.1093/pnasnexus/pgaf245",
  "tags": ["Misinformation, Trust & Polarization"],
  "subtopics": ["Discernment & Correction Tools"],
  "tldr": "One or two plain-language sentences on what the study found — no jargon, written for a general reader.",
  "abstract": "Full abstract text, verbatim from the paper.",
  "dataUrl": "https://osf.io/...",
  "codeUrl": "https://github.com/..."
}
```

- `year` is a string. `url` is the canonical DOI/publisher link.
- Optional: `pdfPath`, `bibPath` (links only render when present) — unused in this repo since there's no local `docs/publications/` directory; every entry links out via `url` instead.
- Optional: `tldr` — a short (1-2 sentence) plain-language synthesis of the paper. Like `abstract`, it's collapsed behind its own "Show TL;DR" toggle; on `cv.html`, it's force-printed regardless of toggle state since it's more useful on a printed CV than the dense academic abstract, which stays hidden in print. This is the "what's this paper actually about" line for a non-academic visitor; it should paraphrase in plain English, not restate the abstract's jargon (and isn't necessarily drawn from the academic `abstract` — an executive summary or report conclusion works too, see the Fresh Start Effect entry in `working_papers.json`). Omit if you don't have one yet — the card renders fine without it.
- The links row is ordered: PDF, BibTeX, Show abstract, Show TL;DR, Data & Code, Code.
- Optional: `dataUrl`, `codeUrl` — links to the paper's public data and code (OSF, Dataverse, GitHub, etc.). `dataUrl` renders as "Data & Code" since data and code typically live in one combined repo (e.g. an OSF project); `codeUrl` is only for the rare paper with a separate code repo, and renders as an additional "Code" link alongside it. Only add real, working links — never a placeholder or a guess at where a repo "should" be.
- Optional: `tags` (array of strings) and `subtopics` (array of strings) — a two-tier taxonomy. A paper can carry more than one value in either array when it genuinely spans themes (e.g. the Messengers working paper is tagged both `"Discernment & Correction Tools"` and `"Trust & Cooperation"`) — don't force a single value where two apply. Both render as pills on the card (`tags` filled, `subtopics` outlined) and feed the two-tier filter bar (`js/paper-filters.js`, two rows: `#tag-filter-bar` for topic, `#subtopic-filter-bar` for subtopic) above the Publications/Working Papers/Manuscripts in Preparation/Selected Popular Press sections — present on both `research.html` and `cv.html`. `media.json` entries use the same `tags`/`subtopics` fields and are folded into this same filter (see the note under `media.json` below). The subtopic row is **contextual**: it stays hidden until a specific topic is selected, then repopulates with only the subtopics that actually occur under that topic (this keeps the filter bar from listing every subtopic across every topic at once as the taxonomy grows). Selecting a topic and a subtopic filters with AND logic (an item must match both); "All" on either row leaves that facet unconstrained. On `cv.html`, filtering also determines what prints, since `[hidden]` applies under print media too — filter down to a subset before hitting "Print / Save as PDF" to produce a topic-tailored CV.
  - `tags` values match the `ongoing_projects.json` research-focus titles.
  - `subtopics` are a **shared, reusable vocabulary per topic** — not a one-off restatement of a single paper's title. Pick from (or extend, if a paper genuinely doesn't fit any) the current set: under *Misinformation, Trust & Polarization* — `"Discernment & Correction Tools"`, `"Trust & Cooperation"`, `"Personality & Individual Differences"`, `"Polarization Patterns"`; under *Sustainability* — `"Transportation & Commuting Behavior"`, `"Framing & Motivation"`; under *Well-being* — `"Financial Well-being"`, `"Workplace Well-being"`. Before adding a new subtopic, check whether an existing one already fits — a subtopic that only ever holds one paper defeats the point of the filter (it can't narrow anything down). Never invent values that don't reflect the paper's actual topic.
- Optional: `abstract`. When present, the card gets a "Show abstract" toggle that reveals this text (expanded by default in print, since the toggle itself doesn't work on a printed page). Use the paper's real, verbatim abstract — never a paraphrase or placeholder. Omit the field entirely if you don't have the real text yet (the toggle simply doesn't render).
- **On `cv.html`**, none of the above rendering applies to `tags`/`subtopics`/`tldr`/`abstract`/`dataUrl`/`codeUrl`/`pdfPath`/`bibPath` — `Site.paperCitation` only reads `authors`, `year`, `title`, `publication`, and `url` to build one line: `{authors, self bolded} ({year or "n.d."}). {title}. {publication, italicized, or "Manuscript in preparation." if publication is absent}. {url, shown as the literal link text}`. `tags`/`subtopics` are still attached as (unrendered) `data-` attributes so the topic/subtopic filter bar keeps working — filtering still determines what prints, same as before. `Site.paperCitation` renders an `<li>` (not `<article>`) because on `cv.html` (only) `publications-container`/`working-papers-container`/`manuscripts-container` are `<ol reversed>` elements — the browser numbers each list top-down from its total entry count to 1, so the most recent entry (stored first, newest-first) always gets the highest number, with no counting logic to maintain as entries are added/removed. Each of the three sections numbers independently (1 to N within that section, not continuing across sections).

## data/working_papers.json — preprints / under review

Array, sorted by `year` (newest first) at render time — same as `publications.json` above. Rendered by `js/working_papers.js`, via the same `Site.paperCard` helper. Same shape as `publications.json` (including optional `tags`, `abstract`, `tldr`, `dataUrl`, `codeUrl`, see above); `publication` is used as a status note (the host name only, e.g. `"SSRN"`) rather than a journal name.

```json
{
  "title": "Dialogues on Democracy: Belief-Tailored AI Conversations Reduce Inaccurate Election Denial Beliefs",
  "authors": "Hopkins, S., Costello, T., Pennycook, G., & Rand, D.",
  "publication": "Research Square",
  "year": "2026",
  "url": "https://doi.org/10.21203/rs.3.rs-8663921/v1",
  "tags": ["Misinformation, Trust & Polarization"],
  "subtopics": ["AI-Mediated Interventions"]
}
```

- Optional: `publication`, `year`.
- `publication` is just the host/repository name (e.g. `"SSRN"`, `"OSF"`, `"PsyArXiv"`) — don't prefix it with "Under review, "; the Working Papers section intro on `research.html`/`cv.html` already states that everything in this file is under review, so repeating it on every card is redundant. An entry that isn't actually under review (e.g. a completed report) should say so plainly instead, e.g. `"Center for Advanced Hindsight, report"`.

## data/manuscripts_in_prep.json — unpublished drafts (extension, not in upstream template)

Array. Rendered by `js/manuscripts_in_prep.js` (also via `Site.paperCard`) as the "Manuscripts in Preparation" section on `research.html`, right after Working Papers. For drafts that don't have a preprint/DOI/URL yet — `Site.paperCard` renders the title as plain text (no link) when `url` is absent, so entries here are intentionally unclickable.

```json
{
  "title": "Life Doesn’t Have To Be About Pain: The Path To Joyful Expertise",
  "authors": "Hopkins, S., Rush, M., Fox, K., ...",
  "tags": ["Well-being"]
}
```

- No `url`, `year`, or `publication` — these are pre-submission drafts. The section heading and intro already say "Manuscripts in Preparation, not yet submitted for review," so repeating that status on every card via `publication` would be redundant; leave the field out. Once a manuscript gets a preprint/DOI, move its entry to `working_papers.json`, add `url`, and add a real `publication` status there (see below). On `cv.html`'s citation view, the missing `publication` is what triggers the automatic "Manuscript in preparation." text (see the `Site.paperCitation` note under `publications.json` above) — no need to add that phrase to the data yourself.
- Optional: `tags`, `abstract`, `tldr`, `dataUrl`, `codeUrl` (same conventions as `publications.json`/`working_papers.json` above).

## data/media.json — popular press (extension, not in upstream template)

Array, newest first. Rendered by `js/media.js` as the "Selected Popular Press" section.

```json
{
  "title": "Why gratitude and support are the missing pieces in workplace well-being",
  "authors": "Hopkins, S. & Shah, K.",
  "outlet": "Employee Benefits News",
  "date": "2025-04-10",
  "url": "https://...",
  "tags": ["Well-being"],
  "subtopics": ["Workplace Well-being"]
}
```

- `date` is `YYYY-MM-DD`. Optional: `authors`, `outlet`, `tags`, `subtopics`, `cvOnly`.
- Preserve the byline as actually published, even across a name change (e.g. some older entries are authored "McDonald, S." rather than "Hopkins, S.") — that's the accurate historical record, not a typo to fix. `Site.boldenAuthors` bolds either surname (see the note under `publications.json` above), so a "McDonald, S." byline bolds the same as a "Hopkins, S." one.
- `tags`/`subtopics` use the same vocabulary and conventions as `publications.json` (see above) and fold press pieces into the same topic/subtopic filter bar as the papers sections — a piece with no natural fit in the existing topics (e.g. a general-interest history/outreach post, not tied to any research topic) should simply omit both fields rather than force a bad match; it then always shows regardless of the active filter, same as an untagged paper would.
- Optional `cvOnly: true` marks a piece as CV-only — `js/media.js` skips it on `research.html`'s "Selected Popular Press" section but still renders it on `cv.html`. Use this for pieces that belong in the historical record of a CV (e.g. outreach writing not tied to a research topic) but would look out of place in the portfolio-facing Research page.
- On `cv.html`, printing also appends the piece's `url` in parentheses after the title (`a[href]::after` in `css/styles.css`) so the link is readable on paper, not just clickable on screen.

## data/talks.json — presentations (extension, not in upstream template)

Array. Rendered by `js/talks.js` into the "Presentations" section on `cv.html` (`#talks-container`), grouped into two subheadings ("Talks", "Poster Presentations") by the `type` field — order within each group is manual (newest first), same convention as everywhere else.

```json
{
  "type": "Talk",
  "title": "Which Topics Polarize Where? Mapping Polarization and Depolarization in News Comments",
  "venue": "DACH-CSS Conference 2026",
  "date": "May 2026"
}
```

- `type` is `"Talk"` or `"Poster"` — anything else won't render (only these two groups exist in `js/talks.js`).
- `date` is a free-text "Month YYYY" string (no day-level precision in the source record) — kept as display text and manually ordered, not parsed for sorting.
- Optional: `url` (renders the title as a link, e.g. to a poster PDF or OSF page) — most entries don't have one and render as plain text.

## data/grants.json — grants & funding (extension, not in upstream template)

Array, newest first. Rendered by `js/grants.js` into the "Grants & Funding" section on `cv.html` (`#grants-container`).

```json
{
  "title": "WU Small Projects Grant",
  "funder": "WU",
  "amount": "€7,950",
  "term": "January 2026 – April 2027"
}
```

## data/teaching.json — courses taught

Array, newest first. Rendered by `js/teaching.js` into the "Teaching" section on `cv.html` (`#teaching-container`). Not used anywhere else — see `data/education.json` above for how to also wire a section onto `index.html` if wanted.

```json
{
  "course": "Business Psychology II",
  "institution": "WU Vienna",
  "role": "Undergraduate Lecture; Course coordinator",
  "term": "Summer 2025–present"
}
```

## data/skills.json — skills, grouped by category (cv.html only)

Array. Rendered by `js/skills.js` into the "Skills" section on `cv.html` (`#skills-container`), reusing the same `.item`/`.item-title`/`.item-description` markup as `education.json`. Not used on `research.html`.

```json
{
  "category": "Research & Methods",
  "skills": "Experimental, Qualitative, and Exploratory Research; Intervention Development; Behavior Mapping"
}
```

- `skills` is one free-text string per category, rendered verbatim (not split into a list) — order/punctuation within it (e.g. `;` separating distinct skills, `,` within a single compound phrase) is preserved exactly as written rather than parsed, since it's ambiguous which commas are conjunctive vs. delimiting.

## data/involvement.json — involvement & achievements (cv.html only)

Array, newest first. Rendered by `js/involvement.js` into the "Involvement & Achievements" section on `cv.html` (`#involvement-container`). Not used on `research.html`.

```json
{
  "title": "WYSE International Leadership Program Participant",
  "organization": "WYSE",
  "term": "January 2024"
}
```

- Optional: `organization`, `term`.

## data/memberships.json — professional memberships & affiliations (cv.html only)

Array, newest first. Rendered by `js/memberships.js` into the "Memberships & Affiliations" section on `cv.html` (`#memberships-container`). Not used on `research.html`.

```json
{
  "organization": "Association for Psychological Science",
  "term": "March 2023 – Present"
}
```

- Optional: `term`.

## cv.html "References" section — not a data file

A static `<section id="cv-references" class="cv-section">` hardcoded directly in `cv.html` ("References — Available upon request."), not driven by a `data/*.json` file — it's a single fixed sentence, not repeatable list content, so it follows the same "deliberate exception" logic as `contact.html`. It's always visible (no `hidden` attribute, no JSON to load), so it doesn't need an entry in `js/cv-toc.js`'s `WATCHED` list — the TOC picks it up automatically since it scans for any `.cv-section:not([hidden])` once the watched (data-driven) sections have finished loading.

## data/ongoing_projects.json — "Research Focus" cards / Home teaser tags

Array. Currently used for the three research-focus themes (Misinformation/Trust/Polarization, Well-being, Sustainability) rather than literal ongoing-project updates — treat as a general "research themes" list.

```json
{
  "title": "Misinformation, Trust & Polarization",
  "description": "Studying how false beliefs form and persist...",
  "icon": "trust"
}
```

- Optional: `icon`. One of `"trust"`, `"wellbeing"`, `"sustainability"` — keys into the `FOCUS_ICONS` map in `js/utils.js` (`Site.focusIcon`), a small set of hand-drawn line icons. An unrecognized or omitted value just renders without an icon, same as any other optional field. Adding a fourth research-focus theme means adding a matching entry to `FOCUS_ICONS` too, or leaving `icon` off.

`js/ongoing_projects.js` renders this file twice, differently per page (both from the same data, so there's one place to edit topic names):
- `research.html`'s `#projects-container` gets the full cards (`icon` + `title` + `description`).
- `index.html`'s `#research-teaser-container` gets a compact row of `icon` + `title` links (class `teaser-focus-item`) linking to `research.html#research` — `description` isn't used there. The teaser's lede sentence is static HTML in `index.html`, not data-driven, since it's a one-off sentence rather than repeatable list content.

`title` values double as the `tags` used to filter Publications/Working Papers (see below) — keep them in sync if you rename one.

## data/news.json, data/software.json — don't exist in this repo

Not created. An earlier version of this doc described a `news.json` schema and claimed both files existed as unused hooks from the upstream template — neither claim was true; verify against the actual `data/`/`js/` directories before trusting old doc text like that. If you want a "News" or "Software" section, design its schema from scratch (a news feed would likely want something like the upstream template's year-grouped format with a `type`/`htmltext` shape; port from the [upstream template](https://github.com/mr-devs/cc-academic-website/tree/main/js) as a starting point), add the `data/*.json` file, a `<section>` + container `<div>` + `<script src="./js/*.js">` to the relevant page, write the renderer, then document it here.

## cv.html table of contents — not a data file

`js/cv-toc.js` builds the "On this page" jump-link row at the top of `cv.html` after every section has finished loading, by scanning for `.cv-section` elements that ended up visible and linking to each one's `id` using its `<h2>` text as the label. Nothing to configure — add a new `.cv-section` to `cv.html` with an `id` and it picks it up automatically, as long as its container ID is added to the `WATCHED` list in `js/cv-toc.js` (it needs to know to wait for that section's `site:sectionLoaded` event before building the TOC).

## docs/publications/ directory convention — not used in this repo

The upstream template stores a PDF + `cite.bib` per paper under `docs/publications/`. This repo skips that; every publication/working-paper entry links straight to its external URL (DOI, journal page, preprint server) via the `url` field.
