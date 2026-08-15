const BLOCKED = new Map()
const COOLDOWN_BASE_MS = 120_000
const COOLDOWN_MAX_MS = 10 * 60_000
const FAIL_LIMIT = 2

export function hostOf(url) {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function cooldownFor(failCount) {
  const ms = COOLDOWN_BASE_MS * 2 ** Math.max(0, failCount - FAIL_LIMIT)
  return Math.min(ms, COOLDOWN_MAX_MS)
}

export function isBlocked(url) {
  const host = hostOf(url)
  if (!host) return false
  const entry = BLOCKED.get(host)
  if (!entry) return false
  if (Date.now() < entry.nextAllowedAt) return true
  BLOCKED.delete(host)
  return false
}

export function reportFailure(url, reason = '') {
  const host = hostOf(url)
  if (!host) return
  const entry = BLOCKED.get(host) || { failCount: 0, nextAllowedAt: 0 }
  entry.failCount += 1
  entry.nextAllowedAt = Date.now() + cooldownFor(entry.failCount)
  entry.reason = reason
  BLOCKED.set(host, entry)
  console.log(`[health] ${host} blocked for ${Math.round(cooldownFor(entry.failCount) / 1000)}s (fail#${entry.failCount}${reason ? `: ${reason}` : ''})`)
}

export function reportSuccess(url) {
  const host = hostOf(url)
  if (!host) return
  if (BLOCKED.delete(host)) {
    console.log(`[health] ${host} recovered`)
  }
}

export function blockedSnapshot() {
  const out = []
  for (const [host, entry] of BLOCKED) {
    const remaining = Math.max(0, Math.round((entry.nextAllowedAt - Date.now()) / 1000))
    if (remaining > 0) out.push(`${host}(${remaining}s)`)
  }
  return out
}
