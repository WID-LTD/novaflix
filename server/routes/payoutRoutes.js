import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { creatorOrAdminMiddleware } from '../middleware/admin.js'
import { createRecipient, requestWithdraw, getPayoutHistory, getBalance } from '../controllers/payoutController.js'

const router = Router()

router.post('/recipient', authMiddleware, creatorOrAdminMiddleware, createRecipient)
router.post('/withdraw', authMiddleware, creatorOrAdminMiddleware, requestWithdraw)
router.get('/history', authMiddleware, creatorOrAdminMiddleware, getPayoutHistory)
router.get('/balance', authMiddleware, getBalance)

export default router
