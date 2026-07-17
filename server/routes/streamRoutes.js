import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as streamController from '../controllers/streamController.js'

const router = Router()

router.get('/source', authMiddleware, streamController.source)
router.get('/manifest-info', authMiddleware, streamController.manifestInfo)
router.get('/download', authMiddleware, streamController.download)
router.get('/proxy/*', streamController.proxy)
router.get('/file/:filename', authMiddleware, streamController.serveDownloadedFile)

export default router
