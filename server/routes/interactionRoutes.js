import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { toggleLike, checkLike, postComment, listComments, removeComment } from '../controllers/interactionController.js'

const router = Router()

router.post('/like', authMiddleware, toggleLike)
router.get('/like', authMiddleware, checkLike)
router.post('/comment', authMiddleware, postComment)
router.get('/comments', listComments)
router.delete('/comment/:id', authMiddleware, removeComment)

export default router
