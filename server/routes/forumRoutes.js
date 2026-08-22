import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listTopics, createTopic, getTopic, vote, addReply, replyVote, categories } from '../controllers/forumController.js'
import jwt from 'jsonwebtoken'
import { resolveJwtSecret } from '../config/jwtSecret.js'

function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1]
      const decoded = jwt.verify(token, resolveJwtSecret())
      req.userId = decoded.id
      req.user = { id: decoded.id, role: decoded.role || 'user', plan: decoded.plan || 'free' }
    } catch {}
  }
  next()
}

const router = Router()

router.get('/categories', categories)
router.get('/topics', optionalAuth, listTopics)
router.post('/topics', authMiddleware, createTopic)
router.get('/topics/:id', optionalAuth, getTopic)
router.post('/topics/:id/vote', authMiddleware, vote)
router.post('/topics/:id/replies', authMiddleware, addReply)
router.post('/replies/:id/vote', authMiddleware, replyVote)

export default router
