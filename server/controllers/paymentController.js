import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import pool from '../config/database.js'
import { addSubscription, getUserSubscription, updateUser, createTransaction, getTransactionByReference, updateTransactionByReference, getPlanBySlug, listPlans } from '../db.js'
import { initializePayment, verifyPayment, isConfigured } from '../lib/gateway.js'
import { signToken } from './authController.js'

function safeEqual(a, b) {
  if (!a || !b) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function verifyPaystackSignature(rawBody, signature, secret) {
  if (!secret || !signature || !rawBody) return false
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
  if (safeEqual(signature, expected)) return true
  // legacy double-hash support for older paystack signatures
  const hashSig = createHash('sha256').update(signature).digest('hex')
  const hashExp = createHash('sha256').update(expected).digest('hex')
  return safeEqual(hashSig, hashExp)
}

function verifyFlutterwaveSignature(rawBody, verifHash, secret) {
  if (!secret || !verifHash || !rawBody) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqual(verifHash, expected)
}

async function creditReferralCommission(referredUserId, planSlug) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Atomically find and update the referral record
    // Only process if status is 'converted' (first paid subscription)
    const { rows } = await client.query(
      `UPDATE affiliate_referrals
       SET commission = ROUND((SELECT price FROM plans WHERE slug = $2)::numeric * 0.10, 2),
           status = 'paid',
           plan = $2
       WHERE id = (
         SELECT id FROM affiliate_referrals
         WHERE referred_id = $1 AND status = 'converted'
         FOR UPDATE
         LIMIT 1
       )
       AND status = 'converted'
       RETURNING id, referrer_id, commission`,
      [referredUserId, planSlug || 'basic']
    )
    
    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return
    }
    
    const { referrer_id, commission } = rows[0]
    
    // Credit referrer coins
    await client.query(
      `UPDATE users SET coins = COALESCE(coins,0) + $1 WHERE id = $2`,
      [Math.round(commission), referrer_id]
    )
    
    await client.query('COMMIT')
    
    // Notify referrer in realtime
    try {
      const { notifyUser } = await import('../services/realtime.js')
      notifyUser(referrer_id, { type: 'referral_paid', commission, referredId: referredUserId, plan: planSlug })
    } catch {}
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[referral] commission error', e.message)
  }
}

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
    const { reference } = req.query
    if (!reference) return res.status(400).json({ error: 'Reference required' })

    const tx = await getTransactionByReference(reference)
    if (!tx) return res.status(404).json({ error: 'Transaction not found' })
    if (tx.user_id !== req.userId) return res.status(403).json({ error: 'Unauthorized' })

    // Idempotency: if already verified, return existing subscription
    if (tx.status === 'success') {
      const existingSub = await getUserSubscription(req.userId)
      return res.json({ success: true, subscription: existingSub, alreadyVerified: true })
    }
    if (tx.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction not pending' })
    }

    const gateway = tx.metadata?.gateway || 'paystack'
    const result = await verifyPayment({ gateway, reference })
    if (!result.success) {
      return res.json({ success: false, error: 'Payment not completed', status: result.status })
    }

    // Atomic fulfillment - same logic as webhook to prevent race double-credit
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `UPDATE transactions SET status = 'success', amount = $2 WHERE reference = $1 AND status = 'pending' RETURNING id, user_id, plan`,
        [reference, result.amount || tx.amount]
      )
      if (rows.length === 0) {
        await client.query('ROLLBACK')
        const existingSub = await getUserSubscription(req.userId)
        return res.json({ success: true, subscription: existingSub, alreadyVerified: true })
      }
      const txId = rows[0].id
      const planSlug = rows[0].plan || tx.plan || 'basic'
      await client.query(
        `INSERT INTO subscriptions (id, user_id, plan, active, started_at, expires_at)
         VALUES ($1, $2, $3, true, NOW(), NOW() + INTERVAL '30 days')
         ON CONFLICT (id) DO UPDATE SET plan = EXCLUDED.plan, active = true, started_at = NOW(), expires_at = NOW() + INTERVAL '30 days'`,
        [txId, req.userId, planSlug]
      )
      await client.query(`UPDATE users SET plan = $2 WHERE id = $1`, [req.userId, planSlug])
      // Referral inside same tx
      const refRows = await client.query(
        `UPDATE affiliate_referrals SET commission = ROUND((SELECT price FROM plans WHERE slug = $2)::numeric * 0.10, 2), status = 'paid', plan = $2
         WHERE id = (SELECT id FROM affiliate_referrals WHERE referred_id = $1 AND status = 'converted' FOR UPDATE LIMIT 1) AND status = 'converted' RETURNING referrer_id, commission`,
        [req.userId, planSlug]
      )
      if (refRows.rows.length > 0) {
        await client.query(`UPDATE users SET coins = COALESCE(coins,0) + $1 WHERE id = $2`, [Math.round(refRows.rows[0].commission), refRows.rows[0].referrer_id])
      }
      await client.query('COMMIT')
      const token = signToken({ id: req.userId, email: req.user.email, role: req.user.role || 'user', plan: planSlug })
      const sub = await getUserSubscription(req.userId)
      // Notify referrer non-blocking
      if (refRows.rows.length > 0) {
        try { const { notifyUser } = await import('../services/realtime.js'); notifyUser(refRows.rows[0].referrer_id, { type: 'referral_paid', commission: refRows.rows[0].commission, referredId: req.userId, plan: planSlug }) } catch {}
      }
      res.json({ success: true, subscription: sub, gateway, plan: planSlug, token })
    } catch (e) {
      try { await client.query('ROLLBACK') } catch {}
      throw e
    } finally {
      client.release()
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function webhook(req, res) {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body)

    // Detect gateway by headers (more reliable than body.gateway)
    let gateway = 'paystack'
    const hasPaystackSig = !!req.headers['x-paystack-signature']
    const hasFlutterwaveSig = !!(req.headers['verif-hash'] || req.headers['x-flw-verif-hash'])
    if (hasFlutterwaveSig) gateway = 'flutterwave'
    else if (hasPaystackSig) gateway = 'paystack'
    else gateway = req.body?.gateway || 'paystack'

    // Signature verification (enforced when secrets are configured)
    if (gateway === 'paystack') {
      const signature = req.headers['x-paystack-signature']
      if (process.env.PAYSTACK_SECRET_KEY) {
        if (!signature || !verifyPaystackSignature(rawBody, signature, process.env.PAYSTACK_SECRET_KEY)) {
          console.warn('[webhook] Invalid Paystack signature')
          return res.status(400).json({ error: 'Invalid signature' })
        }
      }
    } else if (gateway === 'flutterwave') {
      const verifHash = req.headers['verif-hash'] || req.headers['x-flw-verif-hash']
      const secret = process.env.FLW_SECRET_HASH || process.env.FLW_SECRET_KEY
      if (secret) {
        if (!verifHash || !verifyFlutterwaveSignature(rawBody, verifHash, secret)) {
          console.warn('[webhook] Invalid Flutterwave signature')
          return res.status(400).json({ error: 'Invalid signature' })
        }
      }
    }

    // Log webhook for debugging
    console.log(`[webhook] Received ${gateway} event=${req.body?.event} ref=${req.body?.data?.reference || req.body?.data?.tx_ref}`)

    // Handle Paystack
    if (gateway === 'paystack' && req.body?.event === 'charge.success') {
      const { reference, amount } = req.body.data
      // Try generic handler first (covers all transaction types)
      const handled = await handleGenericWebhookSuccess(reference, amount / 100, req.body.data, gateway)
      if (!handled) {
        // Fallback to subscription handler for backward compat
        await handleSuccessfulPayment(reference, amount / 100, req.body.data)
      }
    } else if (gateway === 'flutterwave' && req.body?.event === 'charge.completed' && req.body?.data?.status === 'successful') {
      const { tx_ref, amount, reference } = req.body.data
      const ref = tx_ref || reference
      const handled = await handleGenericWebhookSuccess(ref, amount, req.body.data, gateway)
      if (!handled) {
        await handleSuccessfulPayment(ref, amount, req.body.data)
      }
    } else {
      // Fallback: try generic handler for any successful charge (covers tip/gift etc if gateway sent different event)
      const ref = req.body?.data?.reference || req.body?.data?.tx_ref
      const amountRaw = req.body?.data?.amount
      if (ref && amountRaw) {
        const amount = gateway === 'paystack' ? amountRaw / 100 : amountRaw
        await handleGenericWebhookSuccess(ref, amount, req.body?.data, gateway)
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('[webhook] Error:', err.message)
    // Always return 200 to prevent gateway retry storm, unless signature invalid
    res.sendStatus(200)
  }
}

// Generic webhook fulfillment — handles all transaction types (subscription, tip, gift, membership, product, course, event_ticket)
async function handleGenericWebhookSuccess(reference, amount, eventData, gateway) {
  const { getTransactionByReference } = await import('../db.js')
  const tx = await getTransactionByReference(reference)
  if (!tx) {
    console.log(`[webhook] No transaction found for ${reference}`)
    return false
  }
  if (tx.status === 'success') {
    console.log(`[webhook] Transaction ${reference} already processed`)
    return true
  }
  if (tx.status !== 'pending') {
    console.log(`[webhook] Transaction ${reference} not pending (status=${tx.status})`)
    return true
  }

  // Dispatch by transaction type
  try {
    switch (tx.type) {
      case 'subscription':
        await handleSuccessfulPayment(reference, amount, eventData)
        return true
      case 'tip':
        await handleWebhookTip(reference, amount, eventData, tx)
        return true
      case 'gift':
        await handleWebhookGift(reference, amount, eventData, tx)
        return true
      case 'membership':
        await handleWebhookMembership(reference, amount, eventData, tx)
        return true
      case 'product':
        await handleWebhookProduct(reference, amount, eventData, tx)
        return true
      case 'course':
        await handleWebhookCourse(reference, amount, eventData, tx)
        return true
      case 'event_ticket':
        await handleWebhookEventTicket(reference, amount, eventData, tx)
        return true
      default:
        console.log(`[webhook] Unknown type ${tx.type} for ${reference}, falling back to subscription handler`)
        return false
    }
  } catch (e) {
    console.error(`[webhook] Failed to handle ${tx.type} ${reference}:`, e.message)
    throw e
  }
}

async function handleWebhookTip(reference, amount, eventData, tx) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `UPDATE transactions SET status='success', amount=$2, metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('paystackId', $3::text, 'webhook', 'true'::text) WHERE reference=$1 AND status='pending' RETURNING id`,
      [reference, amount, String(eventData.id || '')]
    )
    if (rows.length === 0) { await client.query('ROLLBACK'); return }
    const gross = amount
    const platformFee = Math.round(gross * 0.20 * 100) / 100
    const creatorShare = Math.round((gross - platformFee) * 100) / 100
    await client.query(`INSERT INTO tips (id, user_id, creator_id, amount, message) VALUES ($1,$2,$3,$4,$5)`, [uuidv4(), tx.user_id, tx.creator_id, gross, tx.metadata?.message || ''])
    if (tx.creator_id && creatorShare > 0) {
      const { rows: balRows } = await client.query(`UPDATE creator_profiles SET wallet_balance_ngn = wallet_balance_ngn + $1 WHERE user_id=$2 RETURNING wallet_balance_ngn`, [creatorShare, tx.creator_id])
      const bal = balRows[0]?.wallet_balance_ngn || creatorShare
      await client.query(`INSERT INTO creator_wallet_transactions (creator_id, type, amount_ngn, balance_after_ngn, metadata) VALUES ($1,'tip',$2,$3,$4)`, [tx.creator_id, creatorShare, bal, JSON.stringify({ reference, gross, platformFee, paystackId: eventData.id, webhook: true })])
    }
    await client.query('COMMIT')
    console.log(`[webhook] Tip ${reference} fulfilled -> creator ${tx.creator_id} +₦${creatorShare}`)
  } catch (e) { try { await client.query('ROLLBACK') } catch {}; throw e } finally { client.release() }
}

