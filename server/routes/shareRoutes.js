import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { createLink, resolveLink, getStats } from '../controllers/shareController.js'

const router = Router()

router.post('/links', authMiddleware, createLink)
router.get('/links/stats', authMiddleware, getStats)
router.get('/:code', resolveLink)

export default router
