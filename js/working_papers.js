/** Renders data/working_papers.json (array of preprints/under review), sorted newest first by year. */
Site.load("./data/working_papers.json", "working-papers-container", (container, papers) => {
  Site.sortByYear(papers).forEach((paper) => container.appendChild(Site.paperCard(paper)));
});
