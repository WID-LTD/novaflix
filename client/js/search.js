const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const emptyState = document.getElementById('emptyState');

let debounceTimer;

async function searchMovies(query) {
  if (!query.trim()) {
    resultsEl.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  resultsEl.innerHTML = '<div class="loader">Searching...</div>';

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const json = await res.json();

    if (!json.success || json.data.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state">No movies found</div>';
      return;
    }

    resultsEl.innerHTML = json.data
      .map(
        (m) => `
          <div class="card" onclick="location.href='movie.html?id=${m.id}'">
            <img src="${m.poster || ''}" alt="${m.title}" loading="lazy"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%23333%22 width=%22200%22 height=%22300%22/><text fill=%22%23999%22 font-size=%2216%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22>No Poster</text></svg>'">
            <div class="card-body">
              <h3>${m.title}</h3>
              <span>${m.year}</span>
            </div>
          </div>
        `
      )
      .join('');
  } catch (err) {
    resultsEl.innerHTML = '<div class="empty-state">Error fetching results</div>';
  }
}

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => searchMovies(searchInput.value), 400);
});

searchBtn.addEventListener('click', () => searchMovies(searchInput.value));

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchMovies(searchInput.value);
});

if (searchInput.value.trim()) {
  searchMovies(searchInput.value);
}
