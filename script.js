
let artworks = [];

fetch('artworks.json')
  .then(response => response.json())
  .then(data => {
    artworks = data;
    populateFilters();
    renderGallery(artworks);
  });

function populateFilters() {
    const years = [...new Set(artworks.map(a => a.year))].sort();
    const categories = [...new Set(artworks.map(a => a.category))];

    const yearFilter = document.getElementById('yearFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    yearFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const year = document.getElementById('yearFilter').value;
    const category = document.getElementById('categoryFilter').value;

    let filtered = artworks;
    if (year) filtered = filtered.filter(a => a.year == year);
    if (category) filtered = filtered.filter(a => a.category == category);

    renderGallery(filtered);
}

function renderGallery(data) {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = '';
    data.forEach(art => {
        const card = document.createElement('div');
        card.className = 'art-card';

        const img = document.createElement('img');
        img.src = art.image;
        img.alt = art.title;
        img.onclick = () => openLightbox(img);

        const caption = document.createElement('h3');
        caption.textContent = art.title;

        const meta = document.createElement('p');
        meta.textContent = `${art.year} • ${art.category}`;

        const desc = document.createElement('p');
        desc.textContent = art.description;

        card.appendChild(img);
        card.appendChild(caption);
        card.appendChild(meta);
        card.appendChild(desc);

        gallery.appendChild(card);
    });
}

function openLightbox(imgElement) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = imgElement.src;
    lightbox.style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}
