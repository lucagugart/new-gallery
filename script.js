let artworks = [];

const NONE_CATEGORY = "__NONE_CATEGORY__";
const NONE_SERIES = "__NONE_SERIES__";
const URL_NONE = "__none__";

const LABEL_NO_CATEGORY = "(No category)";
const LABEL_NO_SERIES = "(No series)";

fetch("artworks.json")
  .then(r => r.json())
  .then(data => {
    artworks = data || [];
    setupFilters();

    // 1) Build full option sets once
    updateFilterOptions("", [], []);

    // 2) Apply URL deep-link state (if any)
    const state = readStateFromUrl();
    setControlsFromState(state);

    // 3) Render based on resulting state
    applyFilters();
  });

function setupFilters() {
  document.getElementById("yearFilter").addEventListener("change", applyFilters);
  document.getElementById("categoryFilter").addEventListener("change", applyFilters);
  document.getElementById("seriesFilter").addEventListener("change", applyFilters);
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);
}

/* -------------------- helpers -------------------- */

function norm(v) {
  return v === null || v === undefined ? "" : String(v).trim();
}

function hasValue(v) {
  return norm(v) !== "";
}

function getMultiValues(selectEl) {
  // Uses selectedOptions (HTMLCollection) to read multi-select state [2](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/selectedOptions)
  return Array.from(selectEl.selectedOptions).map(o => o.value);
}

function setMultiValues(selectEl, values) {
  const allowed = new Set(values);
  Array.from(selectEl.options).forEach(opt => {
    opt.selected = allowed.has(opt.value);
  });
}

function uniqueSortedStrings(values) {
  const cleaned = values.map(norm).filter(v => v !== "");
  return [...new Set(cleaned)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function uniqueSortedYears(values) {
  const cleaned = values.filter(v => v !== null && v !== undefined).map(v => Number(v));
  return [...new Set(cleaned)].sort((a, b) => a - b).map(String);
}

function matchesYear(a, year) {
  return !year || String(a.year) === String(year);
}

function matchesCategory(a, selectedCategories) {
  if (!selectedCategories || selectedCategories.length === 0) return true;

  const c = norm(a.category);
  const wantsNone = selectedCategories.includes(NONE_CATEGORY);
  if (wantsNone && c === "") return true;

  return selectedCategories.includes(c);
}

function matchesSeries(a, selectedSeries) {
  if (!selectedSeries || selectedSeries.length === 0) return true;

  const s = norm(a.series);
  const wantsNone = selectedSeries.includes(NONE_SERIES);
  if (wantsNone && s === "") return true;

  return selectedSeries.includes(s);
}

/* -------------------- URL deep linking -------------------- */

function readStateFromUrl() {
  const url = new URL(window.location.href);
  const p = url.searchParams;

  const year = p.get("year") || "";

  // Multiple values via getAll() [1](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/getAll)
  const categories = (p.getAll("category") || []).map(v => v === URL_NONE ? NONE_CATEGORY : v);
  const series = (p.getAll("series") || []).map(v => v === URL_NONE ? NONE_SERIES : v);

  return { year, categories, series };
}

function writeStateToUrl({ year, categories, series }) {
  const url = new URL(window.location.href);
  const p = url.searchParams;

  p.delete("year");
  p.delete("category");
  p.delete("series");

  if (year) p.set("year", year);

  (categories || []).forEach(c => {
    p.append("category", c === NONE_CATEGORY ? URL_NONE : c);
  });

  (series || []).forEach(s => {
    p.append("series", s === NONE_SERIES ? URL_NONE : s);
  });

  // Replace URL without reloading page
  const newUrl = `${url.pathname}?${p.toString()}`.replace(/\?$/, "");
  history.replaceState(null, "", newUrl);
}

function setControlsFromState({ year, categories, series }) {
  const yearEl = document.getElementById("yearFilter");
  const catEl = document.getElementById("categoryFilter");
  const serEl = document.getElementById("seriesFilter");

  yearEl.value = year || "";
  setMultiValues(catEl, categories || []);
  setMultiValues(serEl, series || []);
}

/* -------------------- cascading filter options -------------------- */

function setYearOptions(yearEl, years, currentYear) {
  yearEl.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Filter by Year";
  yearEl.appendChild(ph);

  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearEl.appendChild(opt);
  });

  yearEl.value = years.includes(currentYear) ? currentYear : "";
}

