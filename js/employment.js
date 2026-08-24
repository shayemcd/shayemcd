/** Renders data/employment.json (array, newest first) into the Academic Experience section. */
Site.load("./data/employment.json", "employment-container", (container, entries) => {
  entries.forEach((entry) => {
    const item = Site.el("div", "item");
    item.appendChild(Site.el("p", "item-title", entry.role));
    if (entry.institution) item.appendChild(Site.el("p", "item-meta", [entry.institution, entry.term].filter(Boolean).join(" · ")));
    container.appendChild(item);
  });
});
