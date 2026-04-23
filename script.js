let artworks = [];

const NONE = "__NONE__";
const LABEL_NO_CATEGORY = "(No category)";
const LABEL_NO_SERIES = "(No series)";

fetch("artworks.json")
  .then(r => r.json())
  .then(data => {
    artworks = data || [];
    setupFilters();
    restoreFromUrl();
    applyFilters();
  });

function setupFilters() {
  ["yearFilter", "categoryFilter", "seriesFilter"].forEach(id =>
    document.getElementById(id).addEventListener("change", applyFilters)
  );
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);
}

function restoreFromUrl() {
  const p = new URLSearchParams(window.location.search);
  document.getElementById("yearFilter").value = p.get("year") || "";
  document.getElementById("categoryFilter").value = p.get("category") || "";
  document.getElementById("seriesFilter").value = p.get("series") || "";
}

function updateUrl(year, category, series) {
  const p = new URLSearchParams();
  if (year) p.set("year", year);
  if (category) p.set("category", category);
  if (series) p.set("series", series);
  history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
}

function applyFilters() {
  const year = document.getElementById("yearFilter").value;
  const category = document.getElementById("categoryFilter").value;
  const series = document.getElementById("seriesFilter").value;

  updateFilterOptions(year, category, series);

  let filtered = artworks;

  if (year) filtered = filtered.filter(a => String(a.year) === String(year));
  if (category)
    filtered = filtered.filter(a =>
      category === NONE ? !a.category : a.category === category
    );
  if (series)
    filtered = filtered.filter(a =>
      series === NONE ? !a.series : a.series === series
    );

  renderGallery(filtered);
  updateUrl(year, category, series);
}

function updateFilterOptions(year, category, series) {
  setOptions(
    "yearFilter",
    "Year",
    [...new Set(artworks
      .filter(a => !category || (category === NONE ? !a.category : a.category === category))
      .filter(a => !series || (series === NONE ? !a.series : a.series === series))
      .map(a => String(a.year))
    )].sort((a, b) => Number(a) - Number(b)),
    year
  );

  const catsSource = artworks
    .filter(a => !year || String(a.year) === String(year))
    .filter(a => !series || (series === NONE ? !a.series : a.series === series));

  const cats = [...new Set(catsSource.filter(a => a.category).map(a => a.category))].sort();
  if (catsSource.some(a => !a.category)) cats.unshift(NONE);

  setOptions("categoryFilter", "Category", cats, category,
    v => v === NONE ? LABEL_NO_CATEGORY : v);

  const seriesSource = artworks
    .filter(a => !year || String(a.year) === String(year))
    .filter(a => !category || (category === NONE ? !a.category : a.category === category));

  const sers = [...new Set(seriesSource.filter(a => a.series).map(a => a.series))].sort();
  if (seriesSource.some(a => !a.series)) sers.unshift(NONE);

  setOptions("seriesFilter", "Series", sers, series,
    v => v === NONE ? LABEL_NO_SERIES : v);
}

function setOptions(id, placeholder, values, current, labelFn) {
  const el = document.getElementById(id);
  el.innerHTML = "";

  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  el.appendChild(ph);

  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = labelFn ? labelFn(v) : v;
    el.appendChild(o);
  });

  el.value = values.includes(current) ? current : "";
}

function clearFilters() {
  document.getElementById("yearFilter").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("seriesFilter").value = "";
  applyFilters();
}

function renderGallery(data) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  data.forEach(art => {
    const card = document.createElement("div");
    card.className = "art-card";

    const img = document.createElement("img");
    img.src = art.image;
    img.alt = art.title;
    img.onclick = () => openLightbox(img);

    const h3 = document.createElement("h3");
    h3.textContent = art.title;

    const meta = document.createElement("p");
    meta.textContent =
      `${art.year} • ${art.category || LABEL_NO_CATEGORY} • ${art.series || LABEL_NO_SERIES}`;

    const desc = document.createElement("p");
    desc.textContent = art.description || "";

    card.append(img, h3, meta, desc);
    gallery.appendChild(card);
  });
}

function openLightbox(img) {
  document.getElementById("lightbox-img").src = img.src;
  document.getElementById("lightbox").style.display = "flex";
}

function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
}