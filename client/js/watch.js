const params = new URLSearchParams(location.search);
const id = params.get('id');
const type = params.get('type') || 'movie';
const title = params.get('title') || 'Now Playing';
const season = params.get('season') || '';
const episode = params.get('episode') || '';

let currentHls = null;
let currentTitle = title;
let currentSeason = season;
let currentEpisode = episode;
let currentStreamUrl = '';
let currentDirectUrl = '';
let currentDlTitle = '';
let currentServerSubs = [];
let usingDirectStream = false;
let isSeeking = false;
let playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
let rateIndex = 2;

const video = document.getElementById('video');
const bufferingOverlay = document.getElementById('bufferingOverlay');
const controlsOverlay = document.getElementById('controlsOverlay');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seekBar = document.getElementById('seekBar');
const seekBuffer = document.getElementById('seekBuffer');
const timeDisplay = document.getElementById('timeDisplay');
const speedBtn = document.getElementById('speedBtn');
const ccBtn = document.getElementById('ccBtn');
const subtitleSelect = document.getElementById('subtitleSelect');
const qualityBtn = document.getElementById('qualityBtn');
const qualitySelect = document.getElementById('qualitySelect');
const pipBtn = document.getElementById('pipBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const downloadBtn = document.getElementById('downloadFromPlayer');
const titleEl = document.getElementById('playerTitle');
const backLink = document.getElementById('backFromPlayer');
const watchLayout = document.getElementById('watchLayout');
const playerWrap = document.getElementById('playerWrap');

const sidebarPoster = document.getElementById('sidebarPoster');
const sidebarTitle = document.getElementById('sidebarTitle');
const sidebarYear = document.getElementById('sidebarYear');
const sidebarRating = document.getElementById('sidebarRating');
const sidebarGenres = document.getElementById('sidebarGenres');
const sidebarOverview = document.getElementById('sidebarOverview');
const sidebarEpisodes = document.getElementById('sidebarEpisodes');
const episodeChecklist = document.getElementById('episodeChecklist');
const selectAllCheckbox = document.getElementById('selectAllEpisodes');
const downloadStatus = document.getElementById('downloadStatus');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
const ccGroup = document.getElementById('ccGroup');
const qualityGroup = document.getElementById('qualityGroup');

const dlModal = document.getElementById('downloadModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalFileTitle = document.getElementById('modalFileTitle');
const modalQualityList = document.getElementById('modalQualityList');
const modalTotalSize = document.getElementById('modalTotalSize');
const modalBatchInfo = document.getElementById('modalBatchInfo');

let modalContext = null;
let selectedVariant = null;

modalCloseBtn.addEventListener('click', () => dlModal.style.display = 'none');
modalCancelBtn.addEventListener('click', () => dlModal.style.display = 'none');
dlModal.addEventListener('click', (e) => { if (e.target === dlModal) dlModal.style.display = 'none'; });
modalConfirmBtn.addEventListener('click', confirmDownload);

if (!id) {
  document.body.innerHTML = '<div class="empty-state">No media ID</div>';
} else {
  initPlayer(id, type, title, season, episode);
  loadSidebar(id, type, title);
  if (type === 'tv') initTvNav(id);
}

video.controls = false;

video.addEventListener('waiting', () => { bufferingOverlay.style.display = 'flex'; });
video.addEventListener('canplay', () => { bufferingOverlay.style.display = 'none'; });
video.addEventListener('playing', () => { bufferingOverlay.style.display = 'none'; });

video.addEventListener('timeupdate', updateSeekBar);
video.addEventListener('loadedmetadata', () => { seekBar.max = video.duration || 0; });
video.addEventListener('progress', updateBufferBar);

playBtn.addEventListener('click', togglePlay);
video.addEventListener('click', () => controlsOverlay.classList.remove('controls-hidden'));

rewindBtn.addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
forwardBtn.addEventListener('click', () => { video.currentTime = Math.min(video.duration, video.currentTime + 10); });

seekBar.addEventListener('input', () => {
  isSeeking = true;
  const pct = (seekBar.value / seekBar.max) * 100;
  seekBar.style.setProperty('--seek-pct', `${pct}%`);
});
seekBar.addEventListener('change', () => {
  video.currentTime = seekBar.value;
  isSeeking = false;
});

speedBtn.addEventListener('click', () => {
  rateIndex = (rateIndex + 1) % playbackRates.length;
  const rate = playbackRates[rateIndex];
  video.playbackRate = rate;
  speedBtn.textContent = rate + 'x';
});

volumeSlider.addEventListener('input', () => {
  video.volume = volumeSlider.value;
  video.muted = video.volume === 0;
  updateMuteIcon();
});
muteBtn.addEventListener('click', () => {
  video.muted = !video.muted;
  updateMuteIcon();
});

pipBtn.addEventListener('click', async () => {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await video.requestPictureInPicture();
    }
  } catch {}
});

