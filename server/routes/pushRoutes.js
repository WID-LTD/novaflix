import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as pushController from '../controllers/pushController.js'

const router = Router()

router.post('/subscribe', authMiddleware, pushController.subscribe)
router.post('/unsubscribe', authMiddleware, pushController.unsubscribe)
router.get('/status', authMiddleware, pushController.status)

export default router
