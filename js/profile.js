/**
 * Renders data/profile.json into the Home page's two sections:
 * a short hero (photo, headline, tagline, CTA buttons) and, below it,
 * a fuller "About" section with the full bio.
 */
(async () => {
  const profile = await Site.fetchJSON("./data/profile.json");
  if (!profile || !profile.name) return;

  const heroContainer = document.getElementById("hero-container");
  if (heroContainer) {
    const wrapper = Site.el("div", "profile");

    if (profile.photoPath) {
      const img = Site.el("img", "profile-photo");
      img.src = profile.photoPath;
      img.alt = profile.name;
      wrapper.appendChild(img);
    }

    const body = Site.el("div", "profile-body");
    body.appendChild(Site.el("span", "pill", "Behavioral Scientist"));
    body.appendChild(Site.el("h1", null, `${profile.name}.`));
    if (profile.tagline) body.appendChild(Site.el("p", "lede", profile.tagline));

    const ctas = Site.el("div", "hero-ctas");
    const researchBtn = document.createElement("a");
    researchBtn.href = "./research.html";
    researchBtn.className = "btn";
    researchBtn.textContent = "View Research";
    const contactBtn = document.createElement("a");
    contactBtn.href = "./contact.html";
    contactBtn.className = "btn secondary";
    contactBtn.textContent = "Let's Connect";
    ctas.appendChild(researchBtn);
    ctas.appendChild(contactBtn);
    body.appendChild(ctas);

    wrapper.appendChild(body);
    heroContainer.appendChild(wrapper);
  }

  const aboutContainer = document.getElementById("about-container");
  if (aboutContainer && profile.bio && profile.bio.length) {
    profile.bio.forEach((paragraph) => aboutContainer.appendChild(Site.el("p", null, paragraph)));
    const section = aboutContainer.closest("section");
    if (section) section.hidden = false;
  }
})();
