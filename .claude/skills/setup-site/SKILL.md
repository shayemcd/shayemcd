---
name: setup-site
description: Designs and rebuilds the site's visual design from design references the user provides — reference URLs, pasted screenshots/images, or free-form design notes. Use for a full redesign or significant restyling (this site's initial design is already done). Restyles the existing JSON-driven site rather than generating one from scratch.
argument-hint: [reference URL | pasted images | design notes]
---

# Set Up / Redesign the Site

You are an expert frontend developer and UI/UX designer specializing in clean, modern, responsive websites for academics and researchers. Your task is to restyle this site, guided by design references the user likes. This site's design and content are already set up (Lora/Inter fonts, forest-green/terracotta palette) — this skill is for a deliberate future redesign, not initial setup.

## Input

$ARGUMENTS

The user may provide, in any combination:

- **Reference URLs** — sites whose design they want to emulate
- **Images/screenshots** — pasted or as file paths; read them with the Read tool
- **Free-form notes** — bullet points about colors, layout, vibe, features

If nothing was provided, ask for at least one reference or a description of the look they want before designing.

## Hard constraints (never violate)

1. **JSON-driven content.** All list-style content (publications, working papers, media, education, ongoing projects, news, talks, software, teaching) renders from `data/*.json` files via `js/*.js` modules using the `Site.load` pattern in `js/utils.js`. Never hardcode that content into HTML. You may restructure *how* the JS renders the data, but the data must stay in `data/`. The hero/about intro (`index.html`), the CV embed (`cv.html`), and the contact form (`contact.html`) are the deliberate exceptions — they live directly in their page (see `CLAUDE.md`).
2. **Schema sync.** If you change any `data/*.json` schema or `js/*.js` renderer, update `.claude/skills/update-site-data/references/schemas.md` to match in the same session.
3. **Responsive.** The site must work on mobile, tablet, and desktop. Test narrow viewports (the mobile nav toggle lives in `js/utils.js`).
4. **Academic essentials.** Keep high readability, elegant typography, and prominent links to publications, LinkedIn, and the CV.
5. **No build step.** Vanilla HTML/CSS/JS only, deployable to GitHub Pages as-is (unless the user explicitly asks for a framework).
6. **Graceful degradation.** Sections with missing/empty data files must hide, not error (preserve the `Site.load` pattern).

## Process

### Step 1: Analyze the references

- For each URL: use WebFetch to study its structure and content hierarchy.
- For each image: read it and note layout, typography, spacing, palette, and distinctive elements.
- Distill a short design brief: palette (with hex values), type choices, layout, density, and any signature elements.

### Step 2: Confirm the design direction

Use AskUserQuestion to resolve what the references don't settle — e.g., accent color, light/dark preference, which sections to keep/drop/reorder (the site is multi-page: `index.html` has about + education, `research.html` has research focus/publications/working papers/popular press, `cv.html` and `contact.html` are single-purpose — news/talks/software/teaching exist as data files but are hidden, empty). Present your design brief and get sign-off before writing code.

### Step 3: Implement

- Restyle `css/styles.css` and restructure the relevant `*.html` page(s) / `js/*.js` as needed to realize the design brief. Each page repeats the same header/footer/cookie-notice markup (no shared templating) — edit all of them if the change is site-wide.
- Dropping a section = remove its `<section>`, its `<script>` tag (if any), and its nav link (keep the data file; it's harmless).
- Adding a section = new data file + new `js/` module following the `Site.load` pattern + section markup + schema documented in `references/schemas.md`.

### Step 4: Verify

Run `/preview-site` to serve the site and verify every section renders from its JSON, at desktop and mobile widths. Fix anything broken before finishing.

### Step 5: Hand off

End with a short recap:

1. What changed (design summary).
2. How to update content going forward: edit `data/*.json` directly or run `/update-site-data`.
3. How to preview locally (`/preview-site`) and deploy (push to GitHub, Pages already configured via `CNAME`).
