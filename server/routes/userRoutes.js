import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as userController from '../controllers/userController.js'

const router = Router()

router.put('/profile', authMiddleware, userController.updateProfile)
router.post('/change-password', authMiddleware, userController.changePassword)
router.delete('/account', authMiddleware, userController.deleteAccount)
router.get('/stats', authMiddleware, userController.getStats)
router.post('/watch-history', authMiddleware, userController.addWatchEntryHandler)
router.get('/watch-history', authMiddleware, userController.getWatchHistoryHandler)

export default router
