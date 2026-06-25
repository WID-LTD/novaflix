const params = new URLSearchParams(location.search);
const id = params.get('id');
const type = params.get('type') || 'movie';

const backdropWrap = document.getElementById('backdropWrap');
const posterImg = document.getElementById('posterImg');
const movieTitle = document.getElementById('movieTitle');
const movieYear = document.getElementById('movieYear');
const movieRuntime = document.getElementById('movieRuntime');
const movieRating = document.getElementById('movieRating');
const movieGenres = document.getElementById('movieGenres');
const movieOverview = document.getElementById('movieOverview');
const watchBtn = document.getElementById('watchBtn');
const downloadBtn = document.getElementById('downloadBtn');
const movieLoader = document.getElementById('movieLoader');
const movieContent = document.getElementById('movieContent');
const episodeSelector = document.getElementById('episodeSelector');
const episodeListEl = document.getElementById('episodeList');
const seasonSelect = document.getElementById('seasonSelect');
const episodeSelect = document.getElementById('episodeSelect');
const backLink = document.querySelector('.back-link');
const trailerSection = document.getElementById('trailerSection');
const trailerIframe = document.getElementById('trailerIframe');

const selectAllCheckbox = document.getElementById('selectAllEpisodes');
const episodeChecklist = document.getElementById('episodeChecklist');
const downloadStatus = document.getElementById('downloadStatus');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');

const dlModal = document.getElementById('downloadModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalFileTitle = document.getElementById('modalFileTitle');
const modalQualityList = document.getElementById('modalQualityList');
const modalTotalSize = document.getElementById('modalTotalSize');
const modalBatchInfo = document.getElementById('modalBatchInfo');

let currentSeason = '1';
let currentEpisode = '1';
let allEpisodes = [];
let batchQueue = [];
let batchRunning = false;
let batchTotal = 0;
let batchCompleted = 0;
let modalContext = null;
let selectedVariant = null;

if (!id) {
  document.body.innerHTML = '<div class="empty-state">No ID provided</div>';
} else {
  loadMovie();
}

modalCloseBtn.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
dlModal.addEventListener('click', (e) => { if (e.target === dlModal) closeModal(); });
modalConfirmBtn.addEventListener('click', confirmDownload);

async function loadMovie() {
  try {
    const res = await fetch(`/api/details?id=${id}&type=${type}`);
    const json = await res.json();

    if (!json.success) {
      movieLoader.textContent = json.error || 'Failed to load';
      return;
    }

    const d = json.data;
    const mediaTitle = d.title || d.name || 'Unknown';
    movieTitle.textContent = mediaTitle;
    movieYear.textContent = d.year || (d.releaseDate ? d.releaseDate.split('-')[0] : '');
    movieRuntime.textContent = d.runtime ? `${d.runtime} min` : '';
    movieRating.textContent = d.rating ? `\u2605 ${d.rating}` : '';
    movieGenres.innerHTML = (d.genres || d.genre_ids || [])
      .map((g) => `<span class="genre-tag">${typeof g === 'object' ? g.name : g}</span>`)
      .join('');
    movieOverview.textContent = d.overview || 'No overview available';
    posterImg.src = d.poster || 'https://via.placeholder.com/300x450?text=No+Poster';

    if (d.backdrop) {
      backdropWrap.style.backgroundImage = `url(${d.backdrop})`;
    }

    backLink.href = 'index.html';
    trailerSection.classList.add('trailer-section');

    const watchParams = new URLSearchParams();
    watchParams.set('id', id);
    watchParams.set('type', type);
    watchParams.set('title', mediaTitle);

    if (type === 'tv') {
      episodeSelector.style.display = 'block';
      episodeListEl.style.display = 'block';
      watchParams.set('season', '1');
      watchParams.set('episode', '1');
      watchBtn.href = `watch.html?${watchParams.toString()}`;
      await loadSeasons();
    } else {
      watchBtn.href = `watch.html?${watchParams.toString()}`;
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDownloadModal('movie', { id, title: mediaTitle });
      });
    }

    if (d.trailerKey) {
      trailerSection.style.display = 'block';
      trailerIframe.src = `https://www.youtube.com/embed/${d.trailerKey}`;
    }

    movieLoader.style.display = 'none';
    movieContent.style.display = 'flex';
  } catch (err) {
    movieLoader.textContent = 'Failed to load movie details';
  }
}

