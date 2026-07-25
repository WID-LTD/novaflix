import axios from 'axios';

const SOURCE_API_URLS = [
  { url: (id) => `https://nextgencloudfabric.com/embed/source-api.php?tmdb=${id}`,
    referer: 'https://nextgencloudfabric.com/' },
  { url: (id) => `https://vidsrc.pm/embed/source-api.php?tmdb=${id}`,
    referer: 'https://vidsrc.pm/' },
];

const XPLAY_HOST = 'https://play.xpass.top';
const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

function isValidStreamUrl(url) {
  return url && typeof url === 'string' && url.startsWith('http') && !url.includes('/video/error') && !url.includes('/error');
}

async function verifyStreamUrl(url) {
  try {
    const getRes = await axios.get(url, {
      headers: { ...COMMON_HEADERS, Referer: 'https://nextgencloudfabric.com/', Range: 'bytes=0-4096' },
      timeout: 2000,
      validateStatus: () => true,
      responseType: 'arraybuffer',
    });
    const ct = (getRes.headers['content-type'] || '').toLowerCase();
    if (getRes.status === 206 || getRes.status === 200) {
      const body = getRes.data;
      if (!body || body.byteLength < 10) return false;
      if (ct.includes('text/html')) return false;
      if (ct.startsWith('image/')) {
        const text = Buffer.from(body).toString('utf8').substring(0, 20);
        if (text.includes('#EXTM3U') || text.includes('#EXTINF')) {
          return await checkFirstSegment(body, url);
        }
        return false;
      }
      if (ct && (ct.startsWith('video/') || ct.startsWith('audio/') || ct.includes('octet-stream') || ct.includes('mpegurl') || ct.includes('mp2t') || ct.includes('mp4'))) {
        return true;
      }
      const text = Buffer.from(body).toString('utf8').substring(0, 200);
      if (text.includes('#EXTM3U') || text.includes('#EXTINF')) {
        return await checkFirstSegment(body, url);
      }
      const buf = Buffer.from(body.slice(0, Math.min(16, body.byteLength)));
      const hex = buf.toString('hex').toLowerCase();
      if (hex.startsWith('1a45dfa3') || hex.startsWith('000000') || hex.startsWith('4740') || hex.startsWith('66747970')) {
        return true;
      }
      if (!ct.includes('text/') && !ct.startsWith('image/')) return true;
    }
  } catch {}
  return false;
}

