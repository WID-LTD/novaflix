import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as creatorController from '../controllers/creatorController.js'

const router = Router()

router.post('/upload', authMiddleware, creatorController.addUploadHandler)
router.get('/uploads', authMiddleware, creatorController.getUploads)
router.get('/stats', authMiddleware, creatorController.getStats)
router.get('/dashboard', authMiddleware, creatorController.getDashboard)
router.get('/comments', authMiddleware, creatorController.getCreatorComments)
router.get('/graph', authMiddleware, creatorController.getGraph)

export default router
