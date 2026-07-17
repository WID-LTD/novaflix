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

export async function updateTransactionByReference(reference, updates) {
  const fields = []
  const values = []
  let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`)
    values.push(val)
    idx++
  }
  if (fields.length === 0) return null
  values.push(reference)
  const { rows } = await pool.query(
    `UPDATE transactions SET ${fields.join(', ')} WHERE reference = $${idx} RETURNING *`,
    values
  )
  return rows[0] || null
}

// Active session management
export async function createActiveSession(userId, deviceId, ipAddress) {
  await pool.query('DELETE FROM active_sessions WHERE user_id = $1 AND device_id = $2', [userId, deviceId])
  const { rows } = await pool.query(
    `INSERT INTO active_sessions (user_id, device_id, ip_address)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, deviceId || null, ipAddress || null]
  )
  return rows[0]
}

export async function getActiveSessionCount(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM active_sessions WHERE user_id = $1 AND last_heartbeat > NOW() - INTERVAL \'2 minutes\'',
    [userId]
  )
  return parseInt(rows[0].count) || 0
}

export async function heartbeatSession(userId, deviceId) {
  const { rows } = await pool.query(
    'UPDATE active_sessions SET last_heartbeat = NOW() WHERE user_id = $1 AND device_id = $2 RETURNING *',
    [userId, deviceId]
  )
  return rows[0] || null
}

export async function endSession(userId, deviceId) {
  await pool.query(
    'DELETE FROM active_sessions WHERE user_id = $1 AND device_id = $2',
    [userId, deviceId]
  )
}

export async function cleanupStaleSessions() {
  const { rows } = await pool.query(
    'DELETE FROM active_sessions WHERE last_heartbeat < NOW() - INTERVAL \'3 minutes\' RETURNING *'
  )
  return rows.length
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

// Membership tiers
export async function createMembershipTier(tier) {
  const { rows } = await pool.query(
    `INSERT INTO creator_membership_tiers (id, creator_id, name, description, price, benefits)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tier.id, tier.creatorId, tier.name, tier.description || '', tier.price, tier.benefits ? JSON.stringify(tier.benefits) : '[]']
  )
  return rows[0]
}

export async function updateMembershipTier(id, creatorId, updates) {
  const fields = []
  const values = []
  let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`)
    values.push(val)
    idx++
  }
  if (fields.length === 0) return null
  values.push(id, creatorId)
  const { rows } = await pool.query(
    `UPDATE creator_membership_tiers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND creator_id = $${idx + 1} RETURNING *`,
    values
  )
  return rows[0] || null
}

export async function getMembershipTiersByCreator(creatorId) {
  const { rows } = await pool.query(
    'SELECT * FROM creator_membership_tiers WHERE creator_id = $1 ORDER BY price ASC',
    [creatorId]
  )
  return rows
}

export async function getMembershipTierById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM creator_membership_tiers WHERE id = $1',
    [id]
  )
  return rows[0] || null
}

// Memberships (user subscriptions to creator tiers)
export async function createMembership(membership) {
  const { rows } = await pool.query(
    `INSERT INTO creator_memberships (id, user_id, tier_id, creator_id, status, started_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [membership.id, membership.userId, membership.tierId, membership.creatorId, membership.status || 'active', membership.startedAt || new Date().toISOString(), membership.expiresAt || null]
  )
  return rows[0]
}

export async function getUserMemberships(userId) {
  const { rows } = await pool.query(
    `SELECT cm.*, cmt.name as tier_name, cmt.price as tier_price, cmt.benefits, u.name as creator_name, u.avatar as creator_avatar
     FROM creator_memberships cm
     JOIN creator_membership_tiers cmt ON cmt.id = cm.tier_id
     JOIN users u ON u.id = cm.creator_id
     WHERE cm.user_id = $1 AND cm.status = 'active'
     ORDER BY cm.started_at DESC`,
    [userId]
  )
  return rows
}

export async function getCreatorSubscribers(creatorId) {
  const { rows } = await pool.query(
    `SELECT cm.*, cmt.name as tier_name, cmt.price as tier_price, u.name as user_name, u.avatar as user_avatar
     FROM creator_memberships cm
     JOIN creator_membership_tiers cmt ON cmt.id = cm.tier_id
     JOIN users u ON u.id = cm.user_id
     WHERE cm.creator_id = $1 AND cm.status = 'active'
     ORDER BY cm.started_at DESC`,
    [creatorId]
  )
  return rows
}

export async function getActiveMembershipForUserAndTier(userId, tierId) {
  const { rows } = await pool.query(
    `SELECT * FROM creator_memberships WHERE user_id = $1 AND tier_id = $2 AND status = 'active' LIMIT 1`,
    [userId, tierId]
  )
  return rows[0] || null
}

export async function cancelMembership(id, userId) {
  const { rows } = await pool.query(
    `UPDATE creator_memberships SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  )
  return rows[0] || null
}

