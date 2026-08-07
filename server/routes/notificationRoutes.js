import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { list, unreadCount, markRead, markAllRead } from '../controllers/notificationController.js'

const router = Router()

router.get('/', authMiddleware, list)
router.get('/unread-count', authMiddleware, unreadCount)
router.post('/:id/read', authMiddleware, markRead)
router.post('/read-all', authMiddleware, markAllRead)

export default router