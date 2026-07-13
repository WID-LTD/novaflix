import { Router } from 'express'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import creatorRoutes from './creatorRoutes.js'
import paymentRoutes from './paymentRoutes.js'
import tipRoutes from './tipRoutes.js'
import tmdbRoutes from './tmdbRoutes.js'
import streamRoutes from './streamRoutes.js'
import creatorAuthRoutes from './creatorAuthRoutes.js'
import adminRoutes from './adminRoutes.js'
import emailRoutes from './emailRoutes.js'
import recommendationRoutes from './recommendationRoutes.js'
import interactionRoutes from './interactionRoutes.js'
import payoutRoutes from './payoutRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/creator/auth', creatorAuthRoutes)
router.use('/user', userRoutes)
router.use('/creator', creatorRoutes)
router.use('/payment', paymentRoutes)
router.use('/tips', tipRoutes)
router.use('/admin', adminRoutes)
router.use('/newsletter', emailRoutes)
router.use('/recommendations', recommendationRoutes)
router.use('/interactions', interactionRoutes)
router.use('/payouts', payoutRoutes)
router.use('/', tmdbRoutes)
router.use('/', streamRoutes)

export default router
