import { getFeedSettingsValue, setFeedSettings } from '../db.js'

const COUNTER_KEY = 'stats.connections'

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function safeCounter(v) {
  const c = v && typeof v === 'object' ? v : {}
  return { total: Number(c.total) || 0, day: c.day || '', today: Number(c.today) || 0 }
}

export async function recordVisit(req, res) {
  try {
    const current = safeCounter(await getFeedSettingsValue(COUNTER_KEY, {}))
    const today = dayKey()
    const next = safeCounter(current)
    if (next.day !== today) {
      next.day = today
      next.today = 0
    }
    next.total += 1
    next.today += 1
    await setFeedSettings(COUNTER_KEY, next)

    const ua = (req.headers['user-agent'] || '').slice(0, 120)
    const ref = (req.headers['referer'] || req.headers['referrer'] || '').slice(0, 120)
    console.log(`[track] connection #${next.total} today ${next.today} ip=${req.ip || req.connection?.remoteAddress || 'unknown'} ua=${ua} ref=${ref}`)

    res.json({ success: true, total: next.total, today: next.today })
  } catch (err) {
    console.error('[track] visit counter failed:', err?.message || err)
    res.status(500).json({ success: false, error: 'Could not record visit' })
  }
}

export async function getVisitStats(req, res) {
  const current = safeCounter(await getFeedSettingsValue(COUNTER_KEY, {}))
  res.json({ success: true, total: current.total, today: current.today, day: current.day })
}