async function checkFirstSegment(body, playlistUrl) {
  try {
    const text = Buffer.from(body).toString('utf8');
    const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    if (lines.length === 0) return false;
    const firstSeg = lines[0];
    const segUrl = firstSeg.startsWith('http') ? firstSeg : new URL(firstSeg, playlistUrl).href;
    const headRes = await axios({
      url: segUrl,
      method: 'HEAD',
      timeout: 5000,
      validateStatus: () => true,
      headers: { ...COMMON_HEADERS, Referer: 'https://nextgencloudfabric.com/' },
    });
    const sct = (headRes.headers['content-type'] || '').toLowerCase();
    if (sct.includes('text/html')) {
      console.log(`[verify] Rejecting - first segment returned text/html: ${segUrl.substring(0, 80)}...`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function trySourceApi(tmdbId) {
  for (const source of SOURCE_API_URLS) {
    try {
      const res = await axios.get(source.url(tmdbId), {
        headers: { ...COMMON_HEADERS, Referer: source.referer },
        timeout: 4000,
      });
      const data = res.data;
      if (data.status_code === '200' && data.data?.stream_urls?.length) {
        const firstUrl = data.data.stream_urls[0];
        if (isValidStreamUrl(firstUrl)) {
          const verified = await verifyStreamUrl(firstUrl);
          if (verified) {
            console.log(`[source] Verified stream from ${source.referer}: ${firstUrl.substring(0, 80)}...`);
            return {
              streamUrl: firstUrl,
              subtitles: (data.data.default_subs || []).map((s) => ({
                label: s.label || 'Unknown',
                file: s.file,
              })),
            };
          }
          console.log(`[source] Stream from ${source.referer} failed verification, trying next source`);
        }
      }
    } catch (e) {
      console.log(`[source] Error fetching ${source.referer}: ${e.message}`);
    }
  }
  return null;
}

function extractPlaylistPaths(html) {
  const paths = [];
  const target = 'playlist.json';
  let idx = 0;
  while (idx < html.length) {
    const endIdx = html.indexOf(target, idx);
    if (endIdx === -1) break;
    const quoteIdx = html.lastIndexOf('"', endIdx);
    if (quoteIdx !== -1) {
      const path = html.substring(quoteIdx + 1, endIdx + target.length);
      if (path.startsWith('/') && !paths.includes(path)) paths.push(path);
    }
    idx = endIdx + 1;
  }
  return paths;
}

function extractSuburl(html) {
  const match = html.match(/suburl\s*=\s*"([^"]+)"/);
  return match ? match[1] : null;
}

async function fetchSubtitleApi(suburl) {
  try {
    const res = await axios.get(suburl, {
      headers: { ...COMMON_HEADERS, Referer: 'https://play.xpass.top/' },
      timeout: 10000,
    });
    if (Array.isArray(res.data)) {
      return res.data.map((s) => ({
        label: s.label || s.language || 'Unknown',
        file: s.url || s.file,
      }));
    }
  } catch {}
  return null;
}

async function extractPlaylistJson(pageUrl) {
  const res = await axios.get(pageUrl, {
    headers: { ...COMMON_HEADERS, Referer: 'https://www.2embed.skin/' },
    timeout: 8000,
  });

  const suburl = extractSuburl(res.data);

  const playlistPaths = extractPlaylistPaths(res.data);
  console.log(`[xpass] Found ${playlistPaths.length} playlist paths at ${pageUrl}`);
  if (playlistPaths.length > 0) console.log(`[xpass] First path: ${playlistPaths[0]}`);

  const limitedPaths = playlistPaths.slice(0, 5);
  for (const path of limitedPaths) {
    try {
      const url = `${XPLAY_HOST}${path}`;
      const plRes = await axios.get(url, {
        headers: { ...COMMON_HEADERS, Referer: XPLAY_HOST + '/' },
        timeout: 5000,
      });
      const plData = plRes.data;
      const sources = plData?.playlist?.[0]?.sources || [];
      for (const source of sources) {
        if (source.file && source.type === 'hls' && isValidStreamUrl(source.file)) {
          const verified = await verifyStreamUrl(source.file);
          if (!verified) {
            console.log(`[xpass] Skipping unverifiable stream: ${source.file.substring(0, 80)}...`);
            continue;
          }
          const tracks = plData?.playlist?.[0]?.tracks || [];
          let subtitles = tracks
            .filter((t) => t.kind === 'captions' || t.kind === 'subtitles')
            .map((t) => ({
              label: t.label || 'Unknown',
              file: t.file,
            }));
          if (subtitles.length === 0 && suburl) {
            const apiSubs = await fetchSubtitleApi(suburl);
            if (apiSubs) subtitles = apiSubs;
          }
          return {
            streamUrl: source.file,
            subtitles,
          };
        }
      }
    } catch {}
  }

  if (suburl) {
    const apiSubs = await fetchSubtitleApi(suburl);
    if (apiSubs) {
      return { streamUrl: null, subtitles: apiSubs };
    }
  }

  return null;
}

function buildSubtitleApiUrl(tmdbId, type, season, episode) {
  if (type === 'tv') {
    return `https://sub.1x2.space/api/tv/${tmdbId}/${season}/${episode}`;
  }
  return `https://sub.1x2.space/api/movie/${tmdbId}`;
}

export async function getStreamUrl(tmdbId, type = 'movie', season = null, episode = null) {
  const result = await trySourceApi(tmdbId);
  if (result) return result;

  const xplayUrl = type === 'tv'
    ? `${XPLAY_HOST}/e/tv/${tmdbId}/${season}/${episode}?autostart=true`
    : `${XPLAY_HOST}/e/movie/${tmdbId}?autostart=true`;

  console.log(`[xpass] Trying ${xplayUrl}`);
  const xplayResult = await extractPlaylistJson(xplayUrl);
  if (xplayResult) return xplayResult;

  const fallbackSubs = await fetchSubtitleApi(buildSubtitleApiUrl(tmdbId, type, season, episode));
  if (fallbackSubs && fallbackSubs.length > 0) {
    return { streamUrl: null, subtitles: fallbackSubs };
  }

  const msg = `No stream source available for tmdb=${tmdbId}, type=${type}${season ? ` s${season}e${episode}` : ''}`;
  throw new Error(msg);
}

export async function closeBrowser() {}