import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import { spawn } from 'child_process';
import { getStreamUrl, closeBrowser } from './scraper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3030;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  const candidates = [
    'ffmpeg',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-8.1.1-full_build', 'bin', 'ffmpeg.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1-full_build', 'bin', 'ffmpeg.exe'),
    'C:\\tools\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
  ];
  for (const c of candidates) {
    try {
      if (c === 'ffmpeg') {
        const r = spawn.sync(c, ['-version'], { stdio: 'pipe', timeout: 3000 });
        if (r.status === 0) { return c; }
      } else if (fs.existsSync(c)) {
        return c;
      }
    } catch {}
  }
  return 'ffmpeg';
}

let ffmpegPath = resolveFfmpeg();
console.log(`[ffmpeg] using: ${ffmpegPath}`);

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function parseMasterManifest(masterUrl) {
  const response = await axios.get(masterUrl, {
    headers: { 'User-Agent': UA, Referer: 'https://nextgencloudfabric.com/' },
    timeout: 15000,
  });
  const body = response.data;
  const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);
  const variants = [];
  const lines = body.split('\n');
  let currentStreamInf = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXT-X-STREAM-INF:')) {
      const bwMatch = trimmed.match(/BANDWIDTH=(\d+)/i);
      const resMatch = trimmed.match(/RESOLUTION=(\d+x\d+)/i);
      currentStreamInf = {
        bandwidth: bwMatch ? parseInt(bwMatch[1]) : 0,
        resolution: resMatch ? resMatch[1] : null,
      };
    } else if (currentStreamInf && trimmed && !trimmed.startsWith('#')) {
      const variantUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
      variants.push({
        resolution: currentStreamInf.resolution,
        bandwidth: currentStreamInf.bandwidth,
        url: variantUrl,
        label: currentStreamInf.resolution ? `${currentStreamInf.resolution.split('x')[1]}p` : `${Math.round(currentStreamInf.bandwidth / 1000)}kbps`,
      });
      currentStreamInf = null;
    }
  }

  variants.sort((a, b) => (parseInt(a.resolution?.split('x')[1]) || 0) - (parseInt(b.resolution?.split('x')[1]) || 0));
  return variants;
}

app.use(cors());
app.use(express.json());

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

