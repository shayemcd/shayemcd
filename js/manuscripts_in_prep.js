/** Renders data/manuscripts_in_prep.json (array of unpublished drafts, no url yet). */
Site.load("./data/manuscripts_in_prep.json", "manuscripts-container", (container, papers) => {
  papers.forEach((paper) => container.appendChild(Site.paperCard(paper)));
});
