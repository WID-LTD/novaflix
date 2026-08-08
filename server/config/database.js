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
  if (!process.env.DATABASE_URL) return null
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

// Fail-open when DATABASE_URL is absent: the server runs without DB features,
// and server.js gates DB-dependent code behind process.env.DATABASE_URL.
let pool = null
let poolReady = buildConfig().then((cfg) => {
  if (!cfg) {
    console.warn('[db] No DATABASE_URL set — running without database features.')
    return null
  }
  const p = new pg.Pool({ ...cfg, connectionString: undefined })
  p.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message)
  })
  pool = p
  return p
})

function getPool() {
  return pool
}

export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set; cannot initialize database')
  }
  const p = await poolReady
  if (!p) throw new Error('DATABASE_URL is not set; cannot initialize database')
  const sqlPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(sqlPath, 'utf-8')
  try {
    await p.query(schema)
    console.log('[db] Database schema initialized')
  } catch (err) {
    console.error('[db] Schema initialization error:', err.message)
    throw err
  }
}

export default new Proxy({}, {
  get(_t, prop) {
    const p = getPool()
    if (p && p[prop]) {
      return typeof p[prop] === 'function' ? p[prop].bind(p) : p[prop]
    }
    // No-op fallback so queries against a missing DB reject cleanly
    if (prop === 'query') {
      return async () => { throw new Error('Database unavailable: DATABASE_URL not set') }
    }
    if (prop === 'end') return async () => {}
    return undefined
  },
})
