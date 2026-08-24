/**
 * Renders data/ongoing_projects.json. Shared by two pages with different
 * markup for the same data: research.html's #projects-container gets the
 * full "Research Focus" cards; index.html's #research-teaser-container gets
 * a compact row of linked topic tags pointing back to research.html.
 */
if (document.getElementById("projects-container")) {
  Site.load("./data/ongoing_projects.json", "projects-container", (container, projects) => {
    projects.forEach((project) => {
      const card = Site.el("article", "card project-card");
      card.appendChild(Site.el("h3", null, project.title));
      card.appendChild(Site.el("p", null, project.description));
      container.appendChild(card);
    });
  });
}

if (document.getElementById("research-teaser-container")) {
  Site.load("./data/ongoing_projects.json", "research-teaser-container", (container, projects) => {
    projects.forEach((project) => {
      const tag = document.createElement("a");
      tag.className = "tag-link";
      tag.href = "./research.html#research";
      tag.textContent = project.title;
      container.appendChild(tag);
    });
  });
}