function setMultiOptions(selectEl, label, options, selectedValues) {
  selectEl.innerHTML = "";

  const header = document.createElement("option");
  header.value = "";
  header.textContent = label;
  header.disabled = true;
  header.selected = false;
  selectEl.appendChild(header);

  options.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    selectEl.appendChild(opt);
  });

  // Preserve only selections still present
  const allowed = new Set(options.map(o => o.value));
  const kept = (selectedValues || []).filter(v => allowed.has(v));
  setMultiValues(selectEl, kept);
}

function updateFilterOptions(year, selectedCategories, selectedSeries) {
  const yearEl = document.getElementById("yearFilter");
  const catEl = document.getElementById("categoryFilter");
  const serEl = document.getElementById("seriesFilter");

  // Year depends on categories + series
  const years = uniqueSortedYears(
    artworks
      .filter(a => matchesCategory(a, selectedCategories))
      .filter(a => matchesSeries(a, selectedSeries))
      .map(a => a.year)
  );

  // Category depends on year + series
  const catSource = artworks
    .filter(a => matchesYear(a, year))
    .filter(a => matchesSeries(a, selectedSeries));

  const hasNullCategory = catSource.some(a => !hasValue(a.category));
  const cats = uniqueSortedStrings(catSource.map(a => a.category))
    .map(c => ({ value: c, label: c }));

  if (hasNullCategory) cats.unshift({ value: NONE_CATEGORY, label: LABEL_NO_CATEGORY });

  // Series depends on year + categories
  const serSource = artworks
    .filter(a => matchesYear(a, year))
    .filter(a => matchesCategory(a, selectedCategories));

  const hasNullSeries = serSource.some(a => !hasValue(a.series));
  const series = uniqueSortedStrings(serSource.map(a => a.series))
    .map(s => ({ value: s, label: s }));

  if (hasNullSeries) series.unshift({ value: NONE_SERIES, label: LABEL_NO_SERIES });

  setYearOptions(yearEl, years, year);
  setMultiOptions(catEl, "Filter by Category (multi-select)", cats, selectedCategories);
  setMultiOptions(serEl, "Filter by Series (multi-select)", series, selectedSeries);
}

/* -------------------- apply / clear -------------------- */

function applyFilters() {
  const yearEl = document.getElementById("yearFilter");
  const catEl = document.getElementById("categoryFilter");
  const serEl = document.getElementById("seriesFilter");

  let year = yearEl.value;
  let categories = getMultiValues(catEl);
  let series = getMultiValues(serEl);

  // Update dropdown options based on other selections (cascading)
  updateFilterOptions(year, categories, series);

  // Re-read after option update (invalid selections may be dropped)
  year = yearEl.value;
  categories = getMultiValues(catEl);
  series = getMultiValues(serEl);

  // Filter data
  const filtered = artworks
    .filter(a => matchesYear(a, year))
    .filter(a => matchesCategory(a, categories))
    .filter(a => matchesSeries(a, series));

  renderGallery(filtered);

  // Deep link state into URL
  writeStateToUrl({ year, categories, series });
}

function clearFilters() {
  const yearEl = document.getElementById("yearFilter");
  const catEl = document.getElementById("categoryFilter");
  const serEl = document.getElementById("seriesFilter");

  yearEl.value = "";
  Array.from(catEl.options).forEach(o => (o.selected = false));
  Array.from(serEl.options).forEach(o => (o.selected = false));

  applyFilters();
}

/* -------------------- rendering -------------------- */

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