/**
 * Builds an "On this page" table of contents for cv.html once every
 * section has finished loading. Only links to sections that actually
 * ended up visible (a section with no data stays hidden and is skipped),
 * consistent with the rest of the site's "hide silently" convention.
 */
(() => {
  const WATCHED = [
    "education-container",
    "employment-container",
    "publications-container",
    "working-papers-container",
    "manuscripts-container",
    "talks-container",
    "grants-container",
    "teaching-container",
    "skills-container",
    "involvement-container",
    "memberships-container",
    "media-container",
  ];
  const loaded = new Set();

  document.addEventListener("site:sectionLoaded", (event) => {
    if (!WATCHED.includes(event.detail.containerId)) return;
    loaded.add(event.detail.containerId);
    if (loaded.size === WATCHED.length) buildToc();
  });

  function buildToc() {
    const nav = document.getElementById("cv-toc");
    if (!nav) return;

    const sections = [...document.querySelectorAll(".cv-section:not([hidden])")];
    if (!sections.length) return;

    sections.forEach((section) => {
      const heading = section.querySelector("h2");
      if (!heading) return;
      const link = document.createElement("a");
      link.href = `#${section.id}`;
      link.textContent = heading.textContent;
      link.className = "tag-link";
      nav.appendChild(link);
    });

    nav.hidden = false;
  }
})();