export async function getCreatorMembershipStats(creatorId) {
  const { rows: subscriberCount } = await pool.query(
    'SELECT COUNT(*) as count FROM creator_memberships WHERE creator_id = $1 AND status = $2',
    [creatorId, 'active']
  )
  const { rows: revenue } = await pool.query(
    `SELECT COALESCE(SUM(cmt.price), 0) as total FROM creator_memberships cm
     JOIN creator_membership_tiers cmt ON cmt.id = cm.tier_id
     WHERE cm.creator_id = $1 AND cm.status = 'active'`,
    [creatorId]
  )
  return {
    totalSubscribers: parseInt(subscriberCount[0].count) || 0,
    monthlyRevenue: parseFloat(revenue[0].total) || 0,
  }
}

// Live events
export async function createLiveEvent(event) {
  const { rows } = await pool.query(
    `INSERT INTO live_events (id, creator_id, title, description, event_date, ticket_price, total_tickets, available_tickets, poster_url, stream_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [event.id, event.creatorId, event.title, event.description || '', event.eventDate, event.ticketPrice || 0, event.totalTickets || 0, event.totalTickets || 0, event.posterUrl || '', event.streamUrl || '', event.status || 'scheduled']
  )
  return rows[0]
}

export async function updateLiveEvent(id, creatorId, updates) {
  const fields = []
  const values = []
  let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`)
    values.push(val)
    idx++
  }
  if (fields.length === 0) return null
  values.push(id, creatorId)
  const { rows } = await pool.query(
    `UPDATE live_events SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND creator_id = $${idx + 1} RETURNING *`,
    values
  )
  return rows[0] || null
}

export async function getLiveEvents(includePast = false) {
  let query = 'SELECT le.*, u.name as creator_name, u.avatar as creator_avatar FROM live_events le JOIN users u ON u.id = le.creator_id'
  if (!includePast) query += " WHERE le.event_date > NOW() AND le.status != 'cancelled'"
  query += ' ORDER BY le.event_date ASC'
  const { rows } = await pool.query(query)
  return rows
}

export async function getLiveEventById(id) {
  const { rows } = await pool.query(
    `SELECT le.*, u.name as creator_name, u.avatar as creator_avatar
     FROM live_events le JOIN users u ON u.id = le.creator_id
     WHERE le.id = $1`,
    [id]
  )
  return rows[0] || null
}

export async function getLiveEventsByCreator(creatorId) {
  const { rows } = await pool.query(
    'SELECT * FROM live_events WHERE creator_id = $1 ORDER BY event_date DESC',
    [creatorId]
  )
  return rows
}

// Event tickets
export async function purchaseEventTicket(ticket) {
  const { rows } = await pool.query(
    `INSERT INTO event_tickets (id, event_id, user_id, transaction_id, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [ticket.id, ticket.eventId, ticket.userId, ticket.transactionId || null, ticket.status || 'active']
  )
  await pool.query(
    'UPDATE live_events SET available_tickets = available_tickets - 1 WHERE id = $1 AND available_tickets > 0',
    [ticket.eventId]
  )
  return rows[0]
}

export async function getUserTickets(userId) {
  const { rows } = await pool.query(
    `SELECT et.*, le.title as event_title, le.event_date, le.poster_url, le.stream_url, le.status as event_status,
            u.name as creator_name, le.creator_id
     FROM event_tickets et
     JOIN live_events le ON le.id = et.event_id
     JOIN users u ON u.id = le.creator_id
     WHERE et.user_id = $1
     ORDER BY et.purchased_at DESC`,
    [userId]
  )
  return rows
}

export async function getEventTicketCount(eventId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM event_tickets WHERE event_id = $1 AND status = $2',
    [eventId, 'active']
  )
  return parseInt(rows[0].count) || 0
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

// Products
export async function createProduct(product) {
  const { rows } = await pool.query(
    `INSERT INTO products (id, creator_id, title, description, price, image_url, category, popular)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [product.id, product.creatorId || null, product.title, product.description || '', product.price, product.imageUrl || '', product.category || 'general', product.popular || false]
  )
  return rows[0]
}

