/** Renders data/skills.json (array of category → skills groups) into the Skills section. */
Site.load("./data/skills.json", "skills-container", (container, groups) => {
  groups.forEach((group) => {
    const item = Site.el("div", "item");
    item.appendChild(Site.el("p", "item-title", group.category));
    if (group.skills) item.appendChild(Site.el("p", "item-description", group.skills));
    container.appendChild(item);
  });
});
