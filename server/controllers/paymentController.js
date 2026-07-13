import { v4 as uuidv4 } from 'uuid'
import { addSubscription, getUserSubscription, updateUser, createTransaction, getTransactionByReference } from '../db.js'
import Paystack from 'paystack-api'

const paystack = process.env.PAYSTACK_SECRET_KEY
  ? new Paystack(process.env.PAYSTACK_SECRET_KEY)
  : null

const PLANS = { premium: 999, duo: 1499 }
const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/payment/success'

export async function initialize(req, res) {
  try {
    const { plan } = req.body
    const amount = PLANS[plan]
    if (!amount) return res.status(400).json({ error: 'Invalid plan' })
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const user = req.user
    const reference = `SUB-${uuidv4().split('-')[0]}-${Date.now()}`

    const response = await paystack.transaction.initialize({
      email: user.email,
      amount: amount * 100,
      reference,
      callback_url: `${CALLBACK_URL}?reference=${reference}&plan=${plan}`,
      metadata: { userId: req.userId, plan },
    })

    await createTransaction({
      userId: req.userId,
      reference,
      type: 'subscription',
      plan,
      amount,
      status: 'pending',
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
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const response = await paystack.transaction.verify({ reference })
    const txData = response.data

    if (txData.status === 'success') {
      const sub = {
        id: uuidv4(),
        userId: req.userId,
        plan: plan || 'premium',
        active: true,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      await addSubscription(sub)
      await updateUser(req.userId, { plan: plan || 'premium' })

      const existing = await getTransactionByReference(reference)
      if (existing) {
        await createTransaction({
          userId: req.userId,
          reference,
          type: 'subscription',
          plan: plan || 'premium',
          amount: txData.amount / 100,
          status: 'success',
          metadata: { paystackResponse: txData.id },
        })
      }

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
    const event = req.body
    if (event.event === 'charge.success') {
      const { reference, metadata, amount } = event.data
      const tx = await getTransactionByReference(reference)
      if (tx && tx.status === 'pending') {
        const sub = {
          id: uuidv4(),
          userId: tx.user_id,
          plan: tx.plan || 'premium',
          active: true,
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
        await addSubscription(sub)
        await updateUser(tx.user_id, { plan: tx.plan || 'premium' })
        await createTransaction({
          userId: tx.user_id,
          reference,
          type: 'subscription',
          plan: tx.plan,
          amount: amount / 100,
          status: 'success',
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
