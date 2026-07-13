import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import axios from 'axios'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database.js'

const TMDB = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` },
})

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)
}

async function seed() {
  console.log('[seed] Starting artist seeding...')

  // Check if already seeded
  const { rows: existing } = await pool.query("SELECT COUNT(*) as count FROM users WHERE email LIKE '%@novaflix.com'")
  const { rows: edgeCount } = await pool.query("SELECT COUNT(*) as count FROM artist_graph")
  const alreadySeeded = parseInt(existing[0].count) > 50
  const graphDone = parseInt(edgeCount[0].count) > 0

  if (alreadySeeded && graphDone) {
    console.log(`[seed] Already seeded ${existing[0].count} artists with ${edgeCount[0].count} edges, skipping`)
    process.exit(0)
  }

  let artistIds = []

  if (alreadySeeded) {
    // Load existing artists from DB
    const { rows } = await pool.query(
      `SELECT u.id as "userId", cp.tmdb_person_id as "tmdbId", u.name
       FROM users u
       JOIN creator_profiles cp ON cp.user_id = u.id
       WHERE u.email LIKE '%@novaflix.com'`
    )
    artistIds = rows.map(r => ({ userId: r.userId, tmdbId: r.tmdbId, name: r.name }))
    console.log(`[seed] Loaded ${artistIds.length} existing artists from DB`)
  } else {
    // Fetch popular people from TMDB (pages 1-5 = 100 people)
    const allPeople = []
    for (let page = 1; page <= 5; page++) {
      const { data } = await TMDB.get('/person/popular', { params: { language: 'en-US', page } })
      allPeople.push(...data.results)
      console.log(`[seed] Fetched page ${page} (${data.results.length} people)`)
      await sleep(250)
    }

    console.log(`[seed] Total people: ${allPeople.length}. Creating accounts...`)

    for (const person of allPeople) {
      try {
        const email = `${slug(person.name)}@novaflix.com`
        const hashed = await bcrypt.hash('1234', 10)
        const userId = uuidv4()

        const { data: details } = await TMDB.get(`/person/${person.id}`, {
          params: { language: 'en-US', append_to_response: 'movie_credits' },
        })

        const { rows } = await pool.query(
          `INSERT INTO users (id, email, password, name, role, plan, avatar, bio, email_verified)
           VALUES ($1, $2, $3, $4, 'creator', 'premium', $5, $6, true)
           ON CONFLICT (email) DO UPDATE SET name = $4, avatar = $5, bio = $6 RETURNING id`,
          [userId, email, hashed, person.name,
            person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null,
            details.biography?.slice(0, 500) || '']
        )
        const actualUserId = rows[0]?.id || userId

        await pool.query(
          `INSERT INTO creator_profiles (user_id, display_name, bio, avatar, tmdb_person_id, known_for_department)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id) DO UPDATE SET display_name = $2, tmdb_person_id = $5, known_for_department = $6`,
          [actualUserId, person.name, details.biography?.slice(0, 500) || '',
            person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null,
            person.id, person.known_for_department]
        )

        artistIds.push({ userId: actualUserId, tmdbId: person.id, name: person.name })
        console.log(`[seed] Created: ${email}`)
        await sleep(200)
      } catch (err) {
        console.error(`[seed] Failed for ${person.name}: ${err.message}`)
      }
    }
  }

  console.log(`[seed] Found ${artistIds.length} artists. Building collaboration graph...`)

  // Build graph: for each artist, get their movie credits and link co-stars
  for (let i = 0; i < artistIds.length; i++) {
    const artist = artistIds[i]
    try {
      const { data: credits } = await TMDB.get(`/person/${artist.tmdbId}/movie_credits`, {
        params: { language: 'en-US' },
      })

      const movieIds = new Set()
      for (const c of credits.cast || []) movieIds.add(c.id)
      for (const c of credits.crew || []) movieIds.add(c.id)

      const movieList = [...movieIds].slice(0, 10)

      for (const movieId of movieList) {
        try {
          const { data: movieCredits } = await TMDB.get(`/movie/${movieId}/credits`, {
            params: { language: 'en-US' },
          })

          const castNames = new Map()
          for (const c of movieCredits.cast || []) castNames.set(c.id, c.name)
          for (const c of movieCredits.crew || []) {
            if (!castNames.has(c.id)) castNames.set(c.id, c.name)
          }

          const movieTitle = movieCredits.id
            ? (await TMDB.get(`/movie/${movieId}`, { params: { language: 'en-US' } })).data.title
            : 'Unknown'

          for (const other of artistIds) {
            if (other.userId === artist.userId) continue
            if (castNames.has(other.tmdbId)) {
              await pool.query(
                `INSERT INTO artist_graph (person_a_id, person_b_id, movie_id, movie_title, role_a, role_b)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (person_a_id, person_b_id, movie_id)
                 DO UPDATE SET weight = artist_graph.weight + 1`,
                [artist.userId, other.userId, String(movieId), movieTitle, 'Actor', 'Actor']
              )
              await pool.query(
                `INSERT INTO artist_graph (person_a_id, person_b_id, movie_id, movie_title, role_a, role_b)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (person_a_id, person_b_id, movie_id)
                 DO UPDATE SET weight = artist_graph.weight + 1`,
                [other.userId, artist.userId, String(movieId), movieTitle, 'Actor', 'Actor']
              )
            }
          }
          await sleep(100)
        } catch (err) { /* skip single movie failures */ }
      }

      console.log(`[seed] Graph built for ${artist.name} (${i + 1}/${artistIds.length})`)
      await sleep(300)
    } catch (err) {
      console.error(`[seed] Graph failed for ${artist.name}: ${err.message}`)
    }
  }

  console.log('[seed] Done! Artists seeded and graph built.')
  process.exit(0)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

seed().catch(err => {
  console.error('[seed] Fatal:', err.message)
  process.exit(1)
})
