import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, 'server', '.env') })

const pool = (await import('file:///home/success/Downloads/novaflix/server/config/database.js')).default
const email = process.argv[2]
const { rows } = await pool.query(
  `SELECT uv.user_id, uv.code FROM email_verifications uv
   JOIN users u ON u.id = uv.user_id
   WHERE u.email = $1 AND uv.used = false ORDER BY uv.created_at DESC LIMIT 1`, [email])
if (rows[0]) console.log(rows[0].user_id + '|' + rows[0].code)
else console.log('NONE')
await pool.end()