fullscreenBtn.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFsIcon);
document.addEventListener('webkitfullscreenchange', updateFsIcon);

downloadBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!currentStreamUrl) return;
  const epQuery = currentSeason ? `&season=${currentSeason}&episode=${currentEpisode}` : '';
  const infoRes = await fetch(`/api/manifest-info?url=${encodeURIComponent(currentStreamUrl)}&id=${id}&type=${type}${epQuery}`);
  const infoJson = await infoRes.json();
  openModal(infoJson, currentDlTitle, 1, null);
});

controlsOverlay.addEventListener('mouseenter', () => controlsOverlay.classList.remove('controls-hidden'));
controlsOverlay.addEventListener('mouseleave', () => controlsOverlay.classList.add('controls-hidden'));

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  switch (e.key) {
    case ' ':
    case 'k': e.preventDefault(); togglePlay(); break;
    case 'f': e.preventDefault(); toggleFullscreen(); break;
    case 'm': e.preventDefault(); muteBtn.click(); break;
    case 'ArrowLeft': e.preventDefault(); rewindBtn.click(); break;
    case 'ArrowRight': e.preventDefault(); forwardBtn.click(); break;
    case 'ArrowUp': e.preventDefault(); volumeSlider.value = Math.min(1, parseFloat(volumeSlider.value) + 0.1); volumeSlider.dispatchEvent(new Event('input')); break;
    case 'ArrowDown': e.preventDefault(); volumeSlider.value = Math.max(0, parseFloat(volumeSlider.value) - 0.1); volumeSlider.dispatchEvent(new Event('input')); break;
  }
});

subtitleSelect.addEventListener('change', handleSubtitleChange);

