const params = new URLSearchParams(location.search);
const id = params.get('id');
const type = params.get('type') || 'movie';
const title = params.get('title') || 'Now Playing';

if (!id) {
  document.body.innerHTML = '<div class="empty-state">No media ID</div>';
} else {
  initPlayer(id, type, title);
}

async function initPlayer(mediaId, mediaType, mediaTitle) {
  const video = document.getElementById('video');
  const bufferingOverlay = document.getElementById('bufferingOverlay');
  const qualitySelect = document.getElementById('qualitySelect');
  const downloadBtn = document.getElementById('downloadFromPlayer');
  const titleEl = document.getElementById('playerTitle');
  const backLink = document.getElementById('backFromPlayer');

  titleEl.textContent = mediaTitle;
  backLink.href = `movie.html?id=${mediaId}`;

  try {
    const res = await fetch(`/api/source?id=${mediaId}&type=${mediaType}`);
    const json = await res.json();

    if (!json.success || !json.streamUrl) {
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

    const streamUrl = json.streamUrl;

    downloadBtn.href = `/api/download?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(mediaTitle)}`;

    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        startLevel: -1,
        abrEwmaFastVoD: 3,
        abrEwmaSlowVoD: 8,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        populateQualities(hls, qualitySelect, video);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          showError('Playback error - try reloading');
        }
      });

      video.addEventListener('waiting', () => {
        bufferingOverlay.style.display = 'flex';
      });
      video.addEventListener('canplay', () => {
        bufferingOverlay.style.display = 'none';
      });
      video.addEventListener('playing', () => {
        bufferingOverlay.style.display = 'none';
      });

      qualitySelect.addEventListener('change', () => {
        const val = qualitySelect.value;
        if (val === 'auto') {
          hls.currentLevel = -1;
        } else {
          hls.currentLevel = parseInt(val);
        }
      });

      window.__hls = hls;
    } else if (streamUrl.includes('.m3u8')) {
      video.src = streamUrl;
      video.addEventListener('waiting', () => {
        bufferingOverlay.style.display = 'flex';
      });
      video.addEventListener('canplay', () => {
        bufferingOverlay.style.display = 'none';
      });
    } else {
      video.src = streamUrl;
    }

    video.play().catch(() => {});
  } catch (err) {
    showError('Failed to load stream');
  }
}

function populateQualities(hls, select, video) {
  const levels = hls.levels;
  if (!levels || levels.length < 2) {
    select.disabled = true;
    return;
  }

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
}

function showError(msg) {
  const wrap = document.getElementById('playerWrap');
  wrap.innerHTML = `<div class="empty-state" style="color:var(--primary)">${msg}</div>`;
}
