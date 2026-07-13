import pool from './config/database.js'

function rowToUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    plan: row.plan,
    avatar: row.avatar,
    bio: row.bio || '',
    email_verified: row.email_verified,
    createdAt: row.created_at,
  }
}

function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  return rowToUser(rows[0])
}

export async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  return rowToUser(rows[0])
}

export async function createUser(user) {
  const { rows } = await pool.query(
    `INSERT INTO users (id, email, password, name, role, plan, avatar, bio, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [user.id, user.email, user.password, user.name, user.role || 'user', user.plan || 'free', user.avatar, user.bio || '', user.email_verified || false]
  )
  return rowToUser(rows[0])
}

export async function updateUser(id, updates) {
  const fields = []
  const values = []
  let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`)
    values.push(val)
    idx++
  }
  if (fields.length === 0) return findUserById(id)
  values.push(id)
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values
  )
  return rowToUser(rows[0])
}

export async function addUpload(upload) {
  const { rows } = await pool.query(
    `INSERT INTO uploads (id, user_id, title, description, genre, filename, filesize, status, views, minutes_watched, revenue)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [upload.id, upload.userId, upload.title, upload.description || '', upload.genre, upload.filename, upload.filesize, upload.status || 'pending', upload.views || 0, upload.minutesWatched || 0, upload.revenue || 0]
  )
  return rows[0]
}

export async function getUploadsByUserId(userId) {
  const { rows } = await pool.query('SELECT * FROM uploads WHERE user_id = $1 ORDER BY created_at DESC', [userId])
  return rows
}

export async function getAllUploads() {
  const { rows } = await pool.query('SELECT * FROM uploads ORDER BY created_at DESC')
  return rows
}

export async function addWatchEntry(entry) {
  const { rows } = await pool.query(
    `INSERT INTO watch_history (id, user_id, content_id, title, type, minutes, season, episode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [entry.id, entry.userId, entry.contentId, entry.title, entry.type, entry.minutes || 0, entry.season || null, entry.episode || null]
  )
  return rows[0]
}

export async function getWatchHistory(userId) {
  const { rows } = await pool.query('SELECT * FROM watch_history WHERE user_id = $1 ORDER BY watched_at DESC', [userId])
  return rows
}

export async function addSubscription(sub) {
  const { rows } = await pool.query(
    `INSERT INTO subscriptions (id, user_id, plan, active, started_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [sub.id, sub.userId, sub.plan, sub.active !== false, sub.startedAt || new Date().toISOString(), sub.expiresAt || null]
  )
  return rows[0]
}

export async function getUserSubscription(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1 AND active = true ORDER BY started_at DESC LIMIT 1',
    [userId]
  )
  return rows[0] || null
}

export async function addTip(tip) {
  const { rows } = await pool.query(
    `INSERT INTO tips (id, user_id, creator_id, amount, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tip.id, tip.userId, tip.creatorId, tip.amount, tip.message || '']
  )
  return rows[0]
}

export async function getTipsForCreator(creatorId) {
  const { rows } = await pool.query(
    'SELECT * FROM tips WHERE creator_id = $1 ORDER BY created_at DESC',
    [creatorId]
  )
  return rows
}

export async function getTotalMinutesWatched(userId) {
  const { rows } = await pool.query(
    'SELECT COALESCE(SUM(minutes), 0) as total FROM watch_history WHERE user_id = $1',
    [userId]
  )
  return parseInt(rows[0].total) || 0
}

export async function getTotalViewsForUpload(uploadId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM watch_history WHERE content_id = $1',
    [uploadId]
  )
  return parseInt(rows[0].count) || 0
}

export async function saveVerificationCode(userId, code) {
  await pool.query(
    `INSERT INTO email_verifications (user_id, code, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [userId, code]
  )
}

export async function verifyCode(userId, code) {
  const { rows } = await pool.query(
    `SELECT * FROM email_verifications
     WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, code]
  )
  if (rows[0]) {
    await pool.query('UPDATE email_verifications SET used = true WHERE id = $1', [rows[0].id])
    return true
  }
  return false
}

export async function getUsersByRole(role) {
  const { rows } = await pool.query('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC', [role])
  return rows.map(rowToUser)
}

export async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC')
  return rows.map(rowToUser)
}

export async function getPlatformStats() {
  const { rows: userCount } = await pool.query('SELECT COUNT(*) as count FROM users')
  const { rows: uploadCount } = await pool.query('SELECT COUNT(*) as count FROM uploads')
  const { rows: watchCount } = await pool.query('SELECT COALESCE(SUM(minutes), 0) as total FROM watch_history')
  const { rows: tipTotal } = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM tips')
  const { rows: subCount } = await pool.query('SELECT COUNT(*) as count FROM subscriptions WHERE active = true')
  return {
    totalUsers: parseInt(userCount[0].count),
    totalUploads: parseInt(uploadCount[0].count),
    totalMinutesWatched: parseInt(watchCount[0].total),
    totalTips: parseFloat(tipTotal[0].total),
    activeSubscriptions: parseInt(subCount[0].count),
  }
}

export async function newsletterSubscribe(email) {
  const { rows } = await pool.query(
    `INSERT INTO newsletter_emails (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET status = 'active'
     RETURNING *`,
    [email]
  )
  return rows[0]
}

export async function newsletterUnsubscribe(email) {
  const { rows } = await pool.query(
    'UPDATE newsletter_emails SET status = $1 WHERE email = $2 RETURNING *',
    ['unsubscribed', email]
  )
  return rows[0]
}

export async function findUserByTmdbPersonId(tmdbPersonId) {
  const { rows } = await pool.query(
    `SELECT u.* FROM users u
     JOIN creator_profiles cp ON cp.user_id = u.id
     WHERE cp.tmdb_person_id = $1`,
    [tmdbPersonId]
  )
  return rowToUser(rows[0])
}

