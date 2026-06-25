const params = new URLSearchParams(location.search);
const id = params.get('id');

if (!id) {
  document.getElementById('moviePage').innerHTML =
    '<div class="empty-state">No movie ID provided</div>';
} else {
  loadMovie(id);
}

async function loadMovie(movieId) {
  const loader = document.getElementById('movieLoader');
  const content = document.getElementById('movieContent');

  try {
    const res = await fetch(`/api/details?id=${movieId}`);
    const json = await res.json();

    if (!json.success) throw new Error('Not found');

    const m = json.data;

    document.getElementById('posterImg').src =
      m.poster ||
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect fill="%23333" width="300" height="450"/><text fill="%23999" font-size="18" x="50%" y="50%" text-anchor="middle">No Poster</text></svg>';
    document.getElementById('movieTitle').textContent = m.title;
    document.getElementById('movieYear').textContent = m.year;
    document.getElementById('movieRuntime').textContent = m.runtime
      ? `${m.runtime} min`
      : '';
    document.getElementById('movieRating').textContent = m.rating
      ? `★ ${m.rating}/10`
      : '';
    document.getElementById('movieOverview').textContent = m.overview;

    const genresEl = document.getElementById('movieGenres');
    genresEl.innerHTML = m.genres
      .map((g) => `<span>${g}</span>`)
      .join('');

    const watchBtn = document.getElementById('watchBtn');
    watchBtn.href = `watch.html?id=${m.id}&type=movie&title=${encodeURIComponent(m.title)}`;

    const downloadTrigger = document.getElementById('downloadBtn');
    downloadTrigger.href = '#';
    downloadTrigger.addEventListener('click', async (e) => {
      e.preventDefault();
      await triggerDownload(m.id, m.title);
    });

    const trailerSection = document.getElementById('trailerSection');
    if (m.trailerKey) {
      document.getElementById('trailerIframe').src =
        `https://www.youtube.com/embed/${m.trailerKey}`;
      trailerSection.style.display = 'block';
    }

    if (m.backdrop) {
      document.body.style.background = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${m.backdrop}) no-repeat center / cover`;
    }

    loader.style.display = 'none';
    content.style.display = 'block';
  } catch (err) {
    loader.textContent = 'Failed to load movie details';
  }
}

async function triggerDownload(movieId, title) {
  try {
    const res = await fetch(`/api/source?id=${movieId}&type=movie`);
    const json = await res.json();

    if (!json.success || !json.streamUrl) {
      alert('Could not retrieve stream URL for download');
      return;
    }

    const downloadUrl = `/api/download?url=${encodeURIComponent(json.streamUrl)}&title=${encodeURIComponent(title)}`;
    window.open(downloadUrl, '_blank');
  } catch (err) {
    alert('Download failed');
  }
}
