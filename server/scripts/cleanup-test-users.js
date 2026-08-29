import { Pool } from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
})

// Test/dev email patterns to identify
const TEST_PATTERNS = [
  '%@novaflix.com',        // TMDB artist seeds
  'creator@test.com',      // Test creator
  'creator@novaflix.com',  // Primary dev creator
  'seed-creator@test.com', // WebSocket test
  'wsprobe2@test.com',     // WebSocket test
]

async function listTestUsers() {
  const { rows } = await pool.query(`
    SELECT id, email, name, role, plan, created_at,
           (SELECT COUNT(*) FROM uploads WHERE user_id = users.id) as upload_count,
           (SELECT COUNT(*) FROM watch_history WHERE user_id = users.id) as watch_count,
           (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count,
           (SELECT COUNT(*) FROM likes WHERE user_id = users.id) as like_count,
           (SELECT COUNT(*) FROM followers WHERE follower_id = users.id) as follow_count
    FROM users
    WHERE email LIKE ANY($1::text[])
       OR email = ANY($1::text[])
    ORDER BY created_at ASC
  `, [TEST_PATTERNS])

  return rows
}

async function deleteTestUsers(userIds) {
  if (!userIds.length) return

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Delete in order to respect foreign keys
    for (const userId of userIds) {
      // Delete user's content and activity
      await client.query('DELETE FROM watch_history WHERE user_id = $1', [userId])
      await client.query('DELETE FROM watchlist WHERE user_id = $1', [userId])
      await client.query('DELETE FROM likes WHERE user_id = $1', [userId])
      await client.query('DELETE FROM comments WHERE user_id = $1', [userId])
      await client.query('DELETE FROM followers WHERE follower_id = $1 OR following_id = $1', [userId])
      await client.query('DELETE FROM user_achievements WHERE user_id = $1', [userId])
      await client.query('DELETE FROM email_verifications WHERE user_id = $1', [userId])
      await client.query('DELETE FROM active_sessions WHERE user_id = $1', [userId])
      await client.query('DELETE FROM user_devices WHERE user_id = $1', [userId])
      await client.query('DELETE FROM user_locations WHERE user_id = $1', [userId])
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId])
      await client.query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId])
      await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
      await client.query('DELETE FROM trivia_attempts WHERE user_id = $1', [userId])
      await client.query('DELETE FROM trivia_streaks WHERE user_id = $1', [userId])
      await client.query('DELETE FROM user_cosmetics WHERE user_id = $1', [userId])
      await client.query('DELETE FROM collected_keys WHERE user_id = $1', [userId])
      await client.query('DELETE FROM short_likes WHERE user_id = $1', [userId])
      await client.query('DELETE FROM short_bookmarks WHERE user_id = $1', [userId])
      await client.query('DELETE FROM short_comments WHERE user_id = $1', [userId])

      // Delete uploads and related
      const { rows: uploads } = await client.query('SELECT id FROM uploads WHERE user_id = $1', [userId])
      for (const upload of uploads) {
        await client.query('DELETE FROM comments WHERE content_id = $1', [upload.id.toString()])
        await client.query('DELETE FROM likes WHERE content_id = $1', [upload.id.toString()])
      }
      await client.query('DELETE FROM uploads WHERE user_id = $1', [userId])
      await client.query('DELETE FROM shorts WHERE user_id = $1', [userId])

      // Delete creator-related
      await client.query('DELETE FROM creator_profiles WHERE user_id = $1', [userId])
      await client.query('DELETE FROM creator_applications WHERE user_id = $1', [userId])
      await client.query('DELETE FROM creator_claim_requests WHERE user_id = $1', [userId])

      // Finally delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId])
    }

    await client.query('COMMIT')
    console.log(`[cleanup] Deleted ${userIds.length} test users`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[cleanup] Error deleting test users:', err.message)
    throw err
  } finally {
    client.release()
  }
}

async function main() {
  const args = process.argv.slice(2)
  const confirmFlag = args.includes('--confirm')

  console.log('[cleanup] Scanning for test/dev users...\n')

  const users = await listTestUsers()

  if (users.length === 0) {
    console.log('[cleanup] No test users found.')
    await pool.end()
    return
  }

  console.log(`[cleanup] Found ${users.length} test users:\n`)
  console.log('  Email'.padEnd(35) + 'Name'.padEnd(20) + 'Role'.padEnd(10) + 'Uploads'.padEnd(10) + 'Created')
  console.log('  ' + '-'.repeat(90))

  for (const u of users) {
    console.log(
      `  ${u.email.padEnd(33)} ${(u.name || '').padEnd(18)} ${(u.role || '').padEnd(8)} ${(u.upload_count || 0).toString().padEnd(8)} ${new Date(u.created_at).toISOString().slice(0, 10)}`
    )
  }

  if (!confirmFlag) {
    console.log('\n[cleanup] Dry run. To delete these users, run:')
    console.log('  node scripts/cleanup-test-users.js --confirm')
    await pool.end()
    return
  }

  console.log('\n[cleanup] Deleting test users...')
  const userIds = users.map(u => u.id)
  await deleteTestUsers(userIds)
  console.log('[cleanup] Done.')

  await pool.end()
}

main().catch(err => {
  console.error('[cleanup] Fatal error:', err.message)
  process.exit(1)
})
