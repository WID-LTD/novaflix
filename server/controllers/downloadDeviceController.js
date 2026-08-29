import { PLAN_FEATURES } from './planUtils.js'
import { ensureDownloadDevice, getDownloadDevices, removeDownloadDevice } from '../db.js'
import crypto from 'crypto'

// Stable pseudo-device id from User-Agent for clients that don't send one
export function uaDeviceId(req) {
  return crypto.createHash('sha256')
    .update(req.headers['user-agent'] || 'unknown-device')
    .digest('hex')
    .slice(0, 32)
}

function planInfo(req) {
  const plan = req.user?.plan || 'free'
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free
  return { plan, maxDevices: features.downloads ?? 0 }
}

export async function register(req, res) {
  try {
    const userId = req.userId
    const { plan, maxDevices } = planInfo(req)
    const deviceId = req.body.device_id || uaDeviceId(req)
    const deviceName = (req.body.device_name || req.headers['user-agent'] || 'Unknown Device').slice(0, 200)
    const platform = req.body.platform || 'web'

    const result = await ensureDownloadDevice(userId, deviceId, deviceName, platform, maxDevices)
    if (!result.ok) {
      const devices = await getDownloadDevices(userId)
      return res.status(409).json({
        success: false,
        code: 'download_limit_reached',
        error: `Your ${plan} plan allows ${result.limit} download device${result.limit === 1 ? '' : 's'}. Remove a device to add this one.`,
        limit: result.limit,
        devices,
      })
    }
    res.json({ success: true, registered: true })
  } catch (err) {
    console.error('[download-devices] register error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function list(req, res) {
  try {
    const { plan, maxDevices } = planInfo(req)
    const devices = await getDownloadDevices(req.userId)
    res.json({ success: true, devices, limit: maxDevices, plan })
  } catch (err) {
    console.error('[download-devices] list error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function remove(req, res) {
  try {
    const deviceId = req.params.deviceId
    const removed = await removeDownloadDevice(req.userId, deviceId)
    if (!removed) return res.status(404).json({ success: false, error: 'Device not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('[download-devices] remove error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
}
