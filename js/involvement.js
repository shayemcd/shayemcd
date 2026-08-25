/** Renders data/involvement.json (array, newest first) into the Involvement & Achievements section. */
Site.load("./data/involvement.json", "involvement-container", (container, entries) => {
  entries.forEach((entry) => {
    const item = Site.el("div", "item");
    item.appendChild(Site.el("p", "item-title", entry.title));
    const meta = [entry.organization, entry.term].filter(Boolean).join(" · ");
    if (meta) item.appendChild(Site.el("p", "item-meta", meta));
    container.appendChild(item);
  });
});
