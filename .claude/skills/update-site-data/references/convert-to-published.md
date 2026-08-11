# Convert a Working Paper to Published

Convert an existing working paper to a published paper. See [schemas.md](schemas.md) for the `data/working_papers.json` and `data/publications.json` schemas — and remember to check the live JSON files first, since the schemas may have evolved.

Unlike the upstream template, this repo has no `docs/publications/` per-paper directory to rename — this is purely a JSON move.

The input can be:

1. **URL** (DOI/journal link) — fetch publication metadata
2. **BibTeX entry** — parse directly, all publication info available
3. **Free-form text** — extract what's provided, ask for missing info

## Steps

### Step 1: Detect Input Type

- If input starts with `http` or contains `doi.org`, journal domains → treat as URL
- If input contains `@article{`, `@inproceedings{`, etc. → treat as BibTeX
- Otherwise → treat as free-form text

### Step 2: Gather Publication Information

**If URL:**

1. Use WebFetch to scrape the publication page
2. Extract: title, authors, journal/venue name, year, DOI
3. If any required fields are missing, ask the user

**If BibTeX:**

1. Parse the BibTeX entry
2. Extract all fields: title, authors, journal, year, DOI/URL

**If Free-form:**

1. Extract any provided information
2. Use AskUserQuestion to gather missing required fields:
   - Journal/venue name (required)
   - Publication year (required)
   - DOI URL (required)

### Step 3: Match to Existing Working Paper

1. Read `data/working_papers.json`
2. Match by title similarity (case-insensitive, ignore punctuation differences)
3. If no match found or multiple matches, use AskUserQuestion to let user select which working paper to convert

### Step 4: Update Data Files

Show the drafted changes to the user for approval before writing.

**Remove from working_papers.json:**

1. Read `data/working_papers.json`
2. Remove the matching entry
3. Write the updated JSON back

**Add to publications.json:**

1. Read `data/publications.json` (match its actual schema and indentation)
2. Add new entry at the appropriate position (sorted by year, newest first)
3. Use the published-paper schema from [schemas.md](schemas.md) — `publication` becomes the journal name (not a "Under review, ..." status note) and `year` the publication year
4. Write the updated JSON back
5. Validate both files: `python3 -m json.tool data/working_papers.json data/publications.json`

### Step 5: Provide Summary to User

**Completed:**

- Entry removed from `data/working_papers.json`
- Entry added to `data/publications.json`

**Manual steps needed:**

1. **Verify DOI**: Test that the DOI link works correctly
2. **Preview**: Run `/preview-site` to verify the paper appears correctly in the publications section

**Publication details:**

- Title: [paper title]
- Authors: [authors]
- Journal: [journal/venue name]
- Year: [year]
- DOI: [DOI URL]

Then offer to add a matching `Publication` news item (see [add-news-item.md](add-news-item.md)).
