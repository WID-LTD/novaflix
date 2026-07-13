import { findUserById } from '../db.js'

export async function adminMiddleware(req, res, next) {
  try {
    const user = await findUserById(req.userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.user = user
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function creatorOrAdminMiddleware(req, res, next) {
  try {
    const user = await findUserById(req.userId)
    if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Creator or admin access required' })
    }
    req.user = user
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
