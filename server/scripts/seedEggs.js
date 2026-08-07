import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import pool from '../config/database.js'

const LAUNCH_KEYS = [
  {
    contentId: '27205',
    code: 'seed-inception-vault',
    ts: 94.5, x: 0.42, y: 0.35, radius: 0.07,
    hint: 'A totem never stops spinning',
    rewardType: 'badge'
  },
  {
    contentId: '157336',
    code: 'seed-interstellar-tesseract',
    ts: 120.0, x: 0.61, y: 0.62, radius: 0.08,
    hint: 'Love is the one thing we can sense beyond dimensions',
    rewardType: 'badge'
  },
  {
    contentId: '155',
    code: 'seed-darkknight-penny',
    ts: 61.25, x: 0.5, y: 0.5, radius: 0.1,
    hint: 'The coin has two faces',
    rewardType: 'secret_room',
    room: {
      name: 'The Joker Vault',
      description: 'You found the two-faced coin. Welcome to the vault where chaos is always on sale.'
    }
  },
  {
    contentId: '603',
    code: 'seed-matrix-neo',
    ts: 30.1, x: 0.33, y: 0.7, radius: 0.06,
    hint: 'There is no spoon',
    rewardType: 'badge'
  },
  {
    contentId: '293660',
    code: 'seed-drstrange-zealot',
    ts: 200.75, x: 0.78, y: 0.28, radius: 0.07,
    hint: 'Time keeps its own secrets',
    rewardType: 'secret_room',
    room: {
      name: 'Kamar-Taj Sanctum',
      description: 'The Ancient One approves. Browse forbidden relics in the Sanctum.'
    }
  }
]

async function ensureBadge(name, icon, description) {
  const { rows } = await pool.query(
    `INSERT INTO cosmetics (name, kind, description, price, icon, active)
     VALUES ($1, 'badge', $2, 0, $3, TRUE)
     ON CONFLICT DO NOTHING`,
    [name, description, icon]
  )
  const existing = await pool.query(
    `SELECT id FROM cosmetics WHERE name = $1 AND kind = 'badge' LIMIT 1`,
    [name]
  )
  return existing.rows[0].id
}

async function seed() {
  console.log('[seed] Seeding launch digital keys...')

  const { rows: count } = await pool.query("SELECT COUNT(*) as c FROM digital_keys WHERE code LIKE 'seed-%'")
  if (parseInt(count[0].c) > 0) {
    console.log('[seed] Launch keys already present, skipping.')
    await pool.end()
    return
  }

  const hunterBadge = await ensureBadge('Easter Egg Hunter', '🥚', 'Collected your first digital key')
  const vaultBadge = await ensureBadge('Key Collector', '🗝️', 'Collected 5 digital keys')

  for (const k of LAUNCH_KEYS) {
    const rewardRef = k.rewardType === 'badge' ? hunterBadge : null
    const keyRes = await pool.query(
      `INSERT INTO digital_keys (content_id, creator_id, code, ts_seconds, pos_x, pos_y, radius, hint, reward_type, reward_ref)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO NOTHING
       RETURNING id`,
      [k.contentId, k.code, k.ts, k.x, k.y, k.radius, k.hint, k.rewardType, rewardRef]
    )
    if (keyRes.rows.length === 0) continue

    if (k.rewardType === 'secret_room' && k.room) {
      await pool.query(
        `INSERT INTO secret_rooms (key_id, name, description)
         VALUES ($1, $2, $3) ON CONFLICT (key_id) DO NOTHING`,
        [keyRes.rows[0].id, k.room.name, k.room.description]
      )
    }
    console.log(`  [${k.rewardType}] ${k.code} on ${k.contentId} @${k.ts}s`)
  }

  console.log('[seed] Done.')
  await pool.end()
}

seed().catch((err) => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})
