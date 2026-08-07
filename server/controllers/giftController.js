import { v4 as uuidv4 } from 'uuid'
import { addGlowGift, createTransaction, getTransactionByReference, getGlowGiftsForCreator, getGlowGiftsTotals, findUserById, createNotification } from '../db.js'
import { notifyUser } from '../services/realtime.js'
import Paystack from 'paystack-api'

const paystack = process.env.PAYSTACK_SECRET_KEY
  ? new Paystack(process.env.PAYSTACK_SECRET_KEY)
  : null

const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000'
const GIFT_FEE = 0.20

export async function initializeGift(req, res) {
  try {
    const { creatorId, amount, note } = req.body
    if (!creatorId || !amount) return res.status(400).json({ error: 'Creator and amount required' })
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const user = req.user
    const reference = `GLOW-${uuidv4().split('-')[0]}-${Date.now()}`

    const response = await paystack.transaction.initialize({
      email: user.email,
      amount: amount * 100,
      reference,
      callback_url: `${CALLBACK_URL}/gift/success?reference=${reference}`,
      metadata: { userId: req.userId, creatorId, note },
    })

    await createTransaction({
      userId: req.userId,
      reference,
      type: 'gift',
      creatorId,
      amount,
      status: 'pending',
      metadata: { note },
    })

    res.json({ success: true, authorization_url: response.data.authorization_url, reference })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function verifyGift(req, res) {
  try {
    const { reference } = req.query
    if (!reference) return res.status(400).json({ error: 'Reference required' })
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const response = await paystack.transaction.verify({ reference })
    const txData = response.data

    if (txData.status === 'success') {
      const tx = await getTransactionByReference(reference)
      if (tx && tx.status === 'pending' && tx.type === 'gift') {
        const gross = txData.amount / 100
        const fee = +(gross * GIFT_FEE).toFixed(2)
        const net = +(gross - fee).toFixed(2)
        const gift = {
          id: uuidv4(),
          senderId: tx.user_id,
          creatorId: tx.creator_id,
          amount: gross,
          fee,
          netAmount: net,
          note: tx.metadata?.note || '',
        }
        await addGlowGift(gift)
        await createTransaction({
          userId: tx.user_id,
          reference,
          type: 'gift',
          creatorId: tx.creator_id,
          amount: gross,
          status: 'success',
          metadata: { paystackId: txData.id, fee, netAmount: net, note: gift.note },
        })
        if (tx.creator_id && tx.creator_id !== tx.user_id) {
          const [sender] = await Promise.all([findUserById(tx.user_id).catch(() => null)])
          const notification = await createNotification({
            userId: tx.creator_id,
            type: 'gift',
            title: `${sender?.name || 'A fan'} sent you a Glow Gift`,
            body: gift.note ? `"${gift.note}"` : `$${net.toFixed(2)} (after 20% fee) just landed in your account.`,
            link: '/creator/dashboard',
            actorId: tx.user_id,
          }).catch(() => null)
          if (notification) notifyUser(tx.creator_id, { type: 'notification', notification })
        }
        res.json({ success: true, gift: { ...gift, fee, netAmount: net } })
      } else {
        res.json({ success: false, error: 'Transaction not found or already processed' })
      }
    } else {
      res.json({ success: false, error: 'Payment not completed' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getMyGifts(req, res) {
  try {
    const [items, totals] = await Promise.all([
      getGlowGiftsForCreator(req.userId),
      getGlowGiftsTotals(req.userId),
    ])
    res.json({ success: true, items, totals })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}