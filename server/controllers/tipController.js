import { v4 as uuidv4 } from 'uuid'
import { addTip, createTransaction, getTransactionByReference } from '../db.js'
import Paystack from 'paystack-api'

const paystack = process.env.PAYSTACK_SECRET_KEY
  ? new Paystack(process.env.PAYSTACK_SECRET_KEY)
  : null

const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000'

export async function initializeTip(req, res) {
  try {
    const { creatorId, amount, message } = req.body
    if (!creatorId || !amount) return res.status(400).json({ error: 'Creator and amount required' })
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const user = req.user
    const reference = `TIP-${uuidv4().split('-')[0]}-${Date.now()}`

    const response = await paystack.transaction.initialize({
      email: user.email,
      amount: amount * 100,
      reference,
      callback_url: `${CALLBACK_URL}/tips/success?reference=${reference}`,
      metadata: { userId: req.userId, creatorId, message },
    })

    await createTransaction({
      userId: req.userId,
      reference,
      type: 'tip',
      creatorId,
      amount,
      status: 'pending',
      metadata: { message },
    })

    res.json({ success: true, authorization_url: response.data.authorization_url, reference })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function verifyTip(req, res) {
  try {
    const { reference } = req.query
    if (!reference) return res.status(400).json({ error: 'Reference required' })
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const response = await paystack.transaction.verify({ reference })
    const txData = response.data

    if (txData.status === 'success') {
      const tx = await getTransactionByReference(reference)
      if (tx && tx.status === 'pending' && tx.type === 'tip') {
        const tip = {
          id: uuidv4(),
          userId: tx.user_id,
          creatorId: tx.creator_id,
          amount: txData.amount / 100,
          message: tx.message || '',
        }
        await addTip(tip)
        await createTransaction({
          userId: tx.user_id,
          reference,
          type: 'tip',
          creatorId: tx.creator_id,
          amount: txData.amount / 100,
          status: 'success',
          metadata: { paystackId: txData.id, message: tx.message },
        })
        res.json({ success: true, tip })
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
