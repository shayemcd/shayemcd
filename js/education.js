/** Renders data/education.json (array, newest first) into the About section. */
Site.load("./data/education.json", "education-container", (container, entries) => {
  entries.forEach((entry) => {
    const item = Site.el("div", "item education-item");
    item.appendChild(Site.el("p", "item-title", entry.degree));
    const meta = [entry.institution, entry.term].filter(Boolean).join(" · ");
    if (meta) item.appendChild(Site.el("p", "item-meta", meta));
    if (entry.description) item.appendChild(Site.el("p", "item-description", entry.description));
    container.appendChild(item);
  });
});