export async function getAllNewsletterEmails() {
  const { rows } = await pool.query('SELECT * FROM newsletter_emails WHERE status = $1 ORDER BY subscribed_at DESC', ['active'])
  return rows
}

// Likes
export async function addLike(userId, contentId, contentType, creatorId) {
  const { rows } = await pool.query(
    `INSERT INTO likes (user_id, content_id, content_type, creator_id)
     VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, content_id, content_type) DO NOTHING RETURNING *`,
    [userId, contentId, contentType, creatorId || null]
  )
  return rows[0] || null
}

export async function removeLike(userId, contentId, contentType) {
  const { rows } = await pool.query(
    'DELETE FROM likes WHERE user_id = $1 AND content_id = $2 AND content_type = $3 RETURNING *',
    [userId, contentId, contentType]
  )
  return rows[0] || null
}

export async function getContentLikes(contentId, contentType) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM likes WHERE content_id = $1 AND content_type = $2',
    [contentId, contentType]
  )
  return parseInt(rows[0].count) || 0
}

export async function hasUserLiked(userId, contentId, contentType) {
  const { rows } = await pool.query(
    'SELECT 1 FROM likes WHERE user_id = $1 AND content_id = $2 AND content_type = $3 LIMIT 1',
    [userId, contentId, contentType]
  )
  return rows.length > 0
}

export async function getTotalLikesForCreator(creatorId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM likes WHERE creator_id = $1',
    [creatorId]
  )
  return parseInt(rows[0].count) || 0
}

// Comments
export async function addComment(userId, contentId, contentType, text, creatorId) {
  const { rows } = await pool.query(
    `INSERT INTO comments (user_id, content_id, content_type, text, creator_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, contentId, contentType, text, creatorId || null]
  )
  return rows[0]
}

export async function getContentComments(contentId, contentType, limit = 20, offset = 0) {
  const { rows } = await pool.query(
    `SELECT c.*, u.name as user_name, u.avatar as user_avatar
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.content_id = $1 AND c.content_type = $2
     ORDER BY c.created_at DESC LIMIT $3 OFFSET $4`,
    [contentId, contentType, limit, offset]
  )
  return rows
}

export async function getCommentsForCreator(creatorId, limit = 20, offset = 0) {
  const { rows } = await pool.query(
    `SELECT c.*, u.name as user_name, u.avatar as user_avatar
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.creator_id = $1
     ORDER BY c.created_at DESC LIMIT $2 OFFSET $3`,
    [creatorId, limit, offset]
  )
  return rows
}

export async function deleteComment(id, userId) {
  const { rows } = await pool.query(
    'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  )
  return rows[0] || null
}

// Artist Graph
export async function addGraphEdge(personAId, personBId, movieId, movieTitle, roleA, roleB) {
  const { rows } = await pool.query(
    `INSERT INTO artist_graph (person_a_id, person_b_id, movie_id, movie_title, role_a, role_b)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (person_a_id, person_b_id, movie_id)
     DO UPDATE SET weight = artist_graph.weight + 1
     RETURNING *`,
    [personAId, personBId, movieId, movieTitle, roleA, roleB]
  )
  return rows[0]
}

export async function getArtistGraph(userId) {
  const { rows } = await pool.query(
    `SELECT g.*, u.name as collab_name, u.avatar as collab_avatar, u.id as collab_id
     FROM artist_graph g JOIN users u ON u.id = g.person_b_id
     WHERE g.person_a_id = $1
     ORDER BY g.weight DESC LIMIT 50`,
    [userId]
  )
  return rows
}

// Transactions
export async function createTransaction(tx) {
  const { rows } = await pool.query(
    `INSERT INTO transactions (user_id, reference, type, plan, creator_id, amount, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [tx.userId, tx.reference, tx.type, tx.plan || null, tx.creatorId || null, tx.amount, tx.status || 'pending', tx.metadata ? JSON.stringify(tx.metadata) : null]
  )
  return rows[0]
}

export async function getTransactionByReference(reference) {
  const { rows } = await pool.query('SELECT * FROM transactions WHERE reference = $1', [reference])
  return rows[0] || null
}

export async function getUserTransactions(userId) {
  const { rows } = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC', [userId])
  return rows
}

// Creator stats with likes/comments
export async function getCreatorDashboardStats(creatorId) {
  const { rows: likes } = await pool.query('SELECT COUNT(*) as count FROM likes WHERE creator_id = $1', [creatorId])
  const { rows: comments } = await pool.query('SELECT COUNT(*) as count FROM comments WHERE creator_id = $1', [creatorId])
  const { rows: tips } = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE creator_id = $1', [creatorId])
  const { rows: minutes } = await pool.query('SELECT COALESCE(SUM(minutes), 0) as total FROM watch_history WHERE content_id IN (SELECT content_id FROM comments WHERE creator_id = $1)', [creatorId])
  return {
    totalLikes: parseInt(likes[0].count) || 0,
    totalComments: parseInt(comments[0].count) || 0,
    totalTips: parseFloat(tips[0].total) || 0,
    totalMinutesWatched: parseInt(minutes[0].total) || 0,
  }
}

// Seeding helpers
export async function createCreatorProfile(userId, displayName, tmdbPersonId, department, bio, avatar) {
  const { rows } = await pool.query(
    `INSERT INTO creator_profiles (user_id, display_name, bio, avatar, tmdb_person_id, known_for_department)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET display_name = $2, bio = $3, avatar = $4, tmdb_person_id = $5, known_for_department = $6
     RETURNING *`,
    [userId, displayName, bio || '', avatar, tmdbPersonId, department]
  )
  return rows[0]
}
