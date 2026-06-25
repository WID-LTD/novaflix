const params = new URLSearchParams(location.search);
const id = params.get('id');
const type = params.get('type') || 'movie';

if (!id) {
  document.getElementById('moviePage').innerHTML =
    '<div class="empty-state">No media ID provided</div>';
} else {
  loadDetails(id, type);
}

async function loadDetails(mediaId, mediaType) {
  const loader = document.getElementById('movieLoader');
  const content = document.getElementById('movieContent');

  try {
    const res = await fetch(`/api/details?id=${mediaId}&type=${mediaType}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Not found');

    const m = json.data;

    document.getElementById('posterImg').src =
      m.poster ||
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect fill="%23333" width="300" height="450"/><text fill="%23999" font-size="18" x="50%" y="50%" text-anchor="middle">No Poster</text></svg>';
    document.getElementById('movieTitle').textContent = m.title;
    document.getElementById('movieYear').textContent = m.year;
    document.getElementById('movieRuntime').textContent = m.runtime ? `${m.runtime} min` : '';
    document.getElementById('movieRating').textContent = m.rating ? `\u2605 ${m.rating}/10` : '';
    document.getElementById('movieOverview').textContent = m.overview;

    document.getElementById('movieGenres').innerHTML = m.genres.map((g) => `<span>${g}</span>`).join('');

    const episodeSel = document.getElementById('episodeSelector');
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    const watchBtn = document.getElementById('watchBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    if (mediaType === 'tv' && m.seasons && m.seasons.length > 0) {
      episodeSel.style.display = 'flex';
      downloadBtn.style.display = 'none';

      seasonSelect.innerHTML = m.seasons
        .map((s) => `<option value="${s.season}">${s.name || `Season ${s.season}`}</option>`)
        .join('');

      await loadEpisodes(mediaId, seasonSelect.value, episodeSelect);
      updateWatchLink(mediaId, 'tv', m.title, seasonSelect.value, episodeSelect.value);

      seasonSelect.addEventListener('change', async () => {
        await loadEpisodes(mediaId, seasonSelect.value, episodeSelect);
        updateWatchLink(mediaId, 'tv', m.title, seasonSelect.value, episodeSelect.value);
      });

      episodeSelect.addEventListener('change', () => {
        updateWatchLink(mediaId, 'tv', m.title, seasonSelect.value, episodeSelect.value);
      });
    } else {
      episodeSel.style.display = 'none';
      downloadBtn.style.display = '';
      watchBtn.href = `watch.html?id=${m.id}&type=movie&title=${encodeURIComponent(m.title)}`;

      downloadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await triggerDownload(m.id, m.title);
      });
    }

    const trailerSection = document.getElementById('trailerSection');
    if (m.trailerKey) {
      document.getElementById('trailerIframe').src = `https://www.youtube.com/embed/${m.trailerKey}`;
      trailerSection.style.display = 'block';
    }

    if (m.backdrop) {
      document.body.style.background = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${m.backdrop}) no-repeat center / cover`;
    }

    loader.style.display = 'none';
    content.style.display = 'block';
  } catch (err) {
    loader.textContent = 'Failed to load details';
  }
}

async function loadEpisodes(tmdbId, season, episodeSelect) {
  try {
    const res = await fetch(`/api/tv-season?id=${tmdbId}&season=${season}`);
    const json = await res.json();
    if (json.success && json.episodes.length > 0) {
      episodeSelect.innerHTML = json.episodes
        .map((e) => `<option value="${e.episode}">${e.episode}. ${e.name}</option>`)
        .join('');
    } else {
      episodeSelect.innerHTML = '<option value="1">Episode 1</option>';
    }
  } catch {
    episodeSelect.innerHTML = '<option value="1">Episode 1</option>';
  }
}

function updateWatchLink(id, type, title, season, episode) {
  document.getElementById('watchBtn').href =
    `watch.html?id=${id}&type=${type}&title=${encodeURIComponent(title)}&season=${season}&episode=${episode}`;
}

async function triggerDownload(movieId, title) {
  try {
    const res = await fetch(`/api/source?id=${movieId}&type=movie`);
    const json = await res.json();
    if (!json.success || !json.streamUrl) {
      alert('Could not retrieve stream URL for download');
      return;
    }
    window.open(`/api/download?url=${encodeURIComponent(json.streamUrl)}&title=${encodeURIComponent(title)}`, '_blank');
  } catch {
    alert('Download failed');
  }
}
