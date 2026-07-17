import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { creatorOrAdminMiddleware } from '../middleware/admin.js'
import {
  createEvent, updateEvent, listEvents, getEvent, myEvents,
  purchaseTicket, verifyTicketPurchase,
  myTickets,
} from '../controllers/eventController.js'

const router = Router()

router.post('/', authMiddleware, creatorOrAdminMiddleware, createEvent)
router.patch('/:id', authMiddleware, creatorOrAdminMiddleware, updateEvent)
router.get('/', listEvents)
router.get('/mine', authMiddleware, creatorOrAdminMiddleware, myEvents)
router.get('/:id', getEvent)

router.post('/purchase', authMiddleware, purchaseTicket)
router.get('/purchase/verify', authMiddleware, verifyTicketPurchase)

router.get('/my-tickets', authMiddleware, myTickets)

export default router