async function initPlayer(mediaId, mediaType, mediaTitle, mediaSeason, mediaEpisode) {
  const displayTitle = mediaSeason ? `${mediaTitle} S${mediaSeason}E${mediaEpisode}` : mediaTitle;
  titleEl.textContent = displayTitle;
  titleEl.title = displayTitle;
  backLink.href = `movie.html?id=${mediaId}&type=${mediaType}`;

  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }

  bufferingOverlay.style.display = 'flex';
  clearSubtitles();
  subtitleSelect.innerHTML = '<option value="">Off</option>';
  qualitySelect.innerHTML = '<option value="auto">Auto</option>';
  qualitySelect.disabled = true;
  qualityBtn.textContent = 'HD';
  speedBtn.textContent = '1x';
  rateIndex = 2;
  video.playbackRate = 1;

  try {
    let sourceUrl = `/api/source?id=${mediaId}&type=${mediaType}`;
    if (mediaType === 'tv' && mediaSeason && mediaEpisode) {
      sourceUrl += `&season=${mediaSeason}&episode=${mediaEpisode}`;
    }
    const res = await fetch(sourceUrl);
    const json = await res.json();

    if (!json.success || !json.streamUrl) {
      bufferingOverlay.style.display = 'none';
      if (json.releaseDate) {
        const release = new Date(json.releaseDate);
        const now = new Date();
        const daysSince = (now - release) / (1000 * 60 * 60 * 24);
        if (release > now) {
          showError(`Expected to release on ${release.toLocaleDateString('en-US', { dateStyle: 'long' })}`);
        } else if (daysSince <= 14) {
          showError('Recently released — streaming sources may still be uploading. Check back soon.');
        } else {
          showError('No streaming source available for this title');
        }
      } else {
        showError(json.error || 'No stream source available');
      }
      return;
    }

    currentStreamUrl = json.streamUrl;
    currentDirectUrl = json.directUrl || '';
    currentDlTitle = mediaSeason ? `${mediaTitle} S${mediaSeason}E${mediaEpisode}` : mediaTitle;
    currentServerSubs = json.subtitles || [];
    addServerSubsToSelect(subtitleSelect, currentServerSubs);

    if ((currentDirectUrl || currentStreamUrl).includes('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
      const useDirect = !!currentDirectUrl;
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backbufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        startLevel: -1,
        abrEwmaFastVoD: 3,
        abrEwmaSlowVoD: 8,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
      });

      currentHls = hls;
      usingDirectStream = useDirect;
      hls.loadSource(useDirect ? currentDirectUrl : currentStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        bufferingOverlay.style.display = 'none';
        populateQualities(hls, qualitySelect);
        addHlsSubsToSelect(hls, subtitleSelect);
        video.play().catch(() => {});
        showControls();
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        addHlsSubsToSelect(hls, subtitleSelect);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
        const level = hls.levels[data.level];
        if (level) qualityBtn.textContent = (level.height || '?') + 'p';
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && usingDirectStream && currentStreamUrl) {
            usingDirectStream = false;
            hls.loadSource(currentStreamUrl);
          } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else {
            showError('Playback error - try reloading');
          }
        }
      });
    } else {
      video.src = currentStreamUrl;
      bufferingOverlay.style.display = 'none';
      video.play().catch(() => {});
      showControls();
    }
  } catch (err) {
    bufferingOverlay.style.display = 'none';
    showError('Failed to load stream');
  }
}

function togglePlay() {
  if (video.paused) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}

video.addEventListener('play', () => { playIcon.innerHTML = '&#9646;&#9646;'; });
video.addEventListener('pause', () => { playIcon.innerHTML = '&#9654;'; });

function updateSeekBar() {
  if (isSeeking) return;
  if (video.duration) {
    seekBar.max = video.duration;
    seekBar.value = video.currentTime;
    const pct = (video.currentTime / video.duration) * 100;
    seekBar.style.setProperty('--seek-pct', `${pct}%`);
  }
  timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
}

function updateBufferBar() {
  if (video.buffered.length > 0) {
    const end = video.buffered.end(video.buffered.length - 1);
    const pct = video.duration ? (end / video.duration) * 100 : 0;
    seekBuffer.style.width = `${pct}%`;
  }
}

function formatTime(t) {
  if (!t || isNaN(t)) return '0:00';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function updateMuteIcon() {
  muteBtn.innerHTML = video.muted || video.volume === 0 ? '&#x1F507;' : video.volume < 0.5 ? '&#x1F509;' : '&#x1F50A;';
}

video.addEventListener('volumechange', updateMuteIcon);

function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (playerWrap.requestFullscreen) {
      playerWrap.requestFullscreen();
    } else if (playerWrap.webkitRequestFullscreen) {
      playerWrap.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function updateFsIcon() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  fullscreenBtn.innerHTML = isFs ? '&#x21F1;' : '&#x26F6;';
}

function showControls() {
  controlsOverlay.classList.remove('controls-hidden');
}

function clearSubtitles() {
  const tracks = video.querySelectorAll('track');
  tracks.forEach((t) => t.remove());
}

function handleSubtitleChange() {
  const val = subtitleSelect.value;
  clearSubtitles();

  if (!val) {
    if (currentHls) currentHls.subtitleTrack = -1;
    return;
  }

  if (currentHls && currentHls.subtitleTracks) {
    for (let i = 0; i < currentHls.subtitleTracks.length; i++) {
      if (currentHls.subtitleTracks[i].id.toString() === val) {
        currentHls.subtitleTrack = i;
        return;
      }
    }
    currentHls.subtitleTrack = -1;
  }

  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = subtitleSelect.options[subtitleSelect.selectedIndex]?.textContent || 'Sub';
  track.src = val;
  track.srclang = 'en';
  track.default = true;
  video.appendChild(track);
}

function addServerSubsToSelect(select, subs) {
  if (!subs || subs.length === 0) { ccGroup.style.display = 'none'; return; }
  ccGroup.style.display = 'flex';
  subs.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = s.file;
    opt.textContent = s.label || `Sub ${i + 1}`;
    select.appendChild(opt);
  });
}