async function loadSeasons() {
  try {
    const res = await fetch(`/api/details?id=${id}&type=tv`);
    const json = await res.json();
    if (!json.success || !json.data.seasons) return;

    const seasons = json.data.seasons;
    seasonSelect.innerHTML = seasons
      .map((s) => `<option value="${s.season}">${s.name || `Season ${s.season}`}</option>`)
      .join('');

    await loadEpisodesForSeason(seasonSelect.value);
    seasonSelect.addEventListener('change', () => {
      currentSeason = seasonSelect.value;
      currentEpisode = '1';
      episodeSelect.value = '1';
      loadEpisodesForSeason(currentSeason);
      updateWatchLink();
    });
    episodeSelect.addEventListener('change', () => {
      currentEpisode = episodeSelect.value;
      updateWatchLink();
    });

    renderEpisodeChecklist(seasons);
  } catch {
    episodeSelector.style.display = 'none';
  }
}

async function loadEpisodesForSeason(seasonNum) {
  try {
    const res = await fetch(`/api/tv-season?id=${id}&season=${seasonNum}`);
    const json = await res.json();
    if (json.success && json.episodes.length > 0) {
      episodeSelect.innerHTML = json.episodes
        .map((e) => `<option value="${e.episode}">${e.episode}. ${e.name}</option>`)
        .join('');
    }
  } catch {}
}

function updateWatchLink() {
  const p = new URLSearchParams();
  p.set('id', id);
  p.set('type', 'tv');
  p.set('title', movieTitle.textContent);
  p.set('season', currentSeason);
  p.set('episode', currentEpisode);
  watchBtn.href = `watch.html?${p.toString()}`;
}

async function renderEpisodeChecklist(seasons) {
  allEpisodes = [];
  for (const s of seasons) {
    try {
      const res = await fetch(`/api/tv-season?id=${id}&season=${s.season}`);
      const json = await res.json();
      if (json.success && json.episodes.length > 0) {
        json.episodes.forEach((ep) => {
          allEpisodes.push({
            season: s.season,
            episode: ep.episode,
            name: ep.name || `Episode ${ep.episode}`,
            still: ep.still_path ? `https://image.tmdb.org/t/p/w200${ep.still_path}` : null,
          });
        });
      }
    } catch {}
  }
  renderChecklist();
}

function renderChecklist() {
  episodeChecklist.innerHTML = '';
  if (allEpisodes.length === 0) {
    episodeChecklist.innerHTML = '<li class="empty-state">No episodes found</li>';
    return;
  }
  allEpisodes.forEach((ep, index) => {
    const li = document.createElement('li');
    li.className = 'episode-checklist-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.index = index;
    checkbox.id = `ep_${index}`;
    checkbox.addEventListener('change', updateSelectedCount);
    const label = document.createElement('label');
    label.htmlFor = `ep_${index}`;
    label.className = 'episode-label';
    const info = document.createElement('div');
    info.className = 'episode-info';
    info.innerHTML = `<span class="episode-num">S${ep.season}E${String(ep.episode).padStart(2, '0')}</span> <span class="episode-name">${ep.name}</span>`;
    label.appendChild(checkbox);
    label.appendChild(info);
    if (ep.still) {
      const img = document.createElement('img');
      img.className = 'episode-thumb';
      img.src = ep.still;
      img.alt = ep.name;
      li.appendChild(img);
    }
    li.appendChild(label);
    episodeChecklist.appendChild(li);
  });
  selectAllCheckbox.addEventListener('change', () => {
    const checked = selectAllCheckbox.checked;
    episodeChecklist.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = checked; });
    updateSelectedCount();
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const checked = episodeChecklist.querySelectorAll('input[type="checkbox"]:checked').length;
  downloadSelectedBtn.textContent = `Download Selected (${checked})`;
  downloadSelectedBtn.disabled = checked === 0;
}

