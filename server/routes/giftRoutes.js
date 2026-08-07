import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { initializeGift, verifyGift, getMyGifts } from '../controllers/giftController.js'

const router = Router()

router.post('/initialize', authMiddleware, initializeGift)
router.get('/verify', authMiddleware, verifyGift)
router.get('/mine', authMiddleware, getMyGifts)

export default router