import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as userController from '../controllers/userController.js'

const router = Router()

import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.put('/profile', authMiddleware, userController.updateProfile)
router.post('/change-password', authMiddleware, userController.changePassword)
router.delete('/account', authMiddleware, userController.deleteAccount)
router.get('/stats', authMiddleware, userController.getStats)
router.post('/watch-history', authMiddleware, userController.addWatchEntryHandler)
router.get('/watch-history', authMiddleware, userController.getWatchHistoryHandler)
router.get('/watchlist', authMiddleware, userController.getWatchlistHandler)
router.post('/watchlist', authMiddleware, userController.addToWatchlistHandler)
router.delete('/watchlist/:contentId', authMiddleware, userController.removeFromWatchlistHandler)
router.post('/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar)

export default router