async function handleWebhookGift(reference, amount, eventData, tx) {
  const GIFT_FEE = 0.20
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const gross = amount
    const fee = +(gross * GIFT_FEE).toFixed(2)
    const net = +(gross - fee).toFixed(2)
    const { rows } = await client.query(
      `UPDATE transactions SET status='success', amount=$2, metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('paystackId', $3::text, 'fee', $4::text, 'netAmount', $5::text, 'webhook','true'::text) WHERE reference=$1 AND status='pending' RETURNING id`,
      [reference, gross, String(eventData.id||''), String(fee), String(net)]
    )
    if (rows.length === 0) { await client.query('ROLLBACK'); return }
    await client.query(`INSERT INTO glow_gifts (id, sender_id, creator_id, amount, fee, net_amount, note) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [uuidv4(), tx.user_id, tx.creator_id, gross, fee, net, tx.metadata?.note||''])
    if (tx.creator_id && net > 0) {
      const { rows: balRows } = await client.query(`UPDATE creator_profiles SET wallet_balance_ngn = wallet_balance_ngn + $1 WHERE user_id=$2 RETURNING wallet_balance_ngn`, [net, tx.creator_id])
      const bal = balRows[0]?.wallet_balance_ngn || net
      await client.query(`INSERT INTO creator_wallet_transactions (creator_id, type, amount_ngn, balance_after_ngn, metadata) VALUES ($1,'gift',$2,$3,$4)`, [tx.creator_id, net, bal, JSON.stringify({ reference, gross, fee, net, paystackId: eventData.id, webhook:true})])
    }
    await client.query('COMMIT')
    console.log(`[webhook] Gift ${reference} fulfilled net ₦${net}`)
  } catch (e) { try { await client.query('ROLLBACK') } catch {}; throw e } finally { client.release() }
}

async function handleWebhookMembership(reference, amount, eventData, tx) {
  const { createMembership } = await import('../db.js')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(`UPDATE transactions SET status='success', amount=$2 WHERE reference=$1 AND status='pending' RETURNING id`, [reference, amount])
    if (rows.length === 0) { await client.query('ROLLBACK'); return }
    await createMembership({ id: uuidv4(), userId: tx.user_id, tierId: tx.metadata?.tierId, creatorId: tx.creator_id, status: 'active', startedAt: new Date().toISOString(), expiresAt: new Date(Date.now()+30*86400000).toISOString() })
    const gross = parseFloat(tx.amount) || amount
    const platformFee = Math.round(gross * 0.20 * 100) / 100
    const creatorShare = Math.round((gross - platformFee)*100)/100
    if (tx.creator_id && creatorShare>0) {
      const { rows: balRows } = await client.query(`UPDATE creator_profiles SET wallet_balance_ngn = wallet_balance_ngn + $1 WHERE user_id=$2 RETURNING wallet_balance_ngn`, [creatorShare, tx.creator_id])
      const bal = balRows[0]?.wallet_balance_ngn || creatorShare
      await client.query(`INSERT INTO creator_wallet_transactions (creator_id, type, amount_ngn, balance_after_ngn, metadata) VALUES ($1,'membership',$2,$3,$4)`, [tx.creator_id, creatorShare, bal, JSON.stringify({ reference, gross, platformFee, tierId: tx.metadata?.tierId, webhook:true})])
    }
    await client.query('COMMIT')
    console.log(`[webhook] Membership ${reference} fulfilled`)
  } catch (e) { try { await client.query('ROLLBACK') } catch {}; throw e } finally { client.release() }
}

async function handleWebhookProduct(reference, amount, eventData, tx) {
  const { getOrderByReference } = await import('../db.js')
  const order = await getOrderByReference(reference)
  if (!order || order.status !== 'pending') return
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(`UPDATE transactions SET status='success', amount=$2, metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('orderId', $3::text, 'webhook','true'::text) WHERE reference=$1 AND status='pending' RETURNING id`, [reference, amount, order.id])
    if (rows.length===0){ await client.query('ROLLBACK'); return}
    await client.query(`UPDATE orders SET status='paid' WHERE reference=$1`, [reference])
    const { rows: items } = await client.query(`SELECT oi.*, p.creator_id FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1`, [order.id])
    for (const it of items) {
      if (!it.creator_id) continue
      const lineGross = parseFloat(it.price) * parseInt(it.quantity)
      const lineNet = Math.round(lineGross * 0.85 * 100)/100
      const { rows: balRows } = await client.query(`UPDATE creator_profiles SET wallet_balance_ngn = wallet_balance_ngn + $1 WHERE user_id=$2 RETURNING wallet_balance_ngn`, [lineNet, it.creator_id])
      const bal = balRows[0]?.wallet_balance_ngn || lineNet
      await client.query(`INSERT INTO creator_wallet_transactions (creator_id, type, amount_ngn, balance_after_ngn, metadata) VALUES ($1,'product',$2,$3,$4)`, [it.creator_id, lineNet, bal, JSON.stringify({ reference, orderId: order.id, productId: it.product_id, gross: lineGross, webhook:true})])
    }
    await client.query('COMMIT')
    console.log(`[webhook] Store order ${reference} fulfilled`)
  } catch(e){ try{await client.query('ROLLBACK')}catch{}; throw e} finally{client.release()}
}

async function handleWebhookCourse(reference, amount, eventData, tx) {
  const { createEnrollment } = await import('../db.js')
  const courseId = tx.metadata?.courseId
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(`UPDATE transactions SET status='success', amount=$2 WHERE reference=$1 AND status='pending' RETURNING id`, [reference, amount])
    if (rows.length===0){ await client.query('ROLLBACK'); return}
    const { rows: courseRows } = await client.query(`SELECT creator_id, price FROM courses WHERE id=$1`, [courseId])
    const creatorId = courseRows[0]?.creator_id || tx.creator_id
    await createEnrollment({ id: uuidv4(), userId: tx.user_id, courseId, transactionId: tx.id, progress:0, completed:false })
    const gross = parseFloat(tx.amount) || parseFloat(courseRows[0]?.price) || amount
    const platformFee = Math.round(gross*0.20*100)/100
    const creatorShare = Math.round((gross-platformFee)*100)/100
    if (creatorId && creatorShare>0){
      const { rows: balRows } = await client.query(`UPDATE creator_profiles SET wallet_balance_ngn = wallet_balance_ngn + $1 WHERE user_id=$2 RETURNING wallet_balance_ngn`, [creatorShare, creatorId])
      const bal = balRows[0]?.wallet_balance_ngn || creatorShare
      await client.query(`INSERT INTO creator_wallet_transactions (creator_id, type, amount_ngn, balance_after_ngn, metadata) VALUES ($1,'course',$2,$3,$4)`, [creatorId, creatorShare, bal, JSON.stringify({ reference, courseId, gross, platformFee, webhook:true})])
    }
    await client.query('COMMIT')
    console.log(`[webhook] Course ${reference} fulfilled`)
  } catch(e){ try{await client.query('ROLLBACK')}catch{}; throw e} finally{client.release()}
}

async function handleWebhookEventTicket(reference, amount, eventData, tx) {
  const { purchaseEventTicket } = await import('../db.js')
  const eventId = tx.metadata?.eventId
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(`UPDATE transactions SET status='success', amount=$2 WHERE reference=$1 AND status='pending' RETURNING id`, [reference, amount])
    if (rows.length===0){ await client.query('ROLLBACK'); return}
    const { rows: evRows } = await client.query(`SELECT creator_id, ticket_price FROM live_events WHERE id=$1`, [eventId])
    const creatorId = evRows[0]?.creator_id || tx.creator_id
    await purchaseEventTicket({ id: uuidv4(), eventId, userId: tx.user_id, transactionId: tx.id, status:'active' })
    const gross = parseFloat(tx.amount) || parseFloat(evRows[0]?.ticket_price) || amount
    const platformFee = Math.round(gross*0.20*100)/100
    const creatorShare = Math.round((gross-platformFee)*100)/100
    if (creatorId && creatorShare>0){
      const { rows: balRows } = await client.query(`UPDATE creator_profiles SET wallet_balance_ngn = wallet_balance_ngn + $1 WHERE user_id=$2 RETURNING wallet_balance_ngn`, [creatorShare, creatorId])
      const bal = balRows[0]?.wallet_balance_ngn || creatorShare
      await client.query(`INSERT INTO creator_wallet_transactions (creator_id, type, amount_ngn, balance_after_ngn, metadata) VALUES ($1,'event_ticket',$2,$3,$4)`, [creatorId, creatorShare, bal, JSON.stringify({ reference, eventId, gross, platformFee, webhook:true})])
    }
    await client.query('COMMIT')
    console.log(`[webhook] Event ticket ${reference} fulfilled`)
  } catch(e){ try{await client.query('ROLLBACK')}catch{}; throw e} finally{client.release()}
}

async function handleSuccessfulPayment(reference, amount, eventData) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Atomic claim: only process if transaction is still pending
    const { rows } = await client.query(
      `UPDATE transactions 
       SET status = 'success', amount = $2, metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('gateway_event', $3::jsonb)
       WHERE reference = $1 AND status = 'pending'
       RETURNING id, user_id, plan`,
      [reference, amount, JSON.stringify(eventData)]
    )

    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return // Already processed
    }

    const { id: txId, user_id, plan: planSlug } = rows[0]
    const plan = planSlug || 'basic'

    // Deterministic subscription id from transaction id
    const subId = txId

    // Upsert subscription (1:1 with transaction)
    await client.query(
      `INSERT INTO subscriptions (id, user_id, plan, active, started_at, expires_at)
       VALUES ($1, $2, $3, true, NOW(), NOW() + INTERVAL '30 days')
       ON CONFLICT (id) DO UPDATE SET
         plan = EXCLUDED.plan,
         active = true,
         started_at = NOW(),
         expires_at = NOW() + INTERVAL '30 days'`,
      [subId, user_id, plan]
    )

    await client.query(`UPDATE users SET plan = $2 WHERE id = $1`, [user_id, plan])

    // Credit referral commission inside same transaction
    const refRows = await client.query(
      `UPDATE affiliate_referrals
       SET commission = ROUND((SELECT price FROM plans WHERE slug = $2)::numeric * 0.10, 2),
           status = 'paid',
           plan = $2
       WHERE id = (
         SELECT id FROM affiliate_referrals
         WHERE referred_id = $1 AND status = 'converted'
         FOR UPDATE
         LIMIT 1
       )
       AND status = 'converted'
       RETURNING id, referrer_id, commission`,
      [user_id, plan]
    )

    if (refRows.rows.length > 0) {
      const { referrer_id, commission } = refRows.rows[0]
      await client.query(`UPDATE users SET coins = COALESCE(coins,0) + $1 WHERE id = $2`, [Math.round(commission), referrer_id])
      // Notify referrer (non-blocking)
      try {
        const { notifyUser } = await import('../services/realtime.js')
        notifyUser(referrer_id, { type: 'referral_paid', commission, referredId: user_id, plan })
      } catch {}
    }

    await client.query('COMMIT')
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[webhook] Fulfillment error:', e.message)
    throw e
  } finally {
    client.release()
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

export async function webhookInfo(req, res) {
  const baseUrl = process.env.APP_URL || `https://${req.get('host')}` || 'http://localhost:3030'
  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/payment/webhook`
  // Alternative path for backward compat (some dashboards use /webhooks/*)
  const altUrl = `${baseUrl.replace(/\/$/, '')}/webhooks/paystack`
  res.json({
    success: true,
    webhook: {
      url: webhookUrl,
      alternativeUrls: [altUrl, `${baseUrl.replace(/\/$/, '')}/api/webhooks/paystack`, `${baseUrl.replace(/\/$/, '')}/api/webhooks/flutterwave`],
      method: 'POST',
      events: {
        paystack: ['charge.success', 'charge.failed', 'transfer.success', 'transfer.failed'],
        flutterwave: ['charge.completed']
      },
      configured: {
        paystack: isConfigured('paystack'),
        flutterwave: isConfigured('flutterwave'),
        paystackSecretSet: !!process.env.PAYSTACK_SECRET_KEY,
        flutterwaveSecretSet: !!(process.env.FLW_SECRET_HASH || process.env.FLW_SECRET_KEY),
      },
      headers: {
        paystack: 'x-paystack-signature (HMAC SHA512 of raw body with PAYSTACK_SECRET_KEY)',
        flutterwave: 'verif-hash or x-flw-verif-hash (HMAC SHA256 of raw body with FLW_SECRET_HASH/FLW_SECRET_KEY)'
      },
      test: {
        curlPaystack: `curl -X POST ${webhookUrl} -H "Content-Type: application/json" -H "x-paystack-signature: <signature>" -d '{"event":"charge.success","data":{"reference":"TEST-123","amount":150000}}'`,
        curlFlutterwave: `curl -X POST ${webhookUrl} -H "Content-Type: application/json" -H "verif-hash: <hash>" -d '{"event":"charge.completed","data":{"tx_ref":"TEST-123","amount":1500,"status":"successful"}}'`
      },
      notes: [
        'Webhook must be publicly accessible (use ngrok for localhost)',
        'Raw body is used for signature verification (express.json verify captures req.rawBody)',
        'Always returns 200 unless signature invalid (400), to prevent gateway retry storm',
        'Handles all transaction types: subscription, tip, gift, membership, product, course, event_ticket'
      ]
    }
  })
}
