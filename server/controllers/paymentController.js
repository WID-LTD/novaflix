import { v4 as uuidv4 } from 'uuid'
import { addSubscription, getUserSubscription, updateUser, createTransaction, getTransactionByReference, updateTransactionByReference } from '../db.js'

const PLANS = {
  student: 800,
  basic: 1500,
  standard: 2500,
  premium: 5500,
}

const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/payment/success'

let _paystack = null
async function getPaystack() {
  if (_paystack) return _paystack
  if (!process.env.PAYSTACK_SECRET_KEY) return null
  try {
    const paystackModule = await import('paystack-api')
    const PaystackAPI = paystackModule.default || paystackModule
    _paystack = new PaystackAPI(process.env.PAYSTACK_SECRET_KEY)
    return _paystack
  } catch (err) {
    console.warn('[payment] Failed to init Paystack:', err.message)
    return null
  }
}

export async function initialize(req, res) {
  try {
    const { plan } = req.body
    const amount = PLANS[plan]
    if (!amount) return res.status(400).json({ error: 'Invalid plan' })

    const reference = `SUB-${uuidv4().split('-')[0]}-${Date.now()}`

    await createTransaction({
      userId: req.userId,
      reference,
      type: 'subscription',
      plan,
      amount,
      status: 'pending',
    })

    const paystack = await getPaystack()
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const response = await paystack.transaction.initialize({
      email: req.user.email,
      amount: amount * 100,
      reference,
      callback_url: `${CALLBACK_URL}?reference=${reference}&plan=${plan}`,
      metadata: { userId: req.userId, plan },
    })

    res.json({ success: true, authorization_url: response.data.authorization_url, reference })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function verify(req, res) {
  try {
    const { reference, plan } = req.query
    if (!reference) return res.status(400).json({ error: 'Reference required' })

    const paystack = await getPaystack()
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const response = await paystack.transaction.verify({ reference })
    const txData = response.data

    if (txData.status === 'success') {
      const sub = {
        id: uuidv4(),
        userId: req.userId,
        plan: plan || 'basic',
        active: true,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      await addSubscription(sub)
      await updateUser(req.userId, { plan: plan || 'basic' })

      await updateTransactionByReference(reference, {
        status: 'success',
        metadata: { paystackResponse: txData.id },
      })

      res.json({ success: true, subscription: sub })
    } else {
      res.json({ success: false, error: 'Payment not completed', status: txData.status })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function webhook(req, res) {
  try {
    const paystack = await getPaystack()
    if (!paystack) return res.sendStatus(200)

    const event = req.body
    if (event.event === 'charge.success') {
      const { reference, amount } = event.data
      const tx = await getTransactionByReference(reference)
      if (tx && tx.status === 'pending') {
        const sub = {
          id: uuidv4(),
          userId: tx.user_id,
          plan: tx.plan || 'basic',
          active: true,
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
        await addSubscription(sub)
        await updateUser(tx.user_id, { plan: tx.plan || 'basic' })
        await updateTransactionByReference(reference, {
          status: 'success',
          amount: amount / 100,
        })
      }
    }
    res.sendStatus(200)
  } catch (err) {
    console.error('[paystack] Webhook error:', err.message)
    res.sendStatus(200)
  }
}

export async function status(req, res) {
  try {
    const sub = await getUserSubscription(req.userId)
    res.json({ success: true, subscription: sub || null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
