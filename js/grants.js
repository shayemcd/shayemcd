/** Renders data/grants.json (array, newest first) into the Grants & Funding section. */
Site.load("./data/grants.json", "grants-container", (container, grants) => {
  grants.forEach((grant) => {
    const item = Site.el("div", "item");
    item.appendChild(Site.el("p", "item-title", grant.title));
    const meta = [grant.funder, grant.amount, grant.term].filter(Boolean).join(" · ");
    if (meta) item.appendChild(Site.el("p", "item-meta", meta));
    container.appendChild(item);
  });
});
