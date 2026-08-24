/**
 * Builds a two-tier filter (topic + subtopic) above Publications/Working
 * Papers/Manuscripts in Preparation, once all three sections have finished
 * loading (via the `site:sectionLoaded` event dispatched by Site.load).
 * Topic comes from each paper's `tags` field, subtopic from `subtopics`.
 * A paper must match the active selection on both facets (an "All" on
 * either facet leaves that facet unconstrained). Used on both
 * research.html and cv.html - on cv.html the filter also determines what
 * gets printed, since [hidden] applies under print media too.
 */
(() => {
  const WATCHED = ["publications-container", "working-papers-container", "manuscripts-container"];
  const loaded = new Set();
  let activeTag = "";
  let activeSubtopic = "";

  document.addEventListener("site:sectionLoaded", (event) => {
    if (!WATCHED.includes(event.detail.containerId)) return;
    loaded.add(event.detail.containerId);
    if (loaded.size === WATCHED.length) init();
  });

  function init() {
    const cards = [...document.querySelectorAll(".paper[data-tags]")];
    if (!cards.length) return;

    buildFacet("tag-filter-bar", "data-tags", cards, (value) => {
      activeTag = value;
      applyFilters(cards);
    });
    buildFacet("subtopic-filter-bar", "data-subtopics", cards, (value) => {
      activeSubtopic = value;
      applyFilters(cards);
    });
  }

  function buildFacet(barId, dataAttr, cards, onSelect) {
    const bar = document.getElementById(barId);
    if (!bar) return;

    const values = new Set();
    cards.forEach((card) => {
      const raw = card.getAttribute(dataAttr);
      if (raw) raw.split("|").forEach((v) => values.add(v));
    });
    if (!values.size) return;

    const makeButton = (label, value, active) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = active ? "tag-filter is-active" : "tag-filter";
      btn.textContent = label;
      btn.dataset.value = value;
      return btn;
    };

    bar.appendChild(makeButton("All", "", true));
    [...values].sort().forEach((value) => bar.appendChild(makeButton(value, value, false)));

    bar.addEventListener("click", (event) => {
      const btn = event.target.closest(".tag-filter");
      if (!btn) return;
      bar.querySelectorAll(".tag-filter").forEach((b) => b.classList.toggle("is-active", b === btn));
      onSelect(btn.dataset.value);
    });

    bar.hidden = false;
  }

  function applyFilters(cards) {
    cards.forEach((card) => {
      const tagMatch = !activeTag || (card.dataset.tags || "").split("|").includes(activeTag);
      const subtopicMatch = !activeSubtopic || (card.dataset.subtopics || "").split("|").includes(activeSubtopic);
      card.hidden = !(tagMatch && subtopicMatch);
    });
  }
})();
