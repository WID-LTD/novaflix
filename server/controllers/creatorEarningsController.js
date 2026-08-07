import { getCreatorEarnings, getCreatorEarningsSummary, settleDualPool, getCreatorMerchRevenue } from '../db.js'

export async function getMyEarnings(req, res) {
  try {
    const [rows, summary, merch] = await Promise.all([
      getCreatorEarnings(req.userId),
      getCreatorEarningsSummary(req.userId),
      getCreatorMerchRevenue(req.userId),
    ])
    res.json({ success: true, summary, items: rows, merch })
  } catch (err) {
    console.error('getMyEarnings error:', err)
    res.status(500).json({ success: false, error: 'Failed to load earnings' })
  }
}

export async function adminSettle(req, res) {
  try {
    const period = (req.query.period || '').match(/^\d{4}-\d{2}$/) ? req.query.period : new Date().toISOString().slice(0, 7)
    const result = await settleDualPool(period)
    res.json({ success: true, period, ...result })
  } catch (err) {
    console.error('adminSettle error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}