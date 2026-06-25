import axios from 'axios';

const SOURCES = [
  { url: (id) => `https://nextgencloudfabric.com/embed/source-api.php?tmdb=${id}`,
    referer: 'https://nextgencloudfabric.com/' },
  { url: (id) => `https://vidsrc.pm/embed/source-api.php?tmdb=${id}`,
    referer: 'https://vidsrc.pm/' },
];

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

export async function getStreamUrl(tmdbId, type = 'movie', season = null, episode = null) {
  const params = { tmdb: tmdbId };
  if (type === 'tv' && season && episode) {
    params.s = season;
    params.e = episode;
  }

  for (const source of SOURCES) {
    try {
      const res = await axios.get(source.url(tmdbId), {
        params,
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
      } else {
        console.error(`[${source.referer}] returned status=${data.status_code}, no stream_urls for tmdb=${tmdbId}`);
      }
    } catch (err) {
      console.error(`[${source.referer}] failed for tmdb=${tmdbId}: ${err.message}`);
    }
  }

  const msg = `No stream source available for tmdb=${tmdbId}, type=${type}${season ? ` s${season}e${episode}` : ''}`;
  console.error(msg);
  throw new Error(msg);
}

export async function closeBrowser() {}
