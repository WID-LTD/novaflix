import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import pool from '../config/database.js'

const email = 'creator@novaflix.com'

const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email])
if (rows.length === 0) {
  console.error('Creator not found')
  process.exit(1)
}
const userId = rows[0].id

await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId])

const ips = [
  { device_id: 'known-device-local-v6', ip_address: '::1' },
  { device_id: 'known-device-local-v4', ip_address: '127.0.0.1' },
  { device_id: 'known-device-local-v6mapped', ip_address: '::ffff:127.0.0.1' },
]
for (const d of ips) {
  await pool.query(
    `INSERT INTO user_devices (user_id, device_id, ip_address)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, device_id) DO UPDATE SET ip_address = EXCLUDED.ip_address, last_seen_at = NOW()`,
    [userId, d.device_id, d.ip_address]
  )
}

console.log('Known devices registered for creator@novaflix.com (localhost IPs)')
console.log('last_login_at set to NOW() -> "inactive" check bypassed')

await pool.end()