function addHlsSubsToSelect(hls, select) {
  const tracks = hls.subtitleTracks;
  if (!tracks || tracks.length === 0) return;
  ccGroup.style.display = 'flex';
  const existingValues = new Set();
  for (let i = 1; i < select.options.length; i++) {
    existingValues.add(select.options[i].value);
  }
  tracks.forEach((track) => {
    const id = track.id.toString();
    if (!existingValues.has(id)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = track.name || `Sub ${id}`;
      select.appendChild(opt);
      existingValues.add(id);
    }
  });
}

function populateQualities(hls, select) {
  const levels = hls.levels;
  if (!levels || levels.length < 2) {
    qualitySelect.disabled = true;
    qualityGroup.style.display = 'none';
    return;
  }
  qualityGroup.style.display = 'flex';
  select.innerHTML = '<option value="auto">Auto</option>';
  levels.forEach((level, index) => {
    const height = level.height || '?';
    const bitrate = level.bitrate ? ` (${Math.round(level.bitrate / 1000)}kbps)` : '';
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = `${height}p${bitrate}`;
    select.appendChild(opt);
  });
  select.disabled = false;

  select.addEventListener('change', () => {
    const val = select.value;
    if (currentHls) {
      currentHls.currentLevel = val === 'auto' ? -1 : parseInt(val);
      if (val !== 'auto') {
        const level = currentHls.levels[parseInt(val)];
        if (level) qualityBtn.textContent = (level.height || '?') + 'p';
        else qualityBtn.textContent = 'HD';
      } else {
        qualityBtn.textContent = 'Auto';
      }
    }
  });
}

async function initTvNav(mediaId) {
  const seasonSelect = document.getElementById('playerSeasonSelect');
  const episodeSelect = document.getElementById('playerEpisodeSelect');
  if (!seasonSelect) return;

  try {
    const res = await fetch(`/api/details?id=${mediaId}&type=tv`);
    const json = await res.json();
    if (!json.success || !json.data.seasons) return;

    const seasons = json.data.seasons;
    seasonSelect.innerHTML = seasons
      .map((s) => `<option value="${s.season}" ${s.season == currentSeason ? 'selected' : ''}>${s.name || `S${s.season}`}</option>`)
      .join('');

    await loadEpisodes(mediaId, seasonSelect.value, episodeSelect);
    prevBtn.style.display = 'inline-flex';
    nextBtn.style.display = 'inline-flex';

    seasonSelect.addEventListener('change', async () => {
      const newSeason = seasonSelect.value;
      currentSeason = newSeason;
      currentEpisode = '1';
      await loadEpisodes(mediaId, newSeason, episodeSelect);
      episodeSelect.value = '1';
      initPlayer(mediaId, 'tv', currentTitle, newSeason, '1');
    });

    episodeSelect.addEventListener('change', () => {
      currentEpisode = episodeSelect.value;
      initPlayer(mediaId, 'tv', currentTitle, currentSeason, currentEpisode);
    });

    prevBtn.addEventListener('click', () => {
      const idx = episodeSelect.selectedIndex;
      if (idx > 0) { episodeSelect.selectedIndex = idx - 1; episodeSelect.dispatchEvent(new Event('change')); }
    });

    nextBtn.addEventListener('click', () => {
      const idx = episodeSelect.selectedIndex;
      if (idx < episodeSelect.options.length - 1) { episodeSelect.selectedIndex = idx + 1; episodeSelect.dispatchEvent(new Event('change')); }
    });
  } catch {}
}

