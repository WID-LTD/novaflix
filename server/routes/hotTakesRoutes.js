import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listHotTakes, createHotTake, getHotTake, voteHotTake, addHotTakeReply, hotTakeStats } from '../controllers/hotTakesController.js'
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

router.get('/', optionalAuth, listHotTakes)
router.post('/', authMiddleware, createHotTake)
router.get('/:id', optionalAuth, getHotTake)
router.get('/:id/stats', hotTakeStats)
router.post('/:id/vote', authMiddleware, voteHotTake)
router.post('/:id/replies', authMiddleware, addHotTakeReply)

export default router
