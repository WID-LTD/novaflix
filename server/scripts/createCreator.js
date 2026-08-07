import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import pool from '../config/database.js'

const email = 'creator@novaflix.com'
const password = 'creator'

const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
if (rows.length > 0) {
  const existing = rows[0]
  const hashed = await bcrypt.hash(password, 10)
  await pool.query(
    `UPDATE users SET role = 'creator', plan = 'premium', email_verified = true, password = $1 WHERE id = $2`,
    [hashed, existing.id]
  )
  const userId = existing.id
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan, active, started_at, expires_at)
     VALUES ($1, 'premium', true, NOW(), NOW() + INTERVAL '1 year')
     ON CONFLICT DO NOTHING`,
    [userId]
  )
  await pool.query(
    `INSERT INTO creator_profiles (user_id, display_name, bio)
     VALUES ($1, 'Creator', 'Creator on NovaFlix')
     ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name`,
    [userId]
  )
  console.log('Existing account updated: ' + email)
  console.log('  Password: ' + password)
  console.log('  Role: creator, Plan: premium, Email verified: true, Subscription: active')
} else {
  const hashed = await bcrypt.hash(password, 10)
  const userId = uuidv4()
  await pool.query(
    `INSERT INTO users (id, email, password, name, role, plan, bio, email_verified)
     VALUES ($1, $2, $3, 'Creator', 'creator', 'premium', 'Creator on NovaFlix', true)`,
    [userId, email, hashed]
  )
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan, active, started_at, expires_at)
     VALUES ($1, 'premium', true, NOW(), NOW() + INTERVAL '1 year')`,
    [userId]
  )
  await pool.query(
    `INSERT INTO creator_profiles (user_id, display_name, bio)
     VALUES ($1, 'Creator', 'Creator on NovaFlix')`,
    [userId]
  )
  console.log('Created subscribed creator account:')
  console.log('  Email:    ' + email)
  console.log('  Password: ' + password)
  console.log('  Role:     creator')
  console.log('  Plan:     premium')
  console.log('  Subscription: active (1 year)')
}

await pool.end()
