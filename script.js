let artworks = [];

const NONE_CATEGORY = "__NONE_CATEGORY__";
const NONE_SERIES = "__NONE_SERIES__";
const LABEL_NO_CATEGORY = "(No category)";
const LABEL_NO_SERIES = "(No series)";

fetch("artworks.json")
  .then(r => r.json())
  .then(data => {
    artworks = data || [];
    setupFilters();
    applyFilters(); // initial render
  });

function setupFilters() {
  document.getElementById("yearFilter").addEventListener("change", applyFilters);
  document.getElementById("categoryFilter").addEventListener("change", applyFilters);
  document.getElementById("seriesFilter").addEventListener("change", applyFilters);
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);
}

/* ---------- helpers ---------- */

function norm(v) {
  return v === null || v === undefined ? "" : String(v).trim();
}

function hasValue(v) {
  return norm(v) !== "";
}

function matchesYear(a, year) {
  return !year || String(a.year) === String(year);
}

function matchesCategory(a, category) {
  if (!category) return true;
  if (category === NONE_CATEGORY) return !hasValue(a.category);
  return norm(a.category) === category;
}

function matchesSeries(a, series) {
  if (!series) return true;
  if (series === NONE_SERIES) return !hasValue(a.series);
  return norm(a.series) === series;
}

function uniqueSorted(values, numeric = false) {
  const cleaned = values.filter(v => hasValue(v));
  const uniq = [...new Set(cleaned.map(v => numeric ? Number(v) : String(v)))];
  return uniq.sort((a, b) =>
    numeric ? a - b : a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function setSelectOptions(selectEl, placeholder, options, currentValue) {
  selectEl.innerHTML = "";

  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  selectEl.appendChild(ph);

  options.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    selectEl.appendChild(opt);
  });

  const validValues = new Set(options.map(o => o.value));
  selectEl.value = currentValue && validValues.has(currentValue) ? currentValue : "";
}

/* ---------- main logic ---------- */

function applyFilters() {
  const yearEl = document.getElementById("yearFilter");
  const catEl = document.getElementById("categoryFilter");
  const serEl = document.getElementById("seriesFilter");

  const selectedYear = yearEl.value;
  const selectedCategory = catEl.value;
  const selectedSeries = serEl.value;

  updateFilterOptions(selectedYear, selectedCategory, selectedSeries);

  const year = yearEl.value;
  const category = catEl.value;
  const series = serEl.value;

  const filtered = artworks
    .filter(a => matchesYear(a, year))
    .filter(a => matchesCategory(a, category))
    .filter(a => matchesSeries(a, series));

  renderGallery(filtered);
}

function updateFilterOptions(year, category, series) {
  const yearEl = document.getElementById("yearFilter");
  const catEl = document.getElementById("categoryFilter");
  const serEl = document.getElementById("seriesFilter");

  // years → depend on category + series
  const yearOptions = uniqueSorted(
    artworks
      .filter(a => matchesCategory(a, category))
      .filter(a => matchesSeries(a, series))
      .map(a => a.year),
    true
  ).map(y => ({ value: String(y), label: String(y) }));

  // categories → depend on year + series
  const catSource = artworks
    .filter(a => matchesYear(a, year))
    .filter(a => matchesSeries(a, series));

  const catOptions = uniqueSorted(catSource.map(a => a.category))
    .map(c => ({ value: c, label: c }));

  if (catSource.some(a => !hasValue(a.category))) {
    catOptions.unshift({ value: NONE_CATEGORY, label: LABEL_NO_CATEGORY });
  }

  // series → depend on year + category
  const serSource = artworks
    .filter(a => matchesYear(a, year))
    .filter(a => matchesCategory(a, category));

  const serOptions = uniqueSorted(serSource.map(a => a.series))
    .map(s => ({ value: s, label: s }));

  if (serSource.some(a => !hasValue(a.series))) {
    serOptions.unshift({ value: NONE_SERIES, label: LABEL_NO_SERIES });
  }

  setSelectOptions(yearEl, "Filter by Year", yearOptions, year);
  setSelectOptions(catEl, "Filter by Category", catOptions, category);
  setSelectOptions(serEl, "Filter by Series", serOptions, series);
}

function clearFilters() {
  document.getElementById("yearFilter").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("seriesFilter").value = "";
  applyFilters();
}

/* ---------- rendering ---------- */

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

    const caption = document.createElement("h3");
    caption.textContent = art.title;

    const meta = document.createElement("p");
    const catLabel = hasValue(art.category) ? norm(art.category) : LABEL_NO_CATEGORY;
    const serLabel = hasValue(art.series) ? norm(art.series) : LABEL_NO_SERIES;
    meta.textContent = `${art.year} • ${catLabel} • ${serLabel}`;

    const desc = document.createElement("p");
    desc.textContent = art.description || "";

    card.appendChild(img);
    card.appendChild(caption);
    card.appendChild(meta);
    card.appendChild(desc);
    gallery.appendChild(card);
  });
}

function openLightbox(imgElement) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  lightboxImg.src = imgElement.src;
  lightbox.style.display = "flex";
}

function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
}