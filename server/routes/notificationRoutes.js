import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { 
  list, 
  unreadCount, 
  markRead, 
  markAllRead,
  sendLiveStreamNotification,
  sendNewContentNotification,
  sendNewEpisodeNotification,
  sendPaymentNotification,
  sendWithdrawalNotification,
  sendMilestoneNotification
} from '../controllers/notificationController.js'

const router = Router()

// User notification endpoints
router.get('/', authMiddleware, list)
router.get('/unread-count', authMiddleware, unreadCount)
router.post('/:id/read', authMiddleware, markRead)
router.post('/read-all', authMiddleware, markAllRead)

// Admin/Internal endpoints for triggering notifications
router.post('/live-stream', authMiddleware, adminMiddleware, sendLiveStreamNotification)
router.post('/new-content', authMiddleware, adminMiddleware, sendNewContentNotification)
router.post('/new-episode', authMiddleware, adminMiddleware, sendNewEpisodeNotification)
router.post('/payment', authMiddleware, adminMiddleware, sendPaymentNotification)
router.post('/withdrawal', authMiddleware, adminMiddleware, sendWithdrawalNotification)
router.post('/milestone', authMiddleware, adminMiddleware, sendMilestoneNotification)

export default router