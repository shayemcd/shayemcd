/**
 * Builds a two-tier filter (topic + subtopic) above Publications/Working
 * Papers/Manuscripts in Preparation/Selected Popular Press, once all four
 * sections have finished loading (via the `site:sectionLoaded` event
 * dispatched by Site.load). Topic comes from each item's `tags` field,
 * subtopic from `subtopics` (an item can carry more than one of either —
 * see schemas.md). An item must match the active selection on both facets
 * (an "All" on either facet leaves that facet unconstrained). Used on both
 * research.html and cv.html - on cv.html the filter also determines what
 * gets printed, since [hidden] applies under print media too.
 *
 * The subtopic bar stays hidden until a specific topic is selected, and
 * only lists subtopics that actually occur under that topic - showing
 * every subtopic across every topic at once got overwhelming as the
 * subtopic count grew.
 */
(() => {
  const WATCHED = ["publications-container", "working-papers-container", "manuscripts-container", "media-container"];
  const loaded = new Set();
  let cards = [];
  let activeTag = "";
  let activeSubtopic = "";

  document.addEventListener("site:sectionLoaded", (event) => {
    if (!WATCHED.includes(event.detail.containerId)) return;
    loaded.add(event.detail.containerId);
    if (loaded.size === WATCHED.length) init();
  });

  function init() {
    cards = [...document.querySelectorAll(".paper[data-tags], .media-item[data-tags]")];
    if (!cards.length) return;

    const tagBar = document.getElementById("tag-filter-bar");
    const subtopicBar = document.getElementById("subtopic-filter-bar");

    setUpFacet(tagBar, collectValues(cards, "data-tags"), (value) => {
      activeTag = value;
      activeSubtopic = "";
      refreshSubtopicFacet(subtopicBar);
      applyFilters();
    });

    if (subtopicBar) {
      subtopicBar.addEventListener("click", (event) => {
        const btn = event.target.closest(".tag-filter");
        if (!btn) return;
        subtopicBar.querySelectorAll(".tag-filter").forEach((b) => b.classList.toggle("is-active", b === btn));
        activeSubtopic = btn.dataset.value;
        applyFilters();
      });
    }

    refreshSubtopicFacet(subtopicBar);
    applyFilters();
  }

  function collectValues(cardList, attr) {
    const values = new Set();
    cardList.forEach((card) => {
      const raw = card.getAttribute(attr);
      if (raw) raw.split("|").forEach((v) => values.add(v));
    });
    return values;
  }

  function makeButton(label, value, active) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = active ? "tag-filter is-active" : "tag-filter";
    btn.textContent = label;
    btn.dataset.value = value;
    return btn;
  }

  /** Set up a facet bar once: populate its buttons and wire its click handler. */
  function setUpFacet(bar, values, onSelect) {
    if (!bar || !values.size) return;

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

  /** Rebuild the subtopic bar's options to only those under the active topic; hidden with no topic selected. */
  function refreshSubtopicFacet(bar) {
    if (!bar) return;
    bar.innerHTML = "";

    if (!activeTag) {
      bar.hidden = true;
      return;
    }

    const relevant = cards.filter((card) => (card.dataset.tags || "").split("|").includes(activeTag));
    const values = collectValues(relevant, "data-subtopics");
    if (!values.size) {
      bar.hidden = true;
      return;
    }

    bar.appendChild(makeButton("All", "", true));
    [...values].sort().forEach((value) => bar.appendChild(makeButton(value, value, false)));
    bar.hidden = false;
  }

  function applyFilters() {
    cards.forEach((card) => {
      const tagMatch = !activeTag || (card.dataset.tags || "").split("|").includes(activeTag);
      const subtopicMatch = !activeSubtopic || (card.dataset.subtopics || "").split("|").includes(activeSubtopic);
      card.hidden = !(tagMatch && subtopicMatch);
    });
  }
})();