async function loadEpisodes(tmdbId, seasonNum, episodeSelect) {
  try {
    const res = await fetch(`/api/tv-season?id=${tmdbId}&season=${seasonNum}`);
    const json = await res.json();
    if (json.success && json.episodes.length > 0) {
      episodeSelect.innerHTML = json.episodes
        .map((e) => `<option value="${e.episode}" ${e.episode == currentEpisode ? 'selected' : ''}>${e.episode}. ${e.name}</option>`)
        .join('');
    } else {
      episodeSelect.innerHTML = '<option value="1">Ep 1</option>';
    }
  } catch {
    episodeSelect.innerHTML = '<option value="1">Ep 1</option>';
  }
}

async function loadSidebar(mediaId, mediaType, mediaTitle) {
  try {
    const res = await fetch(`/api/details?id=${mediaId}&type=${mediaType}`);
    const json = await res.json();
    if (!json.success) return;

    const d = json.data;
    sidebarPoster.src = d.poster || '';
    sidebarPoster.alt = d.title || 'Poster';
    sidebarTitle.textContent = d.title || d.name || mediaTitle;
    sidebarYear.textContent = d.year || (d.releaseDate ? d.releaseDate.split('-')[0] : '');
    sidebarRating.textContent = d.rating ? `\u2605 ${d.rating}` : '';
    sidebarGenres.innerHTML = (d.genres || []).map((g) => `<span class="genre-tag">${typeof g === 'object' ? g.name : g}</span>`).join('');
    sidebarOverview.textContent = d.overview || 'No overview available';

    if (mediaType === 'tv') {
      sidebarEpisodes.style.display = 'block';
      loadEpisodeChecklist(mediaId);
    }
  } catch {}
}

async function loadEpisodeChecklist(mediaId) {
  allEpisodes = [];
  try {
    const res = await fetch(`/api/details?id=${mediaId}&type=tv`);
    const json = await res.json();
    if (!json.success || !json.data.seasons) return;

    for (const s of json.data.seasons) {
      try {
        const epRes = await fetch(`/api/tv-season?id=${mediaId}&season=${s.season}`);
        const epJson = await epRes.json();
        if (epJson.success && epJson.episodes.length > 0) {
          epJson.episodes.forEach((ep) => {
            allEpisodes.push({
              season: s.season,
              episode: ep.episode,
              name: ep.name || `Ep ${ep.episode}`,
              still: ep.still_path ? `https://image.tmdb.org/t/p/w200${ep.still_path}` : null,
            });
          });
        }
      } catch {}
    }

    renderChecklist();
  } catch {}
}

let allEpisodes = [];
let batchQueue = [];
let batchRunning = false;
let batchTotal = 0;
let batchCompleted = 0;

