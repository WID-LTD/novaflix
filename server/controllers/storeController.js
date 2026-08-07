import { v4 as uuidv4 } from 'uuid'
import {
  createProduct, updateProduct, getProducts, getProductById, getProductsByCreator,
  createOrder, addOrderItem, getOrderByReference, updateOrder, getUserOrders,
  createTransaction, getTransactionByReference, updateTransactionByReference,
} from '../db.js'
import { uploadFile } from '../lib/r2.js'

let _paystack = null
async function getPaystack() {
  if (_paystack) return _paystack
  if (!process.env.PAYSTACK_SECRET_KEY) return null
  try {
    const paystackModule = await import('paystack-api')
    const PaystackAPI = paystackModule.default || paystackModule
    _paystack = new PaystackAPI(process.env.PAYSTACK_SECRET_KEY)
    return _paystack
  } catch { return null }
}

const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000'

// Product CRUD (creator)
export async function createProductHandler(req, res) {
  try {
    const { title, description, price, category, popular } = req.body
    if (!title || price === undefined) return res.status(400).json({ error: 'Title and price required' })

    let imageUrl = req.body.imageUrl || ''
    const imageFile = req.file
    if (imageFile) {
      const key = `merch/${req.userId}/${uuidv4()}-${Date.now()}.jpg`
      const result = await uploadFile({ buffer: imageFile.buffer, key, contentType: imageFile.mimetype })
      if (result.success) imageUrl = result.url
    }

    const product = await createProduct({
      id: uuidv4(), creatorId: req.userId, title, description, price, imageUrl, category, popular,
    })
    res.json({ success: true, product })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function updateProductHandler(req, res) {
  try {
    const updates = { ...req.body }
    const imageFile = req.file
    if (imageFile) {
      const key = `merch/${req.userId}/${uuidv4()}-${Date.now()}.jpg`
      const result = await uploadFile({ buffer: imageFile.buffer, key, contentType: imageFile.mimetype })
      if (result.success) updates.imageUrl = result.url
    }
    const product = await updateProduct(req.params.id, req.userId, updates)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ success: true, product })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function listProducts(req, res) {
  try {
    const products = await getProducts(req.query.category)
    res.json({ success: true, products })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function getProduct(req, res) {
  try {
    const product = await getProductById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ success: true, product })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function myProducts(req, res) {
  try {
    const products = await getProductsByCreator(req.userId)
    res.json({ success: true, products })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// Purchase flow
export async function checkout(req, res) {
  try {
    const { items } = req.body
    if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' })

    let total = 0
    const productDetails = []
    for (const item of items) {
      const product = await getProductById(item.productId)
      if (!product || !product.active) return res.status(400).json({ error: `Product ${item.productId} not available` })
      const qty = item.quantity || 1
      total += parseFloat(product.price) * qty
      productDetails.push({ product, quantity: qty })
    }

    if (total <= 0) {
      const order = await createOrder({ id: uuidv4(), userId: req.userId, total: 0, status: 'paid', reference: `FREE-${uuidv4().split('-')[0]}` })
      for (const pd of productDetails) {
        await addOrderItem({ id: uuidv4(), orderId: order.id, productId: pd.product.id, quantity: pd.quantity, price: parseFloat(pd.product.price) })
      }
      return res.json({ success: true, order, free: true })
    }

    const paystack = await getPaystack()
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const reference = `ORD-${uuidv4().split('-')[0]}-${Date.now()}`

    await createTransaction({
      userId: req.userId, reference, type: 'product', amount: total, status: 'pending',
      metadata: { items: items.map(i => ({ productId: i.productId, quantity: i.quantity || 1 })) },
    })

    const order = await createOrder({ id: uuidv4(), userId: req.userId, total, status: 'pending', reference })

    for (const pd of productDetails) {
      await addOrderItem({ id: uuidv4(), orderId: order.id, productId: pd.product.id, quantity: pd.quantity, price: parseFloat(pd.product.price) })
    }

    const response = await paystack.transaction.initialize({
      email: req.user.email,
      amount: total * 100,
      reference,
      callback_url: `${CALLBACK_URL}/store/success?reference=${reference}`,
      metadata: { userId: req.userId, type: 'product' },
    })

    res.json({ success: true, authorization_url: response.data.authorization_url, reference })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function verifyOrder(req, res) {
  try {
    const { reference } = req.query
    if (!reference) return res.status(400).json({ error: 'Reference required' })
    const paystack = await getPaystack()
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const response = await paystack.transaction.verify({ reference })
    if (response.data.status === 'success') {
      const order = await getOrderByReference(reference)
      if (!order || order.status !== 'pending') {
        return res.json({ success: false, error: 'Order not found or already processed' })
      }
      await updateOrder(reference, { status: 'paid' })
      const platformFee = +(parseFloat(order.total) * 0.15).toFixed(2)
      await updateTransactionByReference(reference, { status: 'success', metadata: { platformFee, orderId: order.id } })
      res.json({ success: true, order: { ...order, status: 'paid', platformFee } })
    } else {
      res.json({ success: false, error: 'Payment not completed' })
    }
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function getOrders(req, res) {
  try {
    const orders = await getUserOrders(req.userId)
    res.json({ success: true, orders })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
