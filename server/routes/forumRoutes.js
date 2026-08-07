import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listTopics, createTopic, getTopic, vote, addReply, replyVote, categories } from '../controllers/forumController.js'

const router = Router()

router.get('/categories', categories)
router.get('/topics', authMiddleware, listTopics)
router.post('/topics', authMiddleware, createTopic)
router.get('/topics/:id', authMiddleware, getTopic)
router.post('/topics/:id/vote', authMiddleware, vote)
router.post('/topics/:id/replies', authMiddleware, addReply)
router.post('/replies/:id/vote', authMiddleware, replyVote)

export default router
