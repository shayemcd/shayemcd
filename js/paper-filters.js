/**
 * Builds the tag filter bar above Publications/Working Papers once both
 * sections have finished loading (via the `site:sectionLoaded` event
 * dispatched by Site.load). Filters by the `tags` field on each paper.
 */
(() => {
  const WATCHED = ["publications-container", "working-papers-container"];
  const loaded = new Set();

  document.addEventListener("site:sectionLoaded", (event) => {
    if (!WATCHED.includes(event.detail.containerId)) return;
    loaded.add(event.detail.containerId);
    if (loaded.size === WATCHED.length) buildFilterBar();
  });

  function buildFilterBar() {
    const bar = document.getElementById("tag-filter-bar");
    if (!bar) return;

    const cards = [...document.querySelectorAll(".paper[data-tags]")];
    if (!cards.length) return;

    const tags = new Set();
    cards.forEach((card) => card.dataset.tags.split("|").forEach((tag) => tags.add(tag)));
    if (!tags.size) return;

    const makeButton = (label, tag, active) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = active ? "tag-filter is-active" : "tag-filter";
      btn.textContent = label;
      btn.dataset.tag = tag;
      return btn;
    };

    bar.appendChild(makeButton("All", "", true));
    [...tags].sort().forEach((tag) => bar.appendChild(makeButton(tag, tag, false)));

    bar.addEventListener("click", (event) => {
      const btn = event.target.closest(".tag-filter");
      if (!btn) return;

      bar.querySelectorAll(".tag-filter").forEach((b) => b.classList.toggle("is-active", b === btn));
      const tag = btn.dataset.tag;
      cards.forEach((card) => {
        card.hidden = Boolean(tag) && !card.dataset.tags.split("|").includes(tag);
      });
    });

    bar.hidden = false;
  }
})();
