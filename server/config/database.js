import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message)
})

export async function initDatabase() {
  const sqlPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(sqlPath, 'utf-8')
  try {
    await pool.query(schema)
    console.log('[db] Database schema initialized')
  } catch (err) {
    console.error('[db] Schema initialization error:', err.message)
    throw err
  }
}

export default pool
