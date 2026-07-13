import { Router } from 'express'
import { subscribeNewsletter, unsubscribeNewsletter } from '../controllers/emailController.js'

const router = Router()

router.post('/subscribe', subscribeNewsletter)
router.get('/unsubscribe', unsubscribeNewsletter)

export default router
