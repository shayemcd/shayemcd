/**
 * Renders the CV header (name, title, affiliation, contact links) from
 * data/profile.json into #cv-header-container. The rest of cv.html reuses
 * the same renderers/container IDs as research.html (education.js,
 * publications.js, working_papers.js, manuscripts_in_prep.js, media.js).
 */
Site.load("./data/profile.json", "cv-header-container", (container, profile) => {
  if (!profile.name) return;

  container.appendChild(Site.el("h1", null, profile.name));

  const meta = [profile.title, profile.affiliation].filter(Boolean).join(" — ");
  if (meta) container.appendChild(Site.el("p", "cv-meta", meta));

  const links = (profile.links || []).filter((link) => link.label !== "CV");
  if (links.length) {
    const linksRow = Site.el("p", "cv-links");
    links.forEach((link, i) => {
      if (i > 0) linksRow.appendChild(document.createTextNode(" · "));
      linksRow.appendChild(Site.link(link.url, link.label));
    });
    container.appendChild(linksRow);
  }
});
