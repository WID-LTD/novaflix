export function search(req, res) {
  const { query, type } = req.query
  if (!query) return res.status(400).json({ error: 'Query param is required' })

  const mediaType = type === 'tv' ? 'tv' : 'movie'
  const tmdb = req.app.locals.tmdb

  tmdb.get(`/search/${mediaType}`, {
    params: { query, language: 'en-US', page: 1 },
  })
    .then(({ data }) => {
      const results = data.results.map((m) => ({
        id: m.id,
        title: m.title || m.name,
        year: (m.release_date || m.first_air_date || '').split('-')[0] || 'N/A',
        poster: m.poster_path
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : null,
        backdrop: m.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`
          : null,
        overview: m.overview || '',
        type: mediaType,
        premium: (m.vote_average || 0) >= 8,
      }))
      res.json({ success: true, data: results })
    })
    .catch((err) => {
      console.error(err.message)
      res.json({ success: false, error: 'Failed to resolve metadata from TMDB' })
    })
}

export function details(req, res) {
  const { id, type } = req.query
  if (!id) return res.status(400).json({ error: 'TMDB ID is required' })

  const mediaType = type === 'tv' ? 'tv' : 'movie'
  const tmdb = req.app.locals.tmdb

  Promise.all([
    tmdb.get(`/${mediaType}/${id}`, { params: { language: 'en-US' } }),
    tmdb.get(`/${mediaType}/${id}/videos`, { params: { language: 'en-US' } }),
  ])
    .then(([detailRes, videosRes]) => {
      const media = detailRes.data
      const trailer = videosRes.data.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      )

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
        premium: (media.vote_average || 0) >= 8,
      }

      if (mediaType === 'tv') {
        base.seasons = (media.seasons || [])
          .filter((s) => s.season_number > 0)
          .map((s) => ({
            season: s.season_number,
            episodes: s.episode_count,
            name: s.name,
          }))
        base.runtime = media.episode_run_time?.[0] || null
        base.totalSeasons = media.number_of_seasons
      } else {
        base.runtime = media.runtime
      }

      res.json({ success: true, data: base })
    })
    .catch((err) => {
      console.error(err.message)
      res.json({ success: false, error: 'Failed to fetch details' })
    })
}

const MIN_YEAR = new Date().getFullYear() - 2

export function getTrending(req, res) {
  const tmdb = req.app.locals.tmdb

  Promise.all([
    tmdb.get('/trending/movie/week', { params: { language: 'en-US' } }),
    tmdb.get('/trending/tv/week', { params: { language: 'en-US' } }),
  ])
    .then(([movieRes, tvRes]) => {
      const movies = (movieRes.data.results || [])
        .map((m) => ({
          id: m.id,
          title: m.title || m.name,
          year: (m.release_date || m.first_air_date || '').split('-')[0] || 'N/A',
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
          overview: m.overview || '',
          type: 'movie',
          premium: (m.vote_average || 0) >= 8,
        }))
        .filter((m) => {
          const y = parseInt(m.year)
          return !isNaN(y) && y >= MIN_YEAR
        })
      const tv = (tvRes.data.results || [])
        .map((t) => ({
          id: t.id,
          title: t.name || t.title,
          year: (t.first_air_date || t.release_date || '').split('-')[0] || 'N/A',
          poster: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
          backdrop: t.backdrop_path ? `https://image.tmdb.org/t/p/w1280${t.backdrop_path}` : null,
          overview: t.overview || '',
          type: 'tv',
          premium: (t.vote_average || 0) >= 8,
        }))
        .filter((t) => {
          const y = parseInt(t.year)
          return !isNaN(y) && y >= MIN_YEAR
        })
      res.json({ success: true, data: { movies, tv } })
    })
    .catch((err) => {
      console.error(err.message)
      res.json({ success: false, error: 'Failed to fetch trending' })
    })
}

export function getNowPlaying(req, res) {
  const tmdb = req.app.locals.tmdb

  tmdb.get('/movie/now_playing', { params: { language: 'en-US', page: 1 } })
    .then(({ data }) => {
      const results = (data.results || [])
        .map((m) => ({
          id: m.id,
          title: m.title || m.name,
          year: (m.release_date || '').split('-')[0] || 'N/A',
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
          overview: m.overview || '',
          type: 'movie',
          premium: (m.vote_average || 0) >= 8,
        }))
        .filter((m) => {
          const y = parseInt(m.year)
          return !isNaN(y) && y >= MIN_YEAR
        })
      res.json({ success: true, data: results })
    })
    .catch((err) => {
      console.error(err.message)
      res.json({ success: false, error: 'Failed to fetch now playing' })
    })
}

export function getGenres(req, res) {
  const tmdb = req.app.locals.tmdb
  const type = req.query.type === 'tv' ? 'tv' : 'movie'

  tmdb.get(`/genre/${type}/list`, { params: { language: 'en-US' } })
    .then(({ data }) => {
      res.json({ success: true, data: data.genres || [] })
    })
    .catch((err) => {
      console.error(err.message)
      res.json({ success: false, error: 'Failed to fetch genres' })
    })
}

export function getCategoryMovies(req, res) {
  const tmdb = req.app.locals.tmdb
  const { id, type, page } = req.query
  if (!id) return res.status(400).json({ error: 'Genre ID is required' })

  const mediaType = type === 'tv' ? 'tv' : 'movie'
  const pageNum = Math.min(Math.max(parseInt(page, 10) || 1, 1), 500)

  tmdb.get(`/discover/${mediaType}`, {
    params: { with_genres: id, language: 'en-US', sort_by: 'popularity.desc', page: pageNum },
  })
    .then(({ data }) => {
      const results = (data.results || []).map((m) => ({
        id: m.id,
        title: m.title || m.name,
        year: (m.release_date || m.first_air_date || '').split('-')[0] || 'N/A',
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
        overview: m.overview || '',
        type: mediaType,
        premium: (m.vote_average || 0) >= 8,
      }))

      res.json({ success: true, data: results, total_pages: data.total_pages || 1, page: pageNum })
    })
    .catch((err) => res.status(500).json({ error: err.message }))
}

export async function seedActors(req, res) {
  const tmdb = req.app.locals.tmdb
  const { upsertActor } = await import('../db.js')

  const pages = Math.min(parseInt(req.query.pages, 10) || 3, 3)
  let count = 0

  try {
    for (let page = 1; page <= pages; page++) {
      const { data } = await tmdb.get('/person/popular', {
        params: { language: 'en-US', page },
      })
      for (const person of data.results || []) {
        await upsertActor({
          tmdbId: person.id,
          name: person.name,
          avatar: person.profile_path
            ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
            : null,
          biography: person.biography || '',
          knownForDepartment: person.known_for_department || '',
          popularity: person.popularity || 0,
        })
        count++
      }
    }
    res.json({ success: true, data: { seeded: count } })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ success: false, error: 'Failed to seed actors' })
  }
}

export function tvSeason(req, res) {
  const { id, season } = req.query
  if (!id || !season) return res.status(400).json({ error: 'ID and season required' })

  const tmdb = req.app.locals.tmdb

  tmdb.get(`/tv/${id}/season/${season}`, {
    params: { language: 'en-US' },
  })
    .then(({ data }) => {
      res.json({
        success: true,
        episodes: (data.episodes || []).map((e) => ({
          episode: e.episode_number,
          name: e.name,
        })),
      })
    })
    .catch((err) => {
      console.error(err.message)
      res.json({ success: false, error: 'Failed to fetch season data' })
    })
}
