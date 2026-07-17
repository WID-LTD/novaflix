import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware } from '../middleware/admin.js'
import * as campaignController from '../controllers/campaignController.js'

const router = Router()

router.post('/', authMiddleware, campaignController.create)
router.get('/', authMiddleware, campaignController.list)
router.patch('/:id', authMiddleware, campaignController.update)
router.get('/active', campaignController.getActivePromoted)

export default router
