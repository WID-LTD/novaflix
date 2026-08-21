import jwt from 'jsonwebtoken'
import { resolveJwtSecret } from '../config/jwtSecret.js'
import { findUserById } from '../db.js'

const JWT_SECRET = resolveJwtSecret()

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    let plan = decoded.plan || 'free'
    let role = decoded.role || 'user'
    try {
      const user = await findUserById(decoded.id)
      if (!user) return res.status(401).json({ error: 'Invalid token' })
      plan = user.plan || 'free'
      role = user.role || 'user'
    } catch {
      // DB unreachable — fall back to token claims so requests still work offline-ish
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role,
      plan,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
