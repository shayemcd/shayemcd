/**
 * Shared page chrome: document title, footer copyright.
 * Runs on every page. Reads a page-specific title from <body data-page-title="...">
 * (omit the attribute on the Home page to use the profile title instead).
 * The nav brand (logo) is static HTML — not touched here.
 */
(async () => {
  const profile = await Site.fetchJSON("./data/profile.json");
  if (!profile || !profile.name) return;

  const pageTitle = document.body.dataset.pageTitle;
  document.title = pageTitle
    ? `${pageTitle} · ${profile.name}`
    : `${profile.name} · ${profile.title || "Behavioral Researcher"}`;

  const footerName = document.getElementById("footer-name");
  if (footerName) {
    footerName.textContent = `© ${new Date().getFullYear()} ${profile.name}. All rights reserved.`;
  }

  const footerLinks = document.getElementById("footer-links");
  if (footerLinks) {
    const links = (profile.links || []).filter((link) => link.label !== "CV");
    links.forEach((link, i) => {
      if (i > 0) footerLinks.appendChild(document.createTextNode(" · "));
      footerLinks.appendChild(Site.link(link.url, link.label));
    });
  }
})();