downloadSelectedBtn.addEventListener('click', async () => {
  const selectedIndexes = [];
  episodeChecklist.querySelectorAll('input[type="checkbox"]:checked').forEach((cb) => {
    selectedIndexes.push(parseInt(cb.dataset.index));
  });
  if (selectedIndexes.length === 0) return;

  const selectedEps = selectedIndexes.map((i) => allEpisodes[i]);
  openDownloadModal('batch', { episodes: selectedEps, title: movieTitle.textContent });
});

async function openDownloadModal(context, data) {
  modalContext = { context, data };
  selectedVariant = null;
  modalConfirmBtn.disabled = true;
  modalQualityList.innerHTML = '<div class="modal-loading">Loading qualities...</div>';
  modalBatchInfo.style.display = 'none';
  modalTotalSize.textContent = '';

  if (context === 'batch') {
    const eps = data.episodes;
    modalFileTitle.textContent = `${data.title} - ${eps.length} episodes`;
    renderBatchEpisodeList(eps);
    modalBatchInfo.style.display = 'block';

    const firstEp = eps[0];
    const srcRes = await fetch(`/api/source?id=${id}&type=tv&season=${firstEp.season}&episode=${firstEp.episode}`);
    const srcJson = await srcRes.json();
    if (srcJson.success && srcJson.streamUrl) {
      const infoRes = await fetch(`/api/manifest-info?url=${encodeURIComponent(srcJson.streamUrl)}&id=${id}&type=tv&season=${firstEp.season}&episode=${firstEp.episode}`);
      const infoJson = await infoRes.json();
      if (infoJson.success && infoJson.variants.length > 0) {
        renderVariants(infoJson.variants, eps.length);
      } else {
        modalQualityList.innerHTML = '<div class="modal-empty">No quality info available</div>';
      }
    } else {
      modalQualityList.innerHTML = '<div class="modal-empty">Stream unavailable</div>';
    }
  } else {
    const srcRes = await fetch(`/api/source?id=${id}&type=movie`);
    const srcJson = await srcRes.json();
    if (srcJson.success && srcJson.streamUrl) {
      const infoRes = await fetch(`/api/manifest-info?url=${encodeURIComponent(srcJson.streamUrl)}&id=${id}&type=movie`);
      const infoJson = await infoRes.json();
      modalFileTitle.textContent = data.title;
      if (infoJson.success && infoJson.variants.length > 0) {
        renderVariants(infoJson.variants, 1);
      } else {
        modalQualityList.innerHTML = '<div class="modal-empty">No quality info available</div>';
      }
    } else {
      modalQualityList.innerHTML = '<div class="modal-empty">Stream unavailable</div>';
    }
  }

  dlModal.style.display = 'flex';
}

function addVariantOption(v, count, compressed) {
  const label = document.createElement('label');
  label.className = 'modal-quality-item';
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'quality';
  radio.addEventListener('change', () => {
    selectedVariant = { ...v, compressed };
    const bytes = compressed ? v.compressedBytes : v.sizeBytes;
    const sizeLbl = compressed ? v.compressedLabel : v.sizeLabel;
    const totalBytes = bytes * count;
    modalTotalSize.textContent = count > 1 ? `Total: ${formatBytes(totalBytes)} (${v.label}${compressed ? ' Fast' : ''} x${count})` : `~${sizeLbl}`;
    modalConfirmBtn.disabled = false;
  });
  const info = document.createElement('div');
  info.className = 'modal-quality-info';
  info.innerHTML = `<span class="modal-quality-label">${v.label} (${compressed ? 'Fast' : 'Original'})</span> <span class="modal-quality-size">${compressed ? v.compressedLabel : v.sizeLabel}</span>`;
  label.appendChild(radio);
  label.appendChild(info);
  return label;
}