export async function updateProduct(id, creatorId, updates) {
  const fields = []; const values = []; let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`); values.push(val); idx++
  }
  if (fields.length === 0) return null
  values.push(id, creatorId)
  const { rows } = await pool.query(
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND creator_id = $${idx + 1} RETURNING *`, values
  )
  return rows[0] || null
}

export async function getProducts(category) {
  let query = 'SELECT p.*, u.name as creator_name FROM products p LEFT JOIN users u ON u.id = p.creator_id WHERE p.active = true'
  const params = []
  if (category && category !== 'all') { params.push(category); query += ` AND p.category = $1` }
  query += ' ORDER BY p.popular DESC, p.created_at DESC'
  const { rows } = await pool.query(query, params)
  return rows
}

export async function getProductById(id) {
  const { rows } = await pool.query(
    'SELECT p.*, u.name as creator_name FROM products p LEFT JOIN users u ON u.id = p.creator_id WHERE p.id = $1', [id]
  )
  return rows[0] || null
}

export async function getProductsByCreator(creatorId) {
  const { rows } = await pool.query('SELECT * FROM products WHERE creator_id = $1 ORDER BY created_at DESC', [creatorId])
  return rows
}

// Orders
export async function createOrder(order) {
  const { rows } = await pool.query(
    `INSERT INTO orders (id, user_id, total, status, reference)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [order.id, order.userId, order.total, order.status || 'pending', order.reference || null]
  )
  return rows[0]
}

export async function addOrderItem(item) {
  const { rows } = await pool.query(
    `INSERT INTO order_items (id, order_id, product_id, quantity, price)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [item.id, item.orderId, item.productId, item.quantity || 1, item.price]
  )
  return rows[0]
}

export async function getOrderByReference(reference) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE reference = $1', [reference])
  return rows[0] || null
}

export async function updateOrder(reference, updates) {
  const fields = []; const values = []; let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`); values.push(val); idx++
  }
  if (fields.length === 0) return null
  values.push(reference)
  const { rows } = await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE reference = $${idx} RETURNING *`, values)
  return rows[0] || null
}

