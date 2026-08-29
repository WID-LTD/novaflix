import jwt from 'jsonwebtoken'
import { createHash } from 'node:crypto'
import { resolveJwtSecret } from '../config/jwtSecret.js'
import { findUserById, isTokenBlocked } from '../db.js'

const JWT_SECRET = resolveJwtSecret()

export async function authenticateToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    // Check if token is blocklisted (revoked on logout)
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const blocked = await isTokenBlocked(tokenHash)
    if (blocked) {
      return res.status(401).json({ error: 'Token has been revoked' })
    }

    req.userId = decoded.id
    let plan = decoded.plan || 'free'
    let role = decoded.role || 'viewer'
    let user = null
    try {
      user = await findUserById(decoded.id)
      if (!user) return res.status(401).json({ error: 'Invalid token' })
      plan = user.plan || 'free'
      role = user.role || 'viewer'
    } catch {
      // DB unreachable — fall back to token claims so requests still work offline-ish
    }
    // Block banned/suspended users on every request
    if (user) {
      if (user.role === 'banned') {
        return res.status(403).json({ error: 'Account banned', accountStatus: 'banned' })
      }
      if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
        return res.status(403).json({ error: 'Account suspended', accountStatus: 'suspended' })
      }
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

// Alias — most route modules import the auth guard under this name.
export const authMiddleware = authenticateToken

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
    }
    next()
  }
}

export async function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' })
  }
  next()
}
