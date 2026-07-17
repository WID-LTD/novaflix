import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'novaflix-secret-key-change-in-production'

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
