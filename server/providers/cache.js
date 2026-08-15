// Stream sources rotate and carry time-limited CDN tokens, so a short TTL
// keeps served URLs fresh (a 60-min cache served dead/stale tokens).
const DEFAULT_TTL = 10 * 60 * 1000
const MAX_ENTRIES = 500

const store = new Map()

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > DEFAULT_TTL) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function cacheSet(key, value) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = [...store.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
    if (oldest) store.delete(oldest[0])
  }
  store.set(key, { value, ts: Date.now() })
}

export function cacheClear() { store.clear() }

export function cacheStats() {
  const now = Date.now()
  let valid = 0, expired = 0
  for (const e of store.values()) {
    if (now - e.ts <= DEFAULT_TTL) valid++
    else expired++
  }
  return { size: store.size, valid, expired }
}
