import { findUserById, getUserTransactions, createTransaction } from '../db.js'
import Paystack from 'paystack-api'
import { v4 as uuidv4 } from 'uuid'

const paystack = process.env.PAYSTACK_SECRET_KEY
  ? new Paystack(process.env.PAYSTACK_SECRET_KEY)
  : null

export async function createRecipient(req, res) {
  try {
    const { bankCode, accountNumber, accountName } = req.body
    if (!bankCode || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'bankCode, accountNumber, and accountName required' })
    }
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const response = await paystack.transferrecipient.create({
      type: 'nuban',
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    })

    const { data } = response
    const { db } = await import('../db.js')
    await db.pool.query(
      `UPDATE creator_profiles SET paystack_recipient_code = $1 WHERE user_id = $2`,
      [data.recipient_code, req.userId]
    )

    res.json({ success: true, recipient_code: data.recipient_code })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function requestWithdraw(req, res) {
  try {
    const { amount } = req.body
    if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount' })
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })

    const { rows } = await (await import('../db.js')).pool.query(
      'SELECT paystack_recipient_code FROM creator_profiles WHERE user_id = $1',
      [req.userId]
    )

    const recipientCode = rows[0]?.paystack_recipient_code
    if (!recipientCode) return res.status(400).json({ error: 'No bank account linked. Set up payout recipient first.' })

    const reference = `PAY-${uuidv4().split('-')[0]}-${Date.now()}`
    const response = await paystack.transfer.initiate({
      source: 'balance',
      amount: amount * 100,
      reference,
      recipient: recipientCode,
      reason: 'NovaFlix creator payout',
    })

    await createTransaction({
      userId: req.userId,
      reference,
      type: 'payout',
      amount: amount,
      status: 'pending',
      metadata: { transferCode: response.data.transfer_code, transferId: response.data.id },
    })

    res.json({ success: true, transfer: response.data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getPayoutHistory(req, res) {
  try {
    const txs = await getUserTransactions(req.userId)
    const payouts = txs.filter(t => t.type === 'payout')
    res.json({ success: true, payouts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getBalance(req, res) {
  try {
    if (!paystack) return res.status(500).json({ error: 'Paystack not configured' })
    const response = await paystack.balance.fetch()
    res.json({ success: true, balance: response.data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
