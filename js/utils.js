/**
 * Shared helpers for the JSON-driven sections.
 *
 * Every section module follows the same pattern:
 *   Site.load("data/foo.json", "container-id", renderFn)
 * The section stays hidden unless its JSON file loads and contains data,
 * so removing/emptying a data file cleanly removes the section.
 */

/** Matches this site's own author byline under either surname it's been published under - "Hopkins, S." (current) or "McDonald, S." (before a name change) - each with optional further initials (e.g. "Hopkins, S. A. M.") - so it can be bolded wherever it appears in an author list. */
const SELF_AUTHOR_RE = /(?:Hopkins|McDonald),\s*S\.(?:\s*[A-Z]\.)*/g;

/**
 * Line-icon markup for the Research Focus topics, keyed by
 * ongoing_projects.json's "icon" field. Plain shape primitives (circles,
 * lines, short 2-point paths) rather than traced artwork, so they stay
 * legible at small sizes and match the site's thin, uncluttered line style.
 * currentColor lets CSS control the color per placement (card vs teaser).
 */
const FOCUS_ICONS = {
  trust: `<circle cx="20" cy="10" r="3.2"/><circle cx="9" cy="28" r="3.2"/><circle cx="31" cy="28" r="3.2"/><path d="M20 13.2 11.4 24.8M20 13.2 28.6 24.8M12.2 28 27.8 28"/>`,
  wellbeing: `<circle cx="20" cy="9.5" r="3.4"/><path d="M20 12.9V24M20 16 13 10M20 16 27 10M20 24 14 31M20 24 26 31"/>`,
  sustainability: `<circle cx="20" cy="20" r="11"/><ellipse cx="20" cy="20" rx="4.6" ry="11"/><path d="M9 20h22M11.5 13Q20 17 28.5 13M11.5 27Q20 23 28.5 27"/>`,
};

