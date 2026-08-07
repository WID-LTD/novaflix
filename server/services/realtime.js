const userSockets = new Map()

export function registerSocket(userId, ws) {
  if (!userId || !ws) return
  if (!userSockets.has(userId)) userSockets.set(userId, new Set())
  userSockets.get(userId).add(ws)
}

export function deregisterSocket(userId, ws) {
  if (!userId) return
  const set = userSockets.get(userId)
  if (!set) return
  set.delete(ws)
  if (set.size === 0) userSockets.delete(userId)
}

export function notifyUser(userId, data) {
  if (!userId) return false
  const set = userSockets.get(userId)
  if (!set || set.size === 0) return false
  let sent = 0
  for (const ws of set) {
    if (ws.readyState === 1) {
      try { ws.send(JSON.stringify(data)); sent++ } catch {}
    }
  }
  return sent > 0
}

export function socketCount() {
  let n = 0
  for (const set of userSockets.values()) n += set.size
  return n
}

export function broadcastFeed(data) {
  for (const set of userSockets.values()) {
    for (const ws of set) {
      if (ws.readyState === 1) {
        try { ws.send(JSON.stringify(data)) } catch {}
      }
    }
  }
}