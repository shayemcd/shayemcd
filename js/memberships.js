/** Renders data/memberships.json (array, newest first) into the Memberships & Affiliations section. */
Site.load("./data/memberships.json", "memberships-container", (container, entries) => {
  entries.forEach((entry) => {
    const item = Site.el("div", "item");
    item.appendChild(Site.el("p", "item-title", entry.organization));
    if (entry.term) item.appendChild(Site.el("p", "item-meta", entry.term));
    container.appendChild(item);
  });
});
