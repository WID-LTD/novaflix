import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') })
import pool from '../config/database.js'

await new Promise(r => setTimeout(r, 2500))

const items = [
  ['Rising Star', 'badge', 'Every legend starts somewhere', 120, '✨', 'common'],
  ['Popcorn Fan', 'badge', 'For the true movie night regulars', 150, '🍿', 'common'],
  ['Movie Buff', 'badge', 'You know your classics', 180, '🎬', 'common'],
  ['Night Owl', 'badge', 'For late night watchers', 240, '🦉', 'common'],
  ['Scene Stealer', 'title', 'Impossible to ignore', 300, '🎭', 'rare'],
  ['Plot Genius', 'badge', 'For trivia champions', 500, '🧠', 'rare'],
  ['Horror Scholar', 'title', 'For the brave', 600, '🧛', 'rare'],
  ['Action Hero', 'badge', 'Explosions and one-liners', 700, '💥', 'rare'],
  ['Neon Frame', 'avatar_frame', 'A glowing neon avatar frame', 1200, '🖼️', 'epic'],
  ['Silver Screen', 'title', 'Classic Hollywood glamour', 1500, '🎞️', 'epic'],
  ['Gold Frame', 'avatar_frame', 'Premium gold avatar frame', 1800, '🪙', 'epic'],
  ["Director's Cut", 'title', 'The vision behind the camera', 2000, '🎬', 'epic'],
  ['Crystal Frame', 'avatar_frame', 'Fractured light, pure prestige', 3000, '🔮', 'legendary'],
  ['Trivia Titan', 'badge', 'Conquered a hundred quizzes', 4000, '🏆', 'legendary'],
  ['Oscar Worthy', 'title', 'The performance of a lifetime', 5000, '🥇', 'legendary'],
  ['Hollywood Legend', 'title', 'Your name in lights, forever', 6500, '⭐', 'legendary'],
]

try {
  await pool.query(`UPDATE cosmetics SET active = FALSE WHERE price = 0`)
  let updated = 0, inserted = 0
  for (const [name, kind, description, price, icon, rarity] of items) {
    const { rows } = await pool.query(
      `UPDATE cosmetics SET kind=$2, description=$3, price=$4, icon=$5, rarity=$6, active=TRUE WHERE name=$1 RETURNING id`,
      [name, kind, description, price, icon, rarity]
    )
    if (rows.length) updated++
    else {
      await pool.query(
        `INSERT INTO cosmetics (name, kind, description, price, icon, rarity) VALUES ($1,$2,$3,$4,$5,$6)`,
        [name, kind, description, price, icon, rarity]
      )
      inserted++
    }
  }
  const { rows: final } = await pool.query(`SELECT name, price, rarity FROM cosmetics WHERE active=TRUE ORDER BY price`)
  console.log(`seed done: ${updated} refreshed, ${inserted} inserted`)
  console.log('active shop items:')
  for (const r of final) console.log(`  ${String(r.price).padStart(5)}  ${r.rarity.padEnd(9)}  ${r.name}`)
} catch (e) {
  console.error('SEED ERROR:', e.message)
} finally {
  pool.end()
}
