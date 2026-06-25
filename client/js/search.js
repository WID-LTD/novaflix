const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const emptyState = document.getElementById('emptyState');
const typeTabs = document.querySelectorAll('.type-tab');

let debounceTimer;
let currentType = 'movie';

async function searchMedia(query) {
  if (!query.trim()) {
    resultsEl.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  resultsEl.innerHTML = '<div class="loader">Searching...</div>';

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${currentType}`);
    const json = await res.json();

    if (!json.success || json.data.length === 0) {
      resultsEl.innerHTML = `<div class="empty-state">No ${currentType === 'tv' ? 'shows' : 'movies'} found</div>`;
      return;
    }

    resultsEl.innerHTML = json.data
      .map(
        (m) => `
          <div class="card" onclick="location.href='movie.html?id=${m.id}&type=${m.type}'">
            <img src="${m.poster || ''}" alt="${m.title}" loading="lazy"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%23333%22 width=%22200%22 height=%22300%22/><text fill=%22%23999%22 font-size=%2216%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22>No Poster</text></svg>'">
            <div class="card-body">
              <h3>${m.title}</h3>
              <div class="card-meta">
                <span>${m.year}</span>
                <span class="type-badge ${m.type}">${m.type === 'tv' ? 'TV' : 'Movie'}</span>
              </div>
            </div>
          </div>
        `
      )
      .join('');
  } catch (err) {
    resultsEl.innerHTML = '<div class="empty-state">Error fetching results</div>';
  }
}

typeTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    typeTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    currentType = tab.dataset.type;
    if (searchInput.value.trim()) searchMedia(searchInput.value);
  });
});

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => searchMedia(searchInput.value), 400);
});

searchBtn.addEventListener('click', () => searchMedia(searchInput.value));

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchMedia(searchInput.value);
});

if (searchInput.value.trim()) {
  searchMedia(searchInput.value);
}
