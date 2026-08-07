import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { conversations, messages } from '../controllers/chatController.js'

const router = Router()

router.get('/conversations', authMiddleware, conversations)
router.get('/messages', authMiddleware, messages)

export default router