app.get('/api/search', async (req, res) => {
  const { query, type } = req.query;
  if (!query) return res.status(400).json({ error: 'Query param is required' });

  const mediaType = type === 'tv' ? 'tv' : 'movie';

  try {
    const { data } = await tmdb.get(`/search/${mediaType}`, {
      params: { query, language: 'en-US', page: 1 },
    });

    const results = data.results.map((m) => ({
      id: m.id,
      title: m.title || m.name,
      year: (m.release_date || m.first_air_date || '').split('-')[0] || 'N/A',
      poster: m.poster_path
        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
        : null,
      overview: m.overview || '',
      type: mediaType,
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err.message);
    res.json({ success: false, error: 'Failed to resolve metadata from TMDB' });
  }
});

app.get('/api/details', async (req, res) => {
  const { id, type } = req.query;
  if (!id) return res.status(400).json({ error: 'TMDB ID is required' });

  const mediaType = type === 'tv' ? 'tv' : 'movie';

  try {
    const [detailRes, videosRes] = await Promise.all([
      tmdb.get(`/${mediaType}/${id}`, { params: { language: 'en-US' } }),
      tmdb.get(`/${mediaType}/${id}/videos`, { params: { language: 'en-US' } }),
    ]);

    const media = detailRes.data;
    const trailer = videosRes.data.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    const base = {
      id: media.id,
      title: media.title || media.name,
      year: (media.release_date || media.first_air_date || '').split('-')[0] || 'N/A',
      releaseDate: media.release_date || media.first_air_date || null,
      poster: media.poster_path
        ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
        : null,
      backdrop: media.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
        : null,
      overview: media.overview || '',
      rating: media.vote_average || 0,
      genres: (media.genres || []).map((g) => g.name),
      trailerKey: trailer ? trailer.key : null,
      type: mediaType,
    };

    if (mediaType === 'tv') {
      base.seasons = (media.seasons || [])
        .filter((s) => s.season_number > 0)
        .map((s) => ({
          season: s.season_number,
          episodes: s.episode_count,
          name: s.name,
        }));
      base.runtime = media.episode_run_time?.[0] || null;
      base.totalSeasons = media.number_of_seasons;
    } else {
      base.runtime = media.runtime;
    }

    res.json({ success: true, data: base });
  } catch (err) {
    console.error(err.message);
    res.json({ success: false, error: 'Failed to fetch details' });
  }
});

app.get('/api/tv-season', async (req, res) => {
  const { id, season } = req.query;
  if (!id || !season) return res.status(400).json({ error: 'ID and season required' });

  try {
    const { data } = await tmdb.get(`/tv/${id}/season/${season}`, {
      params: { language: 'en-US' },
    });
    res.json({
      success: true,
      episodes: (data.episodes || []).map((e) => ({
        episode: e.episode_number,
        name: e.name,
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.json({ success: false, error: 'Failed to fetch season data' });
  }
});

app.get('/api/source', async (req, res) => {
  const { id, type, season, episode } = req.query;
  if (!id) return res.status(400).json({ error: 'TMDB ID is required' });

  try {
    const result = await getStreamUrl(
      id,
      type || 'movie',
      season || null,
      episode || null
    );

    const proxyUrl = `/api/proxy/${result.streamUrl.replace('https://', '')}`;

    const subtitles = (result.subtitles || []).map((s) => ({
      label: s.label,
      file: s.file.replace('https://', '/api/proxy/'),
    }));

    res.json({
      success: true,
      streamUrl: proxyUrl,
      directUrl: result.streamUrl,
      subtitles,
    });
  } catch (err) {
    console.error(`[api/source] id=${id} type=${type || 'movie'} season=${season || '-'} episode=${episode || '-'}: ${err.message}`);
    let releaseDate = null;
    try {
      const tmdbRes = await tmdb.get(`/${type === 'tv' ? 'tv' : 'movie'}/${id}`, {
        params: { language: 'en-US' },
      });
      releaseDate = tmdbRes.data.release_date || tmdbRes.data.first_air_date || null;
    } catch {}
    res.json({ success: false, error: err.message, releaseDate });
  }
});

app.get('/api/manifest-info', async (req, res) => {
  const { url, id, type, season, episode } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const cdnUrl = url.startsWith('/api/proxy/')
      ? 'https://' + url.replace('/api/proxy/', '')
      : url;

    const variants = await parseMasterManifest(cdnUrl);
    let duration = 0;

    if (id && type) {
      try {
        let runtime = 0;
        if (type === 'tv' && season && episode) {
          const ep = await tmdb.get(`/tv/${id}/season/${season}/episode/${episode}`, { params: { language: 'en-US' } });
          runtime = ep.data.runtime || 0;
        }
        if (!runtime) {
          const tm = await tmdb.get(`/${type}/${id}`, { params: { language: 'en-US' } });
          runtime = tm.data.runtime || tm.data.episode_run_time?.[0] || 0;
        }
        duration = runtime * 60;
      } catch {}
    }

    const compressedRatio = (h) => {
      if (h >= 1080) return 0.30;
      if (h >= 720) return 0.35;
      if (h >= 480) return 0.40;
      return 0.45;
    };

    const variantsWithSize = variants.map((v) => {
      const height = parseInt(v.resolution?.split('x')[1]) || 0;
      const origBytes = duration > 0 ? Math.round(v.bandwidth / 8 * duration) : 0;
      const compBytes = duration > 0 ? Math.round(origBytes * compressedRatio(height)) : 0;
      return {
        ...v,
        sizeBytes: origBytes,
        sizeLabel: duration > 0 ? formatSize(origBytes) : 'Unknown',
        compressedBytes: compBytes,
        compressedLabel: duration > 0 ? `~${formatSize(compBytes)}` : 'Unknown',
      };
    });

    res.json({ success: true, duration, variants: variantsWithSize });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/download', async (req, res) => {
  const { url, title, variant, compress } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const safeTitle = title
    ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : 'video';

  try {
    let cdnUrl = url.startsWith('/api/proxy/')
      ? 'https://' + url.replace('/api/proxy/', '')
      : url;

    if (variant) {
      cdnUrl = variant;
    }

    const cdnHost = new URL(cdnUrl).hostname;
    const dlReferer = cdnHost.includes('remoteconsultinggroup') ? 'https://nextgencloudfabric.com/' : cdnHost.includes('tik.1x2') || cdnHost.includes('tiktokcdn') ? 'https://tik.1x2.space/' : 'https://nextgencloudfabric.com/';
    const dlHeaders = `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\nReferer: ${dlReferer}\r\nOrigin: ${dlReferer.replace(/\/$/, '')}\r\n`;

    // Probe: verify stream is accessible before sending download headers
    const probeArgs = [
      '-headers', dlHeaders,
      '-allowed_extensions', 'ALL',
      '-t', '1',
      '-i', cdnUrl,
      '-f', 'null',
      '-',
    ];
    const probe = spawn(ffmpegPath, probeArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
    const probeResult = await new Promise((resolve) => {
      let stderr = '';
      probe.stderr.on('data', (d) => { stderr += d.toString(); });
      probe.on('close', (code) => resolve({ code, stderr }));
    });
    if (probeResult.code !== 0) {
      console.error('[dl probe] stream not accessible:', probeResult.stderr.slice(0, 300));
      return res.status(400).json({ error: 'Stream not accessible' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Transfer-Encoding', 'chunked');

    const ffArgs = [
      '-headers', dlHeaders,
      '-allowed_extensions', 'ALL',
      '-i', cdnUrl,
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      '-loglevel', 'error',
      '-y',
      'pipe:1',
    ];

    if (compress === 'true') {
      ffArgs.splice(ffArgs.length - 4, 0,
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'fast',
        '-c:a', 'aac',
        '-b:a', '128k',
      );
    } else {
      ffArgs.splice(ffArgs.length - 4, 0,
        '-c', 'copy',
        '-bsf:a', 'aac_adtstoasc',
      );
    }

    const ffmpeg = spawn(ffmpegPath, ffArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderrData = '';
    ffmpeg.stderr.on('data', (chunk) => { stderrData += chunk.toString(); });
    ffmpeg.stderr.on('end', () => {
      if (stderrData.trim()) console.error('ffmpeg stderr:', stderrData);
    });

    ffmpeg.stdout.pipe(res);

    ffmpeg.on('error', (err) => {
      console.error('ffmpeg error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'ffmpeg not found', detail: err.message });
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && !res.headersSent) {
        console.error('ffmpeg exited with code', code, stderrData);
        res.status(500).json({ error: 'Download failed', code, detail: stderrData.slice(0, 500) });
      }
    });

    req.on('close', () => {
      ffmpeg.kill('SIGTERM');
    });
  } catch (err) {
    console.error(err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
  }
});

app.get('/api/proxy/*', async (req, res) => {
  const fullPath = req.params[0];
  if (!fullPath) return res.status(400).send('path required');

  const url = 'https://' + fullPath;
  const hostname = new URL(url).hostname;

  const referers = [
    'https://tik.1x2.space/',
    'https://nextgencloudfabric.com/',
    'https://play.xpass.top/',
    'https://p16-sg.tiktokcdn.com/',
  ];

  const tryFetch = async (ref) => {
    return axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: ref,
        Origin: ref.replace(/\/$/, ''),
      },
    });
  };

  let response = null;
  for (const ref of referers) {
    try {
      response = await tryFetch(ref);
      if (response.status === 200) break;
    } catch {}
  }

  if (!response || response.status !== 200) {
    console.error('[proxy] failed all referers for', hostname);
    return res.status(502).send('Proxy failed');
  }

  try {
    const contentType = response.headers['content-type'] || '';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (contentType.includes('m3u8') || contentType.includes('application/vnd.apple.mpegurl')) {
      let body = '';
      response.data.on('data', (chunk) => { body += chunk.toString(); });
      response.data.on('end', () => {
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        const rewritten = body.split('\n').map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return line.replace('https://', '/api/proxy/');
          }
          const resolved = new URL(trimmed, baseUrl).href;
          return resolved.replace('https://', '/api/proxy/');
        }).join('\n');
        res.send(rewritten);
      });
    } else {
      response.data.pipe(res);
    }
  } catch (err) {
    console.error('[proxy] stream error:', err.message);
    if (!res.headersSent) res.status(500).send('Proxy stream failed');
  }
});

const server = app.listen(PORT, () => {
  console.log(`NovaFlix engine alive on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await closeBrowser();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  server.close(() => process.exit(0));
});
