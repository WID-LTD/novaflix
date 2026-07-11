import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import {
  findUserByEmail, findUserById, createUser, updateUser,
  addUpload, getUploadsByUserId, getAllUploads,
  addWatchEntry, getWatchHistory, getDb,
  addSubscription, getUserSubscription,
  addTip, getTipsForCreator, getTotalMinutesWatched,
} from './db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'novaflix-secret-key-change-in-production'

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Auth
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    if (findUserByEmail(email)) return res.status(409).json({ error: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 10)
    const user = {
      id: uuidv4(),
      email,
      name: name || email.split('@')[0],
      password: hashed,
      plan: 'free',
      avatar: null,
      bio: '',
      createdAt: new Date().toISOString(),
    }
    createUser(user)

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
    const { password: _, ...safe } = user
    res.json({ success: true, token, user: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
    const { password: _, ...safe } = user
    res.json({ success: true, token, user: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/auth/me', authMiddleware, (req, res) => {
  const user = findUserById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const { password: _, ...safe } = user
  res.json({ success: true, user: safe })
})

// Profile
router.put('/user/profile', authMiddleware, (req, res) => {
  const { name, bio, avatar } = req.body
  const updates = {}
  if (name !== undefined) updates.name = name
  if (bio !== undefined) updates.bio = bio
  if (avatar !== undefined) updates.avatar = avatar
  const updated = updateUser(req.userId, updates)
  if (!updated) return res.status(404).json({ error: 'User not found' })
  const { password: _, ...safe } = updated
  res.json({ success: true, user: safe })
})

router.get('/user/stats', authMiddleware, (req, res) => {
  const user = findUserById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const sub = getUserSubscription(req.userId)
  res.json({
    success: true,
    stats: {
      minutesWatched: getTotalMinutesWatched(req.userId),
      watchlistCount: 0,
      uploadsCount: getUploadsByUserId(req.userId).length,
      plan: user.plan || 'free',
      subscription: sub || null,
    },
  })
})

// Watch History
router.post('/user/watch-history', authMiddleware, (req, res) => {
  const { contentId, title, type, minutes, season, episode } = req.body
  const entry = {
    id: uuidv4(),
    userId: req.userId,
    contentId,
    title,
    type,
    minutes: minutes || 0,
    season: season || null,
    episode: episode || null,
    watchedAt: new Date().toISOString(),
  }
  addWatchEntry(entry)
  res.json({ success: true, entry })
})

router.get('/user/watch-history', authMiddleware, (req, res) => {
  const history = getWatchHistory(req.userId)
  res.json({ success: true, history })
})

// Creator - Upload
router.post('/creator/upload', authMiddleware, (req, res) => {
  const { title, description, genre, filename, filesize } = req.body
  if (!title || !genre) return res.status(400).json({ error: 'Title and genre required' })

  const upload = {
    id: uuidv4(),
    userId: req.userId,
    title,
    description: description || '',
    genre,
    filename: filename || `${uuidv4()}.mp4`,
    filesize: filesize || 0,
    status: 'pending',
    views: 0,
    minutesWatched: 0,
    revenue: 0,
    createdAt: new Date().toISOString(),
  }
  addUpload(upload)
  res.json({ success: true, upload })
})

router.get('/creator/uploads', authMiddleware, (req, res) => {
  const uploads = getUploadsByUserId(req.userId)
  res.json({ success: true, uploads })
})

router.get('/creator/stats', authMiddleware, (req, res) => {
  const uploads = getUploadsByUserId(req.userId)
  const totalViews = uploads.reduce((acc, u) => acc + (u.views || 0), 0)
  const totalMinutes = uploads.reduce((acc, u) => acc + (u.minutesWatched || 0), 0)
  const totalRevenue = uploads.reduce((acc, u) => acc + (u.revenue || 0), 0)
  const tips = getTipsForCreator(req.userId)
  const tipTotal = tips.reduce((acc, t) => acc + t.amount, 0)

  res.json({
    success: true,
    stats: {
      totalUploads: uploads.length,
      totalViews,
      totalMinutesWatched: totalMinutes,
      revenue: totalRevenue + tipTotal,
      tipRevenue: tipTotal,
      uploads,
      recentTips: tips.slice(-5),
    },
  })
})

// Tips
router.post('/tips', authMiddleware, (req, res) => {
  const { creatorId, amount, message } = req.body
  if (!creatorId || !amount) return res.status(400).json({ error: 'Creator and amount required' })

  const tip = {
    id: uuidv4(),
    userId: req.userId,
    creatorId,
    amount,
    message: message || '',
    createdAt: new Date().toISOString(),
  }
  addTip(tip)

  // Update creator's revenue
  const creator = findUserById(creatorId)
  if (creator) {
    const uploads = getUploadsByUserId(creatorId)
    if (uploads.length > 0) {
      // Distribute tip across their uploads proportionally
    }
  }

  res.json({ success: true, tip })
})

// Subscription / Payment
router.post('/payment/create-checkout', authMiddleware, (req, res) => {
  const { plan } = req.body
  const prices = { premium: 999, duo: 1499 }
  const amount = prices[plan]
  if (!amount) return res.status(400).json({ error: 'Invalid plan' })

  res.json({
    success: true,
    checkoutUrl: `/payment/confirm?plan=${plan}&userId=${req.userId}`,
    amount,
    plan,
  })
})

router.post('/payment/confirm', authMiddleware, (req, res) => {
  const { plan } = req.body
  const sub = {
    id: uuidv4(),
    userId: req.userId,
    plan,
    active: true,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
  addSubscription(sub)
  updateUser(req.userId, { plan })

  res.json({ success: true, subscription: sub })
})

router.get('/payment/status', authMiddleware, (req, res) => {
  const sub = getUserSubscription(req.userId)
  res.json({ success: true, subscription: sub || null })
})

export default router
