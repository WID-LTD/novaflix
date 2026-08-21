import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as postController from '../controllers/postController.js'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 1024 } })

const router = Router()

// Public feed
router.get('/feed', authMiddleware, postController.getFeed)

// User posts
router.get('/user/:userId', authMiddleware, postController.getUserPosts)

// Create post
router.post('/', authMiddleware, upload.array('media', 5), postController.createPost)

// Like/Unlike post
router.post('/:postId/like', authMiddleware, postController.likePost)

// Comments
router.get('/:postId/comments', authMiddleware, postController.getPostComments)
router.post('/:postId/comments', authMiddleware, postController.createPostComment)

// Delete post
router.delete('/:postId', authMiddleware, postController.deletePost)

export default router