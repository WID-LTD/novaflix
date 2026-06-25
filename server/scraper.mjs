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

async function trySourceApi(tmdbId) {
  for (const source of SOURCE_API_URLS) {
    try {
      const res = await axios.get(source.url(tmdbId), {
        headers: { ...COMMON_HEADERS, Referer: source.referer },
        timeout: 10000,
      });
      const data = res.data;
      if (data.status_code === '200' && data.data?.stream_urls?.length) {
        return {
          streamUrl: data.data.stream_urls[0],
          subtitles: (data.data.default_subs || []).map((s) => ({
            label: s.label || 'Unknown',
            file: s.file,
          })),
        };
      }
    } catch {}
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

async function extractPlaylistJson(pageUrl) {
  const res = await axios.get(pageUrl, {
    headers: { ...COMMON_HEADERS, Referer: 'https://www.2embed.skin/' },
    timeout: 15000,
  });

  const playlistPaths = extractPlaylistPaths(res.data);
  console.log(`[xpass] Found ${playlistPaths.length} playlist paths at ${pageUrl}`);
  if (playlistPaths.length > 0) console.log(`[xpass] First path: ${playlistPaths[0]}`);

  for (const path of playlistPaths) {
    try {
      const url = `${XPLAY_HOST}${path}`;
      const plRes = await axios.get(url, {
        headers: { ...COMMON_HEADERS, Referer: XPLAY_HOST + '/' },
        timeout: 10000,
      });
      const plData = plRes.data;
      const sources = plData?.playlist?.[0]?.sources || [];
      for (const source of sources) {
        if (source.file && source.type === 'hls') {
          const tracks = plData?.playlist?.[0]?.tracks || [];
          const subtitles = tracks
            .filter((t) => t.kind === 'captions' || t.kind === 'subtitles')
            .map((t) => ({
              label: t.label || 'Unknown',
              file: t.file,
            }));
          return {
            streamUrl: source.file,
            subtitles,
          };
        }
      }
    } catch {}
  }
  return null;
}

export async function getStreamUrl(tmdbId, type = 'movie', season = null, episode = null) {
  if (type === 'movie') {
    const result = await trySourceApi(tmdbId);
    if (result) return result;
  }

  const xplayUrl = type === 'tv'
    ? `${XPLAY_HOST}/e/tv/${tmdbId}/${season}/${episode}?autostart=true`
    : `${XPLAY_HOST}/e/movie/${tmdbId}?autostart=true`;

  console.log(`[xpass] Trying ${xplayUrl}`);
  const result = await extractPlaylistJson(xplayUrl);
  if (result) return result;

  const msg = `No stream source available for tmdb=${tmdbId}, type=${type}${season ? ` s${season}e${episode}` : ''}`;
  throw new Error(msg);
}

export async function closeBrowser() {}
