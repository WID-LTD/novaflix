import { createAppeal, getAppeals, getAppealsByUser, resolveAppeal, findUserById, updateUser } from '../db.js'

export async function submitAppeal(req, res) {
  try {
    const { message, appealType } = req.body
    if (!message || !message.trim()) return res.status(400).json({ error: 'Appeal message required' })
    if (message.length > 2000) return res.status(400).json({ error: 'Appeal must be 2000 characters or fewer' })

    const user = await findUserById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const existing = await getAppealsByUser(user.id)
    if (existing.some((a) => a.status === 'pending')) {
      return res.status(400).json({ error: 'You already have a pending appeal' })
    }

    const appeal = await createAppeal({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      appealType: appealType === 'ban' ? 'ban' : 'suspension',
      message: message.trim(),
      accountReason: user.suspension_reason || user.banned_reason || '',
      accountUntil: user.suspended_until || null,
    })
    res.json({ success: true, appeal })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function myAppeals(req, res) {
  try {
    const appeals = await getAppealsByUser(req.userId)
    res.json({ success: true, appeals })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function listAppeals(req, res) {
  try {
    const { status } = req.query
    const appeals = await getAppeals(status)
    res.json({ success: true, appeals })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function decideAppeal(req, res) {
  try {
    const { id } = req.params
    const { status, resolutionNote } = req.body
    if (!['approved', 'denied'].includes(status)) return res.status(400).json({ error: 'Status must be approved or denied' })

    const appeal = await resolveAppeal(id, { status, resolutionNote, reviewedBy: req.userId })
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' })

    if (status === 'approved') {
      const user = await findUserById(appeal.user_id)
      if (user) {
        if (appeal.appeal_type === 'ban' && user.role === 'banned') {
          await updateUser(user.id, { role: 'user', banned_reason: null, banned_at: null })
        } else {
          await updateUser(user.id, { suspended_until: null, suspension_reason: null })
        }
      }
    }

    res.json({ success: true, appeal })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
