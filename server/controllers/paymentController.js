import { v4 as uuidv4 } from 'uuid'
import { addSubscription, getUserSubscription, updateUser, createTransaction, getTransactionByReference, updateTransactionByReference, getPlanBySlug, listPlans } from '../db.js'
import { initializePayment, verifyPayment, isConfigured } from '../lib/gateway.js'

export async function listPricing(req, res) {
  try {
    const plans = await listPlans()
    res.json({ success: true, plans, currency: 'NGN' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function initialize(req, res) {
  try {
    const { plan, gateway } = req.body
    const planRow = await getPlanBySlug(plan)
    const amount = planRow?.price
    if (!amount) return res.status(400).json({ error: 'Invalid plan' })

    const selectedGateway = gateway === 'flutterwave' ? 'flutterwave' : 'paystack'
    if (!isConfigured(selectedGateway)) {
      return res.status(400).json({ error: `${selectedGateway} is not configured. Please select another payment method.` })
    }

    const reference = `SUB-${uuidv4().split('-')[0]}-${Date.now()}`

    await createTransaction({
      userId: req.userId,
      reference,
      type: 'subscription',
      plan,
      amount,
      status: 'pending',
      metadata: { gateway: selectedGateway },
    })

    const result = await initializePayment({
      gateway: selectedGateway,
      email: req.user.email,
      amount,
      reference,
      callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/payment/success?reference=${reference}&plan=${plan}`,
      metadata: { userId: req.userId, plan },
    })

    if (!result.success) return res.status(500).json({ error: result.error })

    res.json({ success: true, authorization_url: result.authorization_url, reference, gateway: selectedGateway })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function verify(req, res) {
  try {
    const { reference, plan } = req.query
    if (!reference) return res.status(400).json({ error: 'Reference required' })

    const tx = await getTransactionByReference(reference)
    if (!tx) return res.status(404).json({ error: 'Transaction not found' })

    const gateway = tx.metadata?.gateway || 'paystack'

    const result = await verifyPayment({ gateway, reference })
    if (result.success) {
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
      await updateTransactionByReference(reference, { status: 'success' })

      res.json({ success: true, subscription: sub, gateway })
    } else {
      res.json({ success: false, error: 'Payment not completed', status: result.status })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function webhook(req, res) {
  try {
    const event = req.body
    const gateway = event.gateway || 'paystack'

    if (gateway === 'paystack' && event.event === 'charge.success') {
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
        await updateTransactionByReference(reference, { status: 'success', amount: amount / 100 })
      }
    }

    if (gateway === 'flutterwave' && event.event === 'charge.completed' && event.data.status === 'successful') {
      const { tx_ref, amount } = event.data
      const tx = await getTransactionByReference(tx_ref)
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
        await updateTransactionByReference(tx_ref, { status: 'success', amount })
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('[webhook] Error:', err.message)
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

export async function gatewayInfo(req, res) {
  res.json({
    paystack: { configured: isConfigured('paystack'), publicKey: process.env.PAYSTACK_PUBLIC_KEY || '' },
    flutterwave: { configured: isConfigured('flutterwave'), publicKey: process.env.FLW_PUBLIC_KEY || '' },
  })
}