export async function getUserOrders(userId) {
  const { rows } = await pool.query(
    `SELECT o.*, json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price, 'title', p.title, 'image_url', p.image_url)) as items
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
    [userId]
  )
  return rows
}

// Courses
export async function createCourse(course) {
  const { rows } = await pool.query(
    `INSERT INTO courses (id, creator_id, title, description, price, image_url, category, duration, lessons_count, rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [course.id, course.creatorId, course.title, course.description || '', course.price, course.imageUrl || '', course.category || 'general', course.duration || '', course.lessonsCount || 0, course.rating || 0]
  )
  return rows[0]
}

export async function updateCourse(id, creatorId, updates) {
  const fields = []; const values = []; let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`); values.push(val); idx++
  }
  if (fields.length === 0) return null
  values.push(id, creatorId)
  const { rows } = await pool.query(
    `UPDATE courses SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND creator_id = $${idx + 1} RETURNING *`, values
  )
  return rows[0] || null
}

export async function getCourses(category) {
  let query = 'SELECT c.*, u.name as creator_name, u.avatar as creator_avatar FROM courses c JOIN users u ON u.id = c.creator_id WHERE c.active = true'
  const params = []
  if (category && category !== 'all') { params.push(category); query += ` AND c.category = $1` }
  query += ' ORDER BY c.students_count DESC, c.created_at DESC'
  const { rows } = await pool.query(query, params)
  return rows
}

export async function getCourseById(id) {
  const { rows } = await pool.query(
    'SELECT c.*, u.name as creator_name, u.avatar as creator_avatar FROM courses c JOIN users u ON u.id = c.creator_id WHERE c.id = $1', [id]
  )
  return rows[0] || null
}

export async function getCoursesByCreator(creatorId) {
  const { rows } = await pool.query('SELECT * FROM courses WHERE creator_id = $1 ORDER BY created_at DESC', [creatorId])
  return rows
}

export async function getCategories() {
  const { rows: productCats } = await pool.query('SELECT DISTINCT category FROM products WHERE active = true ORDER BY category')
  const { rows: courseCats } = await pool.query('SELECT DISTINCT category FROM courses WHERE active = true ORDER BY category')
  return { productCategories: productCats.map(r => r.category), courseCategories: courseCats.map(r => r.category) }
}

// Enrollments
export async function createEnrollment(enrollment) {
  const { rows } = await pool.query(
    `INSERT INTO enrollments (id, user_id, course_id, transaction_id, progress, completed)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id, course_id) DO NOTHING RETURNING *`,
    [enrollment.id, enrollment.userId, enrollment.courseId, enrollment.transactionId || null, enrollment.progress || 0, enrollment.completed || false]
  )
  if (rows[0]) {
    await pool.query('UPDATE courses SET students_count = students_count + 1 WHERE id = $1', [enrollment.courseId])
  }
  return rows[0] || null
}

export async function getUserEnrollments(userId) {
  const { rows } = await pool.query(
    `SELECT e.*, c.title as course_title, c.description, c.price, c.image_url, c.duration, c.lessons_count, c.rating, c.category,
            u.name as creator_name, u.avatar as creator_avatar, c.creator_id
     FROM enrollments e JOIN courses c ON c.id = e.course_id JOIN users u ON u.id = c.creator_id
     WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC`,
    [userId]
  )
  return rows
}

export async function getEnrollment(userId, courseId) {
  const { rows } = await pool.query(
    'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, courseId]
  )
  return rows[0] || null
}

export async function updateEnrollmentProgress(userId, courseId, progress) {
  const { rows } = await pool.query(
    `UPDATE enrollments SET progress = $1, completed = CASE WHEN $1 >= 100 THEN true ELSE completed END
     WHERE user_id = $2 AND course_id = $3 RETURNING *`,
    [progress, userId, courseId]
  )
  return rows[0] || null
}

// Archives
export async function createArchiveItem(item) {
  const { rows } = await pool.query(
    `INSERT INTO archive_items (id, title, description, content_type, media_url, poster_url, year, genre, min_plan)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [item.id, item.title, item.description || '', item.contentType || 'video', item.mediaUrl || '', item.posterUrl || '', item.year || '', item.genre || '', item.minPlan || 'free']
  )
  return rows[0]
}

export async function updateArchiveItem(id, updates) {
  const fields = []; const values = []; let idx = 1
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${idx}`); values.push(val); idx++
  }
  if (fields.length === 0) return null
  values.push(id)
  const { rows } = await pool.query(
    `UPDATE archive_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`, values
  )
  return rows[0] || null
}

export async function getArchiveItems(minPlanRank = 0) {
  const PLAN_RANK = { free: 0, student: 1, basic: 2, standard: 3, premium: 4 }
  const allowed = Object.entries(PLAN_RANK).filter(([, rank]) => rank <= minPlanRank).map(([p]) => p)
  const placeholders = allowed.map((_, i) => `$${i + 1}`).join(',')
  const { rows } = await pool.query(
    `SELECT * FROM archive_items WHERE active = true AND min_plan IN (${placeholders}) ORDER BY created_at DESC`,
    allowed
  )
  return rows
}

export async function getArchiveItemById(id) {
  const { rows } = await pool.query('SELECT * FROM archive_items WHERE id = $1', [id])
  return rows[0] || null
}

export async function logArchiveAccess(userId, archiveId) {
  const { rows } = await pool.query(
    `INSERT INTO archive_access_logs (user_id, archive_id) VALUES ($1, $2) RETURNING *`,
    [userId, archiveId]
  )
  return rows[0]
}

export async function getAllArchiveItems() {
  const { rows } = await pool.query('SELECT * FROM archive_items ORDER BY created_at DESC')
  return rows
}

// Communities
export async function createCommunity(community) {
  const { rows } = await pool.query(
    `INSERT INTO communities (id, name, description, avatar, creator_id, member_count)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [community.id, community.name, community.description || '', community.avatar || null, community.creatorId, community.memberCount || 1]
  )
  return rows[0]
}

