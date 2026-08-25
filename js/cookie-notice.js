/**
 * Small, self-hosted cookie notice. Replaces the third-party Iubenda widget.
 * Google Analytics only loads after the visitor accepts.
 */
(() => {
  const CONSENT_KEY = "cookie-consent";
  const GA_ID = "G-DJPDYWB2Y3";

  function loadAnalytics() {
    if (window.gtag) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem(CONSENT_KEY) === "accepted") {
      loadAnalytics();
      return;
    }

    const banner = document.getElementById("cookie-notice");
    if (!banner) return;
    banner.hidden = false;

    const dismissTimer = setTimeout(() => {
      banner.hidden = true;
    }, 5000);

    const accept = banner.querySelector("[data-cookie-accept]");
    if (accept) {
      accept.addEventListener("click", () => {
        clearTimeout(dismissTimer);
        localStorage.setItem(CONSENT_KEY, "accepted");
        banner.hidden = true;
        loadAnalytics();
      });
    }
  });
})();
