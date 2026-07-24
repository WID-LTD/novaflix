import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { toggleLike, checkLike, postComment, listComments, removeComment, toggleFollow, checkFollow } from '../controllers/interactionController.js'

const router = Router()

router.post('/like', authMiddleware, toggleLike)
router.get('/like', authMiddleware, checkLike)
router.post('/comment', authMiddleware, postComment)
router.get('/comments', listComments)
router.delete('/comment/:id', authMiddleware, removeComment)
router.post('/follow', authMiddleware, toggleFollow)
router.get('/follow', authMiddleware, checkFollow)

export default router