export async function getCommunities(search) {
  let query = `SELECT c.*, u.name as creator_name, u.avatar as creator_avatar
               FROM communities c JOIN users u ON u.id = c.creator_id`
  const params = []
  if (search) {
    params.push(`%${search}%`)
    query += ` WHERE c.name ILIKE $1 OR c.description ILIKE $1`
  }
  query += ' ORDER BY c.member_count DESC, c.created_at DESC'
  const { rows } = await pool.query(query, params)
  return rows
}

export async function getCommunityById(id) {
  const { rows } = await pool.query(
    `SELECT c.*, u.name as creator_name, u.avatar as creator_avatar
     FROM communities c JOIN users u ON u.id = c.creator_id
     WHERE c.id = $1`,
    [id]
  )
  return rows[0] || null
}

export async function joinCommunity(communityId, userId) {
  const { rows } = await pool.query(
    `INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING RETURNING *`,
    [communityId, userId]
  )
  if (rows[0]) {
    await pool.query(
      'UPDATE communities SET member_count = member_count + 1 WHERE id = $1',
      [communityId]
    )
  }
  return rows[0] || null
}

export async function leaveCommunity(communityId, userId) {
  const { rows } = await pool.query(
    'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2 RETURNING *',
    [communityId, userId]
  )
  if (rows[0]) {
    await pool.query(
      'UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1',
      [communityId]
    )
  }
  return rows[0] || null
}

export async function getMyCommunities(userId) {
  const { rows } = await pool.query(
    `SELECT c.*, u.name as creator_name, u.avatar as creator_avatar
     FROM communities c JOIN users u ON u.id = c.creator_id
     JOIN community_members cm ON cm.community_id = c.id
     WHERE cm.user_id = $1
     ORDER BY c.member_count DESC`,
    [userId]
  )
  return rows
}

export async function isCommunityMember(communityId, userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2 LIMIT 1',
    [communityId, userId]
  )
  return rows.length > 0
}

export async function createPost(post) {
  const { rows } = await pool.query(
    `INSERT INTO community_posts (id, community_id, user_id, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [post.id, post.communityId, post.userId, post.content]
  )
  return rows[0]
}

export async function getPosts(communityId) {
  const { rows } = await pool.query(
    `SELECT p.*, u.name as user_name, u.avatar as user_avatar
     FROM community_posts p JOIN users u ON u.id = p.user_id
     WHERE p.community_id = $1
     ORDER BY p.created_at DESC`,
    [communityId]
  )
  return rows
}

export async function deletePost(id, userId) {
  const { rows } = await pool.query(
    'DELETE FROM community_posts WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  )
  return rows[0] || null
}

// Actors
export async function upsertActor(actor) {
  const { rows } = await pool.query(
    `INSERT INTO actors (tmdb_id, name, avatar, biography, known_for_department, popularity)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tmdb_id) DO UPDATE SET
       name = EXCLUDED.name,
       avatar = EXCLUDED.avatar,
       biography = EXCLUDED.biography,
       known_for_department = EXCLUDED.known_for_department,
       popularity = EXCLUDED.popularity
     RETURNING *`,
    [actor.tmdbId, actor.name, actor.avatar || null, actor.biography || '', actor.knownForDepartment || '', actor.popularity || 0]
  )
  return rows[0]
}

export async function getActors(limit = 50, offset = 0) {
  const { rows } = await pool.query(
    'SELECT * FROM actors ORDER BY popularity DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  )
  return rows
}

export async function getActorCount() {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM actors')
  return parseInt(rows[0].count) || 0
}