function renderChecklist() {
  episodeChecklist.innerHTML = '';
  if (allEpisodes.length === 0) {
    episodeChecklist.innerHTML = '<li class="empty-state">No episodes</li>';
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
  downloadSelectedBtn.textContent = `Download (${checked})`;
  downloadSelectedBtn.disabled = checked === 0;
}

downloadSelectedBtn.addEventListener('click', async () => {
  const selectedIndexes = [];
  episodeChecklist.querySelectorAll('input[type="checkbox"]:checked').forEach((cb) => {
    selectedIndexes.push(parseInt(cb.dataset.index));
  });
  if (selectedIndexes.length === 0) return;

  const selectedEps = selectedIndexes.map((i) => allEpisodes[i]);
  const firstEp = selectedEps[0];
  const srcRes = await fetch(`/api/source?id=${id}&type=tv&season=${firstEp.season}&episode=${firstEp.episode}`);
  const srcJson = await srcRes.json();
  if (srcJson.success && srcJson.streamUrl) {
    const infoRes = await fetch(`/api/manifest-info?url=${encodeURIComponent(srcJson.streamUrl)}&id=${id}&type=tv&season=${firstEp.season}&episode=${firstEp.episode}`);
    const infoJson = await infoRes.json();
    openModal(infoJson, `${title} - ${selectedEps.length} episodes`, selectedEps.length, selectedEps);
  }
});

async function runBatchQueue(variantUrl, compressParam = '') {
  if (batchRunning) return;
  batchRunning = true;
  while (batchQueue.length > 0) {
    const ep = batchQueue.shift();
    try {
      downloadStatus.textContent = `DL S${ep.season}E${String(ep.episode).padStart(2, '0')}... (${batchCompleted + 1}/${batchTotal})`;
      const res = await fetch(`/api/source?id=${id}&type=tv&season=${ep.season}&episode=${ep.episode}`);
      const json = await res.json();
      if (json.success && json.streamUrl) {
        const dlTitle = `${title} S${ep.season}E${String(ep.episode).padStart(2, '0')}`;
        const a = document.createElement('a');
        a.href = `/api/download?url=${encodeURIComponent(json.streamUrl)}&title=${encodeURIComponent(dlTitle)}&variant=${encodeURIComponent(variantUrl)}${compressParam}`;
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
  downloadStatus.textContent = `Completed ${batchCompleted}/${batchTotal}`;
  downloadSelectedBtn.disabled = false;
  selectAllCheckbox.disabled = false;
  downloadSelectedBtn.textContent = 'Download (0)';
  selectAllCheckbox.checked = false;
  episodeChecklist.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
  batchCompleted = 0;
  batchTotal = 0;
  modalContext = null;
  selectedVariant = null;
}

function openModal(infoJson, fileTitle, count, episodes) {
  modalQualityList.innerHTML = '';
  modalBatchInfo.style.display = 'none';
  modalTotalSize.textContent = '';
  modalConfirmBtn.disabled = true;
  modalFileTitle.textContent = fileTitle;

  if (episodes) {
    modalContext = { episodes };
    let html = '<div class="batch-ep-list"><strong>Episodes:</strong><ul>';
    episodes.forEach((ep) => { html += `<li>S${ep.season}E${String(ep.episode).padStart(2, '0')} - ${ep.name}</li>`; });
    html += '</ul></div>';
    modalBatchInfo.innerHTML = html;
    modalBatchInfo.style.display = 'block';
  } else {
    modalContext = { episodes: null };
  }

  if (infoJson.success && infoJson.variants.length > 0) {
    function addOpt(v, compressed) {
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
    infoJson.variants.forEach((v) => {
      modalQualityList.appendChild(addOpt(v, false));
      modalQualityList.appendChild(addOpt(v, true));
    });

    const allRadios = modalQualityList.querySelectorAll('input');
    const last = allRadios.length - 1;
    allRadios[last].checked = true;
    const v = infoJson.variants[infoJson.variants.length - 1];
    selectedVariant = { ...v, compressed: true };
    const totalBytes = v.compressedBytes * count;
    modalTotalSize.textContent = count > 1 ? `Total: ${formatBytes(totalBytes)} (${v.label} Fast x${count})` : `~${v.compressedLabel}`;
    modalConfirmBtn.disabled = false;
  } else {
    modalQualityList.innerHTML = '<div class="modal-empty">No quality info</div>';
  }

  dlModal.style.display = 'flex';
}

function confirmDownload() {
  if (!selectedVariant) return;
  dlModal.style.display = 'none';
  const compressParam = selectedVariant.compressed ? '&compress=true' : '';

  if (modalContext?.episodes) {
    downloadSelectedBtn.disabled = true;
    selectAllCheckbox.disabled = true;
    batchQueue = [...modalContext.episodes];
    batchTotal = batchQueue.length;
    batchCompleted = 0;
    runBatchQueue(selectedVariant.url, compressParam);
  } else if (currentStreamUrl) {
    const a = document.createElement('a');
    a.href = `/api/download?url=${encodeURIComponent(currentStreamUrl)}&title=${encodeURIComponent(currentDlTitle)}&variant=${encodeURIComponent(selectedVariant.url)}${compressParam}`;
    a.download = `${currentDlTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
}

function showError(msg) {
  const overlay = document.getElementById('bufferingOverlay');
  if (overlay) overlay.style.display = 'none';
  playerWrap.innerHTML = `<div class="empty-state" style="color:var(--primary);padding:40px">${msg}</div>`;
}
