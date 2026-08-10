import jwt from 'jsonwebtoken'
import { resolveJwtSecret } from '../config/jwtSecret.js'

const JWT_SECRET = resolveJwtSecret()

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      plan: decoded.plan || 'free',
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
