import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware } from '../middleware/admin.js'
import * as adminController from '../controllers/adminController.js'

const router = Router()

router.use(authMiddleware, adminMiddleware)

router.get('/users', adminController.getUsers)
router.get('/users/:id', adminController.getUser)
router.put('/users/:id/role', adminController.updateUserRole)
router.post('/users/:id/ban', adminController.banUser)
router.get('/stats', adminController.getStats)
router.get('/uploads', adminController.getUploads)
router.get('/creators', adminController.getCreators)
router.post('/newsletter/send', adminController.sendNewsletter)
router.get('/newsletter/subscribers', adminController.getNewsletterSubscribers)

export default router
