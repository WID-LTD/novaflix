import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import dns from 'dns'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Build a pool config that prefers IPv4. Some Neon hostnames resolve to
// unreachable IPv6 first; connecting by resolved IPv4 with the hostname
// sent as TLS SNI satisfies Neon's endpoint check.
async function buildConfig() {
  const url = new URL(process.env.DATABASE_URL)
  const hostname = url.hostname
  let host = hostname

  try {
    const addrs = await dns.promises.resolve4(hostname)
    if (addrs.length > 0) host = addrs[0]
  } catch {}

  return {
    host,
    port: url.port || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: hostname },
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 30000,
  }
}

const configPromise = buildConfig()
const pool = new pg.Pool({
  ...(await configPromise),
  connectionString: undefined,
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
