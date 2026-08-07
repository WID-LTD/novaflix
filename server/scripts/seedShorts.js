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

const TARGET = 100

// Playable sample MP4 pool (public Google sample bucket) so seeded shorts render in <video>.
const SAMPLE_VIDEOS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
]

const SHORT_LINES = [
  'Behind the scenes with {name}',
  '{name} reacts to a fan edit',
  'Exclusive clip with {name}',
  'A day in the life of {name}',
  '{name} on set moments',
  'Quick Q&A with {name}',
  '{name} comedy outtake',
  'The best {name} scene you missed',
  'Studio vlog — {name}',
  '{name} answers top fan questions',
]

const HASHTAGS = ['fyp', 'novaflix', 'shorts', 'backstage', 'actor', 'celebrity', 'exclusive', 'behindthescenes']

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randN(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function slugOf(name) { return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Load artists already seeded by seedArtists.js (users joined to creator_profiles with a tmdb id).
async function loadArtists() {
  const { rows } = await pool.query(
    `SELECT u.id AS "userId", u.name, u.avatar, cp.tmdb_person_id AS "tmdbId"
     FROM users u
     JOIN creator_profiles cp ON cp.user_id = u.id
     WHERE cp.tmdb_person_id IS NOT NULL
     ORDER BY u.created_at ASC`
  )
  return rows.map(r => ({ userId: r.userId, name: r.name, avatar: r.avatar, tmdbId: r.tmdbId }))
}

// If an artist (cast/crew member) has no seeded user account, create one and link it to the person.
async function createArtistForPerson(person) {
  const email = `${slugOf(person.name)}@novaflix.com`
  const hashed = await bcrypt.hash('1234', 10)
  const userId = uuidv4()
  const avatar = person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null
  await pool.query(
    `INSERT INTO users (id, email, password, name, role, plan, avatar, bio, email_verified)
     VALUES ($1, $2, $3, $4, 'creator', 'premium', $5, '', true)
     ON CONFLICT (email) DO UPDATE SET name = $4, avatar = $5 RETURNING id`,
    [userId, email, hashed, person.name, avatar]
  )
  const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email])
  const actualUserId = rows[0].id
  await pool.query(
    `INSERT INTO creator_profiles (user_id, display_name, bio, avatar, tmdb_person_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET display_name = $2, tmdb_person_id = $5`,
    [actualUserId, person.name, person.known_for_department || '', avatar, person.id]
  )
  return { userId: actualUserId, name: person.name, avatar, tmdbId: person.id }
}

async function fetchPopularPage(page) {
  const { data } = await TMDB.get('/person/popular', { params: { language: 'en-US', page } })
  return data.results || []
}

async function seed() {
  console.log('[seed:shorts] Starting shorts seeding...')

  const clear = process.argv.includes('--clear')
  if (clear) {
    await pool.query(`DELETE FROM shorts WHERE title LIKE '% · Novaflix Short%'`)
    console.log('[seed:shorts] Cleared previously seeded shorts')
  }

  const { rows: existingCount } = await pool.query(
    `SELECT COUNT(*) AS c FROM shorts WHERE title LIKE '% · Novaflix Short%'`
  )
  const already = parseInt(existingCount[0].c, 10) || 0
  if (already >= TARGET && !clear) {
    console.log(`[seed:shorts] ${already} seeded shorts present, skipping (use --clear to reseed)`)
    process.exit(0)
  }

  let artists = await loadArtists()
  console.log(`[seed:shorts] Found ${artists.length} artists in DB`)

  // Top up with new creators when we don't have enough artists yet.
  const usedTmdb = new Set(artists.map(a => a.tmdbId))
  let page = 1
  while (artists.length < TARGET && page <= 30) {
    const people = await fetchPopularPage(page)
    if (people.length === 0) break
    for (const p of people) {
      if (usedTmdb.has(p.id)) continue
      try {
        const created = await createArtistForPerson(p)
        artists.push(created)
        usedTmdb.add(p.id)
      } catch (err) {
        console.warn(`[seed:shorts] createArtist failed for ${p.name}: ${err.message}`)
      }
      if (artists.length >= TARGET) break
    }
    page++
    await sleep(150)
  }

  if (artists.length === 0) throw new Error('No artists available to attach shorts to')

  // Build exactly TARGET shorts (one per artist, cycled if short of people).
  const shorts = []
  for (let i = 0; i < TARGET; i++) {
    const artist = artists[i % artists.length]
    const line = pick(SHORT_LINES).replace('{name}', artist.name)
    shorts.push({
      id: uuidv4(),
      userId: artist.userId,
      title: `${line} · Novaflix Short`,
      description: `${line}. #${pick(HASHTAGS)} #${pick(HASHTAGS)} #${pick(HASHTAGS)}`,
      videoUrl: pick(SAMPLE_VIDEOS),
      thumbnailUrl: artist.avatar || 'https://placehold.co/480x854/111/fff?text=Novaflix',
      durationSeconds: randN(12, 34),
      status: 'active',
      views: randN(500, 25000),
      likes: randN(20, 3000),
      shares: randN(0, 500),
      bookmarks: randN(0, 400),
    })
  }

  let inserted = 0
  for (const s of shorts) {
    await pool.query(
      `INSERT INTO shorts (id, user_id, title, description, video_url, thumbnail_url, duration_seconds, status, views, likes, shares, bookmarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [s.id, s.userId, s.title, s.description, s.videoUrl, s.thumbnailUrl, s.durationSeconds, s.status, s.views, s.likes, s.shares, s.bookmarks]
    )
    inserted++
  }

  const { rows: total } = await pool.query(`SELECT COUNT(*) AS c FROM shorts WHERE status = 'active'`)
  console.log(`[seed:shorts] Inserted ${inserted} shorts across ${artists.length} artists`)
  console.log(`[seed:shorts] Total active shorts in DB now: ${total[0].c}`)
  process.exit(0)
}

seed().catch(err => {
  console.error('[seed:shorts] Fatal:', err.message)
  process.exit(1)
})
