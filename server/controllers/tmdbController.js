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
        overview: m.overview || '',
        type: mediaType,
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
