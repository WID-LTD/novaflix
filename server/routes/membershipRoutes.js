import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { creatorOrAdminMiddleware } from '../middleware/admin.js'
import {
  createTier, updateTier, listTiers, myTiers,
  subscribe, verifySubscription,
  myMemberships, cancelMembershipHandler,
  mySubscribers,
} from '../controllers/membershipController.js'

const router = Router()

router.post('/tiers', authMiddleware, creatorOrAdminMiddleware, createTier)
router.patch('/tiers/:id', authMiddleware, creatorOrAdminMiddleware, updateTier)
router.get('/tiers/:creatorId', listTiers)
router.get('/my-tiers', authMiddleware, creatorOrAdminMiddleware, myTiers)

router.post('/subscribe', authMiddleware, subscribe)
router.get('/verify', authMiddleware, verifySubscription)

router.get('/my-memberships', authMiddleware, myMemberships)
router.post('/:id/cancel', authMiddleware, cancelMembershipHandler)

router.get('/my-subscribers', authMiddleware, creatorOrAdminMiddleware, mySubscribers)

export default router
