import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { getStreamUrl } from './scraper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query param is required' });

  try {
    const { data } = await tmdb.get('/search/movie', {
      params: { query, language: 'en-US', page: 1 },
    });

    const results = data.results.map((m) => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
      poster: m.poster_path
        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
        : null,
      overview: m.overview,
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to resolve metadata from TMDB' });
  }
});

app.get('/api/details', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'TMDB ID is required' });

  try {
    const [detailRes, videosRes] = await Promise.all([
      tmdb.get(`/movie/${id}`, { params: { language: 'en-US' } }),
      tmdb.get(`/movie/${id}/videos`, { params: { language: 'en-US' } }),
    ]);

    const movie = detailRes.data;
    const trailer = videosRes.data.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    res.json({
      success: true,
      data: {
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
        releaseDate: movie.release_date || null,
        poster: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        backdrop: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : null,
        overview: movie.overview,
        rating: movie.vote_average,
        genres: movie.genres.map((g) => g.name),
        runtime: movie.runtime,
        trailerKey: trailer ? trailer.key : null,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
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

    res.json({
      success: true,
      streamUrl: proxyUrl,
      subtitles: result.subtitles || [],
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

app.get('/api/download', async (req, res) => {
  const { url, title } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const safeTitle = title
    ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : 'video';

  try {
    const cdnUrl = url.startsWith('/api/proxy/')
      ? 'https://' + url.replace('/api/proxy/', '')
      : url;

    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Transfer-Encoding', 'chunked');

    const ffmpeg = spawn('ffmpeg', [
      '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '-referer', 'https://nextgencloudfabric.com/',
      '-i', cdnUrl,
      '-c', 'copy',
      '-bsf:a', 'aac_adtstoasc',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      '-loglevel', 'error',
      '-y',
      'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderrData = '';
    ffmpeg.stderr.on('data', (chunk) => { stderrData += chunk.toString(); });
    ffmpeg.stderr.on('end', () => {
      if (stderrData.trim()) console.error('ffmpeg stderr:', stderrData);
    });

    ffmpeg.stdout.pipe(res);

    ffmpeg.on('error', (err) => {
      console.error('ffmpeg error:', err.message);
      if (!res.headersSent) res.status(500).send('Download failed');
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && !res.headersSent) {
        console.error('ffmpeg exited with code', code);
        res.status(500).send('Download failed');
      }
    });

    req.on('close', () => {
      ffmpeg.kill('SIGTERM');
    });
  } catch (err) {
    console.error(err.message);
    if (!res.headersSent) res.status(500).send('Download failed');
  }
});

app.get('/api/proxy/*', async (req, res) => {
  const fullPath = req.params[0];
  if (!fullPath) return res.status(400).send('path required');

  const url = 'https://' + fullPath;

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://nextgencloudfabric.com/',
      },
    });

    const contentType = response.headers['content-type'] || '';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

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
    console.error(err.message);
    res.status(500).send('Proxy failed');
  }
});

app.listen(PORT, () => {
  console.log(`NovaFlix engine alive on http://localhost:${PORT}`);
});
