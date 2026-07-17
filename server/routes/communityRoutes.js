import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as controller from '../controllers/communityController.js'

const router = Router()

router.get('/', authMiddleware, controller.list)
router.get('/mine', authMiddleware, controller.myCommunities)
router.get('/:id', authMiddleware, controller.getById)
router.post('/', authMiddleware, controller.create)
router.post('/:id/join', authMiddleware, controller.join)
router.post('/:id/leave', authMiddleware, controller.leave)
router.post('/:id/posts', authMiddleware, controller.addPost)
router.delete('/:id/posts/:postId', authMiddleware, controller.deletePost)

export default router
