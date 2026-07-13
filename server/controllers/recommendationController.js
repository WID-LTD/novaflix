import { getWatchHistory } from '../db.js'

const TMDB_BASE = 'https://api.themoviedb.org/3'

function getTmdbClient(req) {
  return req.app.locals.tmdb
}

export async function getRecommendations(req, res) {
  try {
    const history = await getWatchHistory(req.userId)
    const tmdb = getTmdbClient(req)

    const watchedGenres = new Set()
    const watchedIds = new Set()

    for (const entry of history) {
      watchedIds.add(entry.content_id)
    }

    const results = []

    if (watchedIds.size > 0) {
      const ids = [...watchedIds].slice(0, 5)
      for (const id of ids) {
        try {
          const { data } = await tmdb.get(`/movie/${id}`, { params: { language: 'en-US' } })
          if (data.genres) {
            data.genres.forEach(g => watchedGenres.add(g.id))
          }
        } catch {}
      }

      if (watchedGenres.size > 0) {
        const genreIds = [...watchedGenres].slice(0, 3).join(',')
        const { data } = await tmdb.get('/discover/movie', {
          params: { with_genres: genreIds, language: 'en-US', sort_by: 'vote_average.desc', 'vote_count.gte': 50 },
        })
        for (const item of data.results || []) {
          if (!watchedIds.has(item.id)) {
            results.push(normalizeMovie(item, 'movie'))
            if (results.length >= 10) break
          }
        }
      }
    }

    if (results.length < 6) {
      const { data } = await tmdb.get('/trending/movie/week', { params: { language: 'en-US' } })
      for (const item of data.results || []) {
        if (!watchedIds.has(item.id) && !results.find(r => r.id === item.id)) {
          results.push(normalizeMovie(item, 'movie'))
          if (results.length >= 12) break
        }
      }
    }

    res.json({ success: true, data: results })
  } catch (err) {
    console.error('[recommendations] Error:', err.message)
    res.json({ success: false, data: [], error: err.message })
  }
}

export async function getTrending(req, res) {
  try {
    const tmdb = getTmdbClient(req)
    const [movieRes, tvRes] = await Promise.all([
      tmdb.get('/trending/movie/week', { params: { language: 'en-US' } }),
      tmdb.get('/trending/tv/week', { params: { language: 'en-US' } }),
    ])
    const movies = (movieRes.data.results || []).map(m => normalizeMovie(m, 'movie'))
    const tv = (tvRes.data.results || []).map(t => normalizeMovie(t, 'tv'))
    res.json({ success: true, data: { movies, tv } })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
}

export async function getSimilar(req, res) {
  try {
    const { id } = req.params
    const type = req.query.type || 'movie'
    const tmdb = getTmdbClient(req)
    const { data } = await tmdb.get(`/${type}/${id}/similar`, { params: { language: 'en-US' } })
    const results = (data.results || []).map(m => normalizeMovie(m, type))
    res.json({ success: true, data: results.slice(0, 10) })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
}

function normalizeMovie(m, type) {
  return {
    id: m.id,
    title: m.title || m.name,
    year: (m.release_date || m.first_air_date || '').split('-')[0] || 'N/A',
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    overview: m.overview || '',
    type,
    rating: m.vote_average || 0,
  }
}