function renderVariants(variants, count) {
  modalQualityList.innerHTML = '';
  variants.forEach((v) => {
    modalQualityList.appendChild(addVariantOption(v, count, false));
    modalQualityList.appendChild(addVariantOption(v, count, true));
  });

  if (variants.length > 0) {
    const allRadios = modalQualityList.querySelectorAll('input');
    const last = allRadios.length - 1;
    allRadios[last].checked = true;
    const v = variants[variants.length - 1];
    selectedVariant = { ...v, compressed: true };
    const totalBytes = v.compressedBytes * count;
    modalTotalSize.textContent = count > 1 ? `Total: ${formatBytes(totalBytes)} (${v.label} Fast x${count})` : `~${v.compressedLabel}`;
    modalConfirmBtn.disabled = false;
  }
}

function renderBatchEpisodeList(eps) {
  let html = '<div class="batch-ep-list"><strong>Episodes:</strong><ul>';
  eps.forEach((ep) => {
    html += `<li>S${ep.season}E${String(ep.episode).padStart(2, '0')} - ${ep.name}</li>`;
  });
  html += '</ul></div>';
  modalBatchInfo.innerHTML = html;
}

async function confirmDownload() {
  if (!modalContext || !selectedVariant) return;
  const { context, data } = modalContext;
  dlModal.style.display = 'none';
  const compressParam = selectedVariant.compressed ? '&compress=true' : '';

  if (context === 'batch') {
    downloadSelectedBtn.disabled = true;
    selectAllCheckbox.disabled = true;
    batchQueue = [...data.episodes];
    batchTotal = batchQueue.length;
    batchCompleted = 0;
    await runBatchQueue(selectedVariant.url, compressParam);
  } else {
    const srcRes = await fetch(`/api/source?id=${id}&type=movie`);
    const srcJson = await srcRes.json();
    if (srcJson.success && srcJson.streamUrl) {
      const a = document.createElement('a');
      a.href = `/api/download?url=${encodeURIComponent(srcJson.streamUrl)}&title=${encodeURIComponent(data.title)}&variant=${encodeURIComponent(selectedVariant.url)}${compressParam}`;
      a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }
}

async function runBatchQueue(variantUrl, compressParam = '') {
  if (batchRunning) return;
  batchRunning = true;

  while (batchQueue.length > 0) {
    const ep = batchQueue.shift();
    try {
      downloadStatus.textContent = `Downloading S${ep.season}E${String(ep.episode).padStart(2, '0')}... (${batchCompleted + 1}/${batchTotal})`;
      const res = await fetch(`/api/source?id=${id}&type=tv&season=${ep.season}&episode=${ep.episode}`);
      const json = await res.json();
      if (json.success && json.streamUrl) {
        const dlTitle = `${movieTitle.textContent} S${ep.season}E${String(ep.episode).padStart(2, '0')}`;
        const a = document.createElement('a');
        const dlUrl = `/api/download?url=${encodeURIComponent(json.streamUrl)}&title=${encodeURIComponent(dlTitle)}&variant=${encodeURIComponent(variantUrl)}${compressParam}`;
        a.href = dlUrl;
        a.download = `${dlTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        await new Promise((r) => setTimeout(r, 3000));
        a.remove();
      }
    } catch {}
    batchCompleted++;
    if (batchQueue.length > 0) await new Promise((r) => setTimeout(r, 1500));
  }

  batchRunning = false;
  downloadStatus.textContent = `Completed ${batchCompleted}/${batchTotal} downloads`;
  downloadSelectedBtn.disabled = false;
  selectAllCheckbox.disabled = false;
  downloadSelectedBtn.textContent = 'Download Selected (0)';
  selectAllCheckbox.checked = false;
  episodeChecklist.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
  batchCompleted = 0;
  batchTotal = 0;
}

function closeModal() {
  dlModal.style.display = 'none';
  modalContext = null;
  selectedVariant = null;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
}
