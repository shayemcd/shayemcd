/** Renders data/teaching.json (array, newest first) into the Teaching section. */
Site.load("./data/teaching.json", "teaching-container", (container, courses) => {
  courses.forEach((course) => {
    const item = Site.el("div", "item");
    item.appendChild(Site.el("p", "item-title", course.course));
    const meta = [course.institution, course.role, course.term].filter(Boolean).join(" · ");
    if (meta) item.appendChild(Site.el("p", "item-meta", meta));
    container.appendChild(item);
  });
});
