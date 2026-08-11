/**
 * Shared page chrome: document title, nav brand name, footer copyright.
 * Runs on every page. Reads a page-specific title from <body data-page-title="...">
 * (omit the attribute on the Home page to use the profile title instead).
 */
(async () => {
  const profile = await Site.fetchJSON("./data/profile.json");
  if (!profile || !profile.name) return;

  const pageTitle = document.body.dataset.pageTitle;
  document.title = pageTitle
    ? `${pageTitle} · ${profile.name}`
    : `${profile.name} · ${profile.title || "Behavioral Researcher"}`;

  const navName = document.getElementById("nav-name");
  if (navName) navName.textContent = profile.name;

  const footerName = document.getElementById("footer-name");
  if (footerName) {
    footerName.textContent = `© ${new Date().getFullYear()} ${profile.name}. All rights reserved.`;
  }
})();
