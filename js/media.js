/**
 * Renders data/media.json (array of popular-press pieces, newest first).
 * Repo-specific extension beyond the base template — see schemas.md.
 */
Site.load("./data/media.json", "media-container", (container, pieces) => {
  pieces.forEach((piece) => {
    const item = Site.el("article", "item media-item");
    const title = Site.el("p", "item-title");
    if (piece.url) title.appendChild(Site.link(piece.url, piece.title));
    else title.textContent = piece.title;
    item.appendChild(title);

    const metaParts = [piece.authors && Site.boldenAuthors(piece.authors), piece.outlet, piece.date].filter(Boolean);
    if (metaParts.length) {
      const meta = Site.el("p", "item-meta");
      metaParts.forEach((part, i) => {
        if (i > 0) meta.appendChild(document.createTextNode(" · "));
        meta.appendChild(typeof part === "string" ? document.createTextNode(part) : part);
      });
      item.appendChild(meta);
    }

    container.appendChild(item);
  });
});
