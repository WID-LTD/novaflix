import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as creatorController from '../controllers/creatorController.js'
import * as youtubeController from '../controllers/youtubeController.js'
import { getMyEarnings } from '../controllers/creatorEarningsController.js'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 1024 } })

const router = Router()

router.get('/public', creatorController.getPublicCreators)
router.post('/upload', authMiddleware, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), creatorController.addUploadHandler)
router.post('/youtube/preview', authMiddleware, youtubeController.youtubePreview)
router.post('/youtube/import', authMiddleware, youtubeController.youtubeImport)
router.get('/youtube/imports/:jobId', authMiddleware, youtubeController.youtubeImportStatus)
router.get('/uploads', authMiddleware, creatorController.getUploads)
router.put('/uploads/:id', authMiddleware, upload.single('thumbnail'), creatorController.updateUploadHandler)
router.get('/stats', authMiddleware, creatorController.getStats)
router.get('/dashboard', authMiddleware, creatorController.getDashboard)
router.get('/comments', authMiddleware, creatorController.getCreatorComments)
router.get('/graph', authMiddleware, creatorController.getGraph)
router.get('/earnings', authMiddleware, getMyEarnings)

export default router
