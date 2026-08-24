/**
 * Renders data/talks.json (array of Talk/Poster entries) into the
 * Presentations section, grouped under two subheadings.
 */
Site.load("./data/talks.json", "talks-container", (container, items) => {
  const groups = [
    { type: "Talk", heading: "Talks" },
    { type: "Poster", heading: "Poster Presentations" },
  ];

  groups.forEach((group) => {
    const entries = items.filter((item) => item.type === group.type);
    if (!entries.length) return;

    container.appendChild(Site.el("h3", "talks-subheading", group.heading));

    const list = Site.el("div", "item-list");
    entries.forEach((entry) => {
      const item = Site.el("div", "item");

      const title = Site.el("p", "item-title");
      if (entry.url) title.appendChild(Site.link(entry.url, entry.title));
      else title.textContent = entry.title;
      item.appendChild(title);

      const meta = [entry.venue, entry.date].filter(Boolean).join(" · ");
      if (meta) item.appendChild(Site.el("p", "item-meta", meta));

      list.appendChild(item);
    });
    container.appendChild(list);
  });
});