const Site = {
  /**
   * Build a Research Focus icon: an inline SVG (line style, stroke =
   * currentColor) wrapped in a `<span class="focus-icon">` so CSS can size
   * and color it per context. Returns null for an unknown/missing icon name
   * so a card without one just renders without an icon, same as any other
   * optional field on this site.
   */
  focusIcon(name) {
    const shape = FOCUS_ICONS[name];
    if (!shape) return null;
    const wrap = this.el("span", "focus-icon");
    wrap.innerHTML = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>`;
    return wrap;
  },



  /**
   * Fetch a JSON data file. Returns null (instead of throwing) when the
   * file is missing or malformed so a broken file hides its section
   * rather than breaking the page. Errors are logged to the console.
   */
  async fetchJSON(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`Failed to load ${path}:`, err);
      return null;
    }
  },

  /**
   * Load a data file and render it into a container. Reveals the parent
   * <section> only when there is data to show.
   */
  async load(dataPath, containerId, render) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = await this.fetchJSON(dataPath);
    const isEmpty =
      data == null ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === "object" && Object.keys(data).length === 0);
    if (isEmpty) {
      document.dispatchEvent(new CustomEvent("site:sectionLoaded", { detail: { containerId, empty: true } }));
      return;
    }

    render(container, data);
    const section = container.closest("section");
    if (section) section.hidden = false;
    document.dispatchEvent(new CustomEvent("site:sectionLoaded", { detail: { containerId, empty: false } }));
  },

  /** Create an element with a class and optional text content. */
  el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  },

  /** Build a text fragment with this site's own name bolded wherever it appears in an author-list string (e.g. "Hopkins, S."), so it's easy to spot among coauthors. */
  boldenAuthors(text) {
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    SELF_AUTHOR_RE.lastIndex = 0;
    while ((match = SELF_AUTHOR_RE.exec(text))) {
      if (match.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      frag.appendChild(this.el("strong", null, match[0]));
      lastIndex = match.index + match[0].length;
    }
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    return frag;
  },

  /**
   * Render one paper card. Dispatches to a full portfolio-style card on
   * research.html, or a numbered APA-style citation on cv.html (detected
   * via the presence of the .cv-page wrapper) — see paperCardFull and
   * paperCitation below for what each mode actually renders.
   */
  paperCard(paper) {
    return document.querySelector(".cv-page") ? this.paperCitation(paper) : this.paperCardFull(paper);
  },

  /**
   * Full card, used on research.html. Fields used: title, url, authors,
   * publication, year, pdfPath, bibPath, dataUrl, codeUrl, tags (top-level
   * topic labels), subtopics (finer-grained labels) — both feed the
   * two-tier filter bar in js/paper-filters.js — tldr (a plain-language
   * synthesis) and abstract (the verbatim academic abstract), the latter
   * two collapsed behind their own Show/Hide toggle. The links row is
   * ordered PDF/BibTeX, Show abstract, Show TL;DR, Data & Code, Code —
   * dataUrl is labeled "Data & Code" since it's typically one combined
   * repo; codeUrl only applies for the rare paper with a separate code
   * repo, alongside it.
   */
  paperCardFull(paper) {
    const card = this.el("article", "paper");

    const title = this.el("p", "paper-title");
    if (paper.url) title.appendChild(this.link(paper.url, paper.title));
    else title.textContent = paper.title;
    card.appendChild(title);

    if (paper.authors) {
      const authorsEl = this.el("p", "paper-authors");
      authorsEl.appendChild(this.boldenAuthors(paper.authors));
      card.appendChild(authorsEl);
    }

    const venue = [paper.publication, paper.year].filter(Boolean).join(", ");
    if (venue) card.appendChild(this.el("p", "paper-venue", venue));

    if (paper.tags && paper.tags.length) {
      card.dataset.tags = paper.tags.join("|");
      const tagsRow = this.el("p", "paper-tags");
      paper.tags.forEach((tag) => tagsRow.appendChild(this.el("span", "paper-tag", tag)));
      if (paper.subtopics && paper.subtopics.length) {
        paper.subtopics.forEach((sub) => tagsRow.appendChild(this.el("span", "paper-subtag", sub)));
      }
      card.appendChild(tagsRow);
    }
    if (paper.subtopics && paper.subtopics.length) {
      card.dataset.subtopics = paper.subtopics.join("|");
    }

    const links = this.el("p", "paper-links");
    if (paper.pdfPath) links.appendChild(this.link(paper.pdfPath, "PDF"));
    if (paper.bibPath) links.appendChild(this.link(paper.bibPath, "BibTeX"));

    let abstractEl = null;
    if (paper.abstract) {
      abstractEl = this.el("p", "paper-abstract", paper.abstract);
      abstractEl.hidden = true;
      links.appendChild(this.disclosureToggle(abstractEl, "abstract"));
    }

    let tldrEl = null;
    if (paper.tldr) {
      tldrEl = this.el("p", "paper-tldr");
      tldrEl.appendChild(this.el("span", "paper-tldr-label", "In short"));
      tldrEl.appendChild(document.createTextNode(paper.tldr));
      tldrEl.hidden = true;
      links.appendChild(this.disclosureToggle(tldrEl, "TL;DR"));
    }

    if (paper.dataUrl) links.appendChild(this.link(paper.dataUrl, "Data & Code"));
    if (paper.codeUrl) links.appendChild(this.link(paper.codeUrl, "Code"));

    if (links.childNodes.length) card.appendChild(links);
    if (abstractEl) card.appendChild(abstractEl);
    if (tldrEl) card.appendChild(tldrEl);

    return card;
  },

  /**
   * Numbered APA-style reference, used on cv.html in place of the full
   * portfolio card — just the citation (authors, year, title, venue, link),
   * no tags/tldr/abstract/data links. Renders as an <li> since its container
   * (cv.html's #publications-container etc.) is an <ol reversed> — the
   * browser numbers it top-down from the total entry count to 1, so the
   * most recent entry (stored first, per the newest-first convention) gets
   * the highest number and it stays correct as entries are added, with no
   * counting logic to maintain here. tags/subtopics are kept as data
   * attributes (unrendered) so the filter bar still works even though the
   * pills themselves aren't shown.
   */
  paperCitation(paper) {
    const card = this.el("li", "paper paper-citation");
    if (paper.tags && paper.tags.length) card.dataset.tags = paper.tags.join("|");
    if (paper.subtopics && paper.subtopics.length) card.dataset.subtopics = paper.subtopics.join("|");

    const line = this.el("p", "paper-citation-text");
    if (paper.authors) {
      line.appendChild(this.boldenAuthors(paper.authors));
      line.appendChild(document.createTextNode(" "));
    }
    line.appendChild(document.createTextNode(`(${paper.year || "n.d."}). ${paper.title}. `));
    if (paper.publication) {
      line.appendChild(this.el("em", null, paper.publication));
      line.appendChild(document.createTextNode(". "));
    } else {
      line.appendChild(document.createTextNode("Manuscript in preparation. "));
    }
    if (paper.url) line.appendChild(this.link(paper.url, paper.url));

    card.appendChild(line);
    return card;
  },

  /** Build a Show/Hide `label` toggle button that shows/hides `target` (a hidden element already placed in the card). */
  disclosureToggle(target, label) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "paper-toggle";
    toggle.textContent = `Show ${label}`;
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      const show = target.hidden;
      target.hidden = !show;
      toggle.textContent = `${show ? "Hide" : "Show"} ${label}`;
      toggle.setAttribute("aria-expanded", String(show));
    });
    return toggle;
  },

  /** Create an external link (opens in a new tab). */
  link(href, text) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  },
};

// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
});
