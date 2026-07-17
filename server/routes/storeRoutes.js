import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { creatorOrAdminMiddleware } from '../middleware/admin.js'
import {
  createProductHandler, updateProductHandler, listProducts, getProduct, myProducts,
  checkout, verifyOrder, getOrders,
} from '../controllers/storeController.js'

const router = Router()

router.post('/', authMiddleware, creatorOrAdminMiddleware, createProductHandler)
router.patch('/:id', authMiddleware, creatorOrAdminMiddleware, updateProductHandler)
router.get('/', listProducts)
router.get('/mine', authMiddleware, creatorOrAdminMiddleware, myProducts)
router.get('/:id', getProduct)

router.post('/checkout', authMiddleware, checkout)
router.get('/checkout/verify', authMiddleware, verifyOrder)
router.get('/orders/mine', authMiddleware, getOrders)

export default router
