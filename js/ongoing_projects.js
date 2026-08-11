/** Renders data/ongoing_projects.json as the "Research Focus" cards. */
Site.load("./data/ongoing_projects.json", "projects-container", (container, projects) => {
  projects.forEach((project) => {
    const card = Site.el("article", "card project-card");
    card.appendChild(Site.el("h3", null, project.title));
    card.appendChild(Site.el("p", null, project.description));
    container.appendChild(card);
  });
});
