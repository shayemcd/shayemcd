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

    const meta = [piece.authors, piece.outlet, piece.date].filter(Boolean).join(" · ");
    if (meta) item.appendChild(Site.el("p", "item-meta", meta));

    container.appendChild(item);
  });
});
