import { getRateLimitAttempts, recordRateLimitAttempt } from '../db.js'

/**
 * rateLimit — DB-backed distributed rate limiting (shared via rate_limit_log).
 * Counts are consistent across API instances because they read a shared Postgres table.
 * Fails open if the DB is unreachable so shorts interaction still works during blips.
 *
 * usage: router.post('/:id/like', authMiddleware, rateLimit({ action: 'shorts-like', max: 60 }), likeShort)
 */
export function rateLimit({ action, max, windowMs = 60000, key = (req) => req.userId || req.ip || 'anon' }) {
  return async function rateLimitMiddleware(req, res, next) {
    try {
      const identifier = key(req)
      const attempts = await getRateLimitAttempts(identifier, action, windowMs)
      if (attempts >= max) {
        const retryAfter = Math.ceil(windowMs / 1000)
        res.set('Retry-After', String(retryAfter))
        return res.status(429).json({ error: 'Too many requests', retryAfter })
      }
      await recordRateLimitAttempt(identifier, action)
      next()
    } catch (err) {
      console.warn('[rateLimit] DB unavailable, failing open:', err.message)
      next()
    }
  }
}