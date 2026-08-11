# Add a Working Paper

Add a new working paper (preprint / under review) to `data/working_papers.json`. See [schemas.md](schemas.md) for the schema — and remember to check the live JSON file first, since the schema may have evolved.

Unlike the upstream template, this repo does **not** keep a `docs/publications/` directory per paper — entries just carry a `url` (and optionally `publication` as a status note like `"Under review, Journal Name"`). No PDF/BibTeX files to manage locally.

The input can be:

1. **URL** (arXiv, OSF, SSRN, PsyArXiv, Research Square, bioRxiv, etc.) — fetch and extract metadata
2. **BibTeX entry** — parse directly, no scraping needed
3. **Free-form text** — extract what's provided, ask for missing info

## Steps

### Step 1: Detect Input Type

- If input starts with `http` or contains a preprint-server domain → treat as URL
- If input contains `@article{`, `@misc{`, `@inproceedings{`, etc. → treat as BibTeX
- Otherwise → treat as free-form text

### Step 2: Gather Paper Information

**If URL:**

1. Use WebFetch to scrape the preprint page
2. Extract: title, authors, preprint server name (for the `publication` field, e.g. `"Under review, SSRN"`), year
3. If any required fields are missing, ask the user

**If BibTeX:**

1. Parse the BibTeX entry
2. Extract: title, authors, year, URL (from `url`, `doi`, or `eprint` fields)

**If Free-form:**

1. Extract any information provided (title, authors, URL)
2. Use AskUserQuestion to gather missing required fields:
   - Title (required)
   - Authors (required)
   - Preprint URL (required)

### Step 3: Update working_papers.json

1. Read the current `data/working_papers.json` (match its actual schema and indentation)
2. Draft the new entry and show it to the user for approval
3. Add it at the beginning of the array and write the file
4. Validate: `python3 -m json.tool data/working_papers.json`

### Step 4: Provide Summary to User

**Completed:**

- Entry added to `data/working_papers.json`

**Paper details:**

- Title: [extracted title]
- Authors: [extracted authors]
- Link: [preprint URL]

Then offer to add a matching `Preprint` news item (see [add-news-item.md](add-news-item.md)).
