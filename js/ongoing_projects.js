/**
 * Renders data/ongoing_projects.json. Shared by two pages with different
 * markup for the same data: research.html's #projects-container gets the
 * full "Research Focus" cards; index.html's #research-teaser-container gets
 * a compact row of icon + label links pointing back to research.html. Both
 * use the optional "icon" field via Site.focusIcon (js/utils.js) - a project
 * without a recognized icon just renders without one.
 */
if (document.getElementById("projects-container")) {
  Site.load("./data/ongoing_projects.json", "projects-container", (container, projects) => {
    projects.forEach((project) => {
      const card = Site.el("article", "card project-card");
      const icon = Site.focusIcon(project.icon);
      if (icon) card.appendChild(icon);
      card.appendChild(Site.el("h3", null, project.title));
      card.appendChild(Site.el("p", null, project.description));
      container.appendChild(card);
    });
  });
}

if (document.getElementById("research-teaser-container")) {
  Site.load("./data/ongoing_projects.json", "research-teaser-container", (container, projects) => {
    projects.forEach((project) => {
      const item = document.createElement("a");
      item.className = "teaser-focus-item";
      item.href = "./research.html#research";
      const icon = Site.focusIcon(project.icon);
      if (icon) item.appendChild(icon);
      item.appendChild(Site.el("span", "teaser-focus-label", project.title));
      container.appendChild(item);
    });
  });
}
