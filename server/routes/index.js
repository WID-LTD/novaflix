import { Router } from 'express'
import authRoutes from './authRoutes.js'
import notificationRoutes from './notificationRoutes.js'
import pushRoutes from './pushRoutes.js'
import reportsRoutes from './reportsRoutes.js'
import appealRoutes from './appealRoutes.js'
import userRoutes from './userRoutes.js'
import creatorRoutes from './creatorRoutes.js'
import paymentRoutes from './paymentRoutes.js'
import tipRoutes from './tipRoutes.js'
import giftRoutes from './giftRoutes.js'
import tmdbRoutes from './tmdbRoutes.js'
import streamRoutes from './streamRoutes.js'
import creatorAuthRoutes from './creatorAuthRoutes.js'
import adminRoutes from './adminRoutes.js'
import emailRoutes from './emailRoutes.js'
import recommendationRoutes from './recommendationRoutes.js'
import interactionRoutes from './interactionRoutes.js'
import payoutRoutes from './payoutRoutes.js'
import adRoutes from './adRoutes.js'
import sessionRoutes from './sessionRoutes.js'
import hooksRoutes from './hooksRoutes.js'
import campaignRoutes from './campaignRoutes.js'
import affiliateRoutes from './affiliateRoutes.js'
import membershipRoutes from './membershipRoutes.js'
import eventRoutes from './eventRoutes.js'
import storeRoutes from './storeRoutes.js'
import courseRoutes from './courseRoutes.js'
import archiveRoutes from './archiveRoutes.js'
import communityRoutes from './communityRoutes.js'
import downloadRoutes from './downloadRoutes.js'
import achievementRoutes from './achievementRoutes.js'
import newsRoutes from './newsRoutes.js'
import shortsRoutes from './shortsRoutes.js'
import shareRoutes from './shareRoutes.js'
import fanRoutes from './fanRoutes.js'
import forumRoutes from './forumRoutes.js'
import triviaRoutes from './triviaRoutes.js'
import chatRoutes from './chatRoutes.js'
import eggRoutes from './eggRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/notifications', notificationRoutes)
router.use('/push', pushRoutes)
router.use('/reports', reportsRoutes)
router.use('/appeals', appealRoutes)
router.use('/creator/auth', creatorAuthRoutes)
router.use('/user', userRoutes)
router.use('/creator', creatorRoutes)
router.use('/payment', paymentRoutes)
router.use('/tips', tipRoutes)
router.use('/gift', giftRoutes)
router.use('/admin', adminRoutes)
router.use('/newsletter', emailRoutes)
router.use('/recommendations', recommendationRoutes)
router.use('/interactions', interactionRoutes)
router.use('/payouts', payoutRoutes)
router.use('/ads', adRoutes)
router.use('/sessions', sessionRoutes)
router.use('/hooks', hooksRoutes)
router.use('/campaigns', campaignRoutes)
router.use('/affiliate', affiliateRoutes)
router.use('/memberships', membershipRoutes)
router.use('/events', eventRoutes)
router.use('/store', storeRoutes)
router.use('/courses', courseRoutes)
router.use('/archive', archiveRoutes)
router.use('/', tmdbRoutes)
router.use('/', streamRoutes)
router.use('/community', communityRoutes)
router.use('/downloads', downloadRoutes)
router.use('/achievements', achievementRoutes)
router.use('/news', newsRoutes)
router.use('/shorts', shortsRoutes)
router.use('/share', shareRoutes)
router.use('/fan', fanRoutes)
router.use('/forum', forumRoutes)
router.use('/trivia', triviaRoutes)
router.use('/chat', chatRoutes)
router.use('/eggs', eggRoutes)

export default router
