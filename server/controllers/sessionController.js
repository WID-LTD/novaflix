import { createActiveSession, getActiveSessionCount, heartbeatSession, endSession, cleanupStaleSessions } from '../db.js'
import { PLAN_FEATURES } from './planUtils.js'

export async function startSession(req, res) {
  try {
    const userId = req.userId
    const deviceId = req.body.device_id || req.headers['user-agent'] || 'unknown'
    const ipAddress = req.ip || req.connection?.remoteAddress

    const plan = req.user?.plan || 'free'
    const maxScreens = PLAN_FEATURES[plan]?.concurrentScreens || 1
    const current = await getActiveSessionCount(userId)

    if (current >= maxScreens) {
      return res.status(429).json({
        success: false,
        error: `Your ${plan} plan allows ${maxScreens} concurrent screen${maxScreens > 1 ? 's' : ''}. You've reached this limit.`,
        maxScreens,
        current,
      })
    }

    const session = await createActiveSession(userId, deviceId, ipAddress)
    res.json({ success: true, session })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function heartbeat(req, res) {
  try {
    const userId = req.userId
    const deviceId = req.body.device_id || req.headers['user-agent'] || 'unknown'
    const session = await heartbeatSession(userId, deviceId)
    res.json({ success: true, session })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function endSessionHandler(req, res) {
  try {
    const userId = req.userId
    const deviceId = req.body.device_id || req.headers['user-agent'] || 'unknown'
    await endSession(userId, deviceId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function cleanup(req, res) {
  try {
    const count = await cleanupStaleSessions()
    res.json({ success: true, removed: count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
