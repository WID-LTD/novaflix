import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as streamController from '../controllers/streamController.js'

const router = Router()

// Spoof/testing bypass: allow ?mock=1 without auth so limited catalog works when scraper unmaintained
function optionalAuthForMock(req, res, next) {
  if (String(req.query.mock) === '1') {
    // inject mock user so downstream plan checks pass
    req.userId = 'mock-user'
    req.user = { plan: 'premium', role: 'viewer', planFeatures: { adFree: true, unlimitedSkips: true } }
    return next()
  }
  return authMiddleware(req, res, next)
}

router.get('/source', optionalAuthForMock, streamController.source)
router.get('/stream/creator/:file', streamController.streamCreatorUpload)
router.get('/manifest-info', optionalAuthForMock, streamController.manifestInfo)
router.get('/download', optionalAuthForMock, streamController.download)
router.get('/proxy/*', streamController.proxy)
router.get('/file/:filename', authMiddleware, streamController.serveDownloadedFile)

export default router
