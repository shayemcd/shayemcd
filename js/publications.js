/** Renders data/publications.json (array of published papers), sorted newest first by year. */
Site.load("./data/publications.json", "publications-container", (container, papers) => {
  Site.sortByYear(papers).forEach((paper) => container.appendChild(Site.paperCard(paper)));
});
