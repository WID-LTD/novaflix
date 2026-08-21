const userSockets = new Map()
const userPresence = new Map() // contentId -> Map<userId, { ws, name, avatar, currentTime, playing }>
const userRooms = new Map() // userId -> Set<roomId>

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
  
  // Clean up presence
  for (const [contentId, presence] of userPresence.entries()) {
    presence.delete(userId)
    if (presence.size === 0) userPresence.delete(contentId)
  }
  
  // Clean up rooms
  const rooms = userRooms.get(userId)
  if (rooms) {
    rooms.clear()
    userRooms.delete(userId)
  }
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

// Room-based messaging for watch parties, live streams, etc.
export function joinRoom(userId, roomId, ws) {
  if (!userRooms.has(userId)) userRooms.set(userId, new Set())
  userRooms.get(userId).add(roomId)
  
  if (!userPresence.has(roomId)) userPresence.set(roomId, new Map())
}

export function leaveRoom(userId, roomId) {
  const rooms = userRooms.get(userId)
  if (rooms) rooms.delete(roomId)
  
  const presence = userPresence.get(roomId)
  if (presence) {
    presence.delete(userId)
    if (presence.size === 0) userPresence.delete(roomId)
  }
}

export function broadcastToRoom(roomId, data, excludeUserId = null) {
  for (const [userId, rooms] of userRooms.entries()) {
    if (rooms.has(roomId)) {
      const userSocketsSet = userSockets.get(userId)
      if (userSocketsSet) {
        for (const ws of userSocketsSet) {
          if (ws.readyState === 1 && userId !== excludeUserId) {
            try { ws.send(JSON.stringify(data)) } catch {}
          }
        }
      }
    }
  }
}

export function sendToRoom(roomId, data, excludeUserId = null) {
  broadcastToRoom(roomId, data, excludeUserId)
}

// Presence system for watch parties, live streams, etc.
export function updatePresence(userId, roomId, data) {
  if (!userPresence.has(roomId)) userPresence.set(roomId, new Map())
  const presence = userPresence.get(roomId)
  presence.set(userId, { ...presence.get(userId), ...data, lastUpdate: Date.now() })
  
  // Broadcast presence update to room
  broadcastToRoom(roomId, { type: 'presence:update', userId, data }, userId)
}

export function getRoomPresence(roomId) {
  const presence = userPresence.get(roomId)
  if (!presence) return []
  return Array.from(presence.entries()).map(([userId, data]) => ({ userId, ...data }))
}

// Typing indicators for comments/chat
export function setTyping(userId, roomId, isTyping) {
  broadcastToRoom(roomId, { type: 'typing', userId, isTyping }, userId)
}

// Connection health check
export function getConnectionStats() {
  let totalConnections = 0
  let activeUsers = 0
  let totalRooms = userRooms.size
  
  for (const [userId, sockets] of userSockets.entries()) {
    activeUsers++
    for (const ws of sockets) {
      if (ws.readyState === 1) totalConnections++
    }
  }
  
  return {
    totalConnections,
    activeUsers,
    totalRooms,
    timestamp: Date.now()
  }
}

// Message acknowledgment tracking
const messageAcks = new Map() // messageId -> { resolve, reject, timeout }

export function trackMessage(messageId, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      messageAcks.delete(messageId)
      reject(new Error('Message acknowledgment timeout'))
    }, timeout)
    
    messageAcks.set(messageId, { resolve, reject, timeoutId })
  })
}

export function acknowledgeMessage(messageId, success = true, data = null) {
  const ack = messageAcks.get(messageId)
  if (ack) {
    clearTimeout(ack.timeoutId)
    messageAcks.delete(messageId)
    if (success) {
      resolve(data)
    } else {
      reject(new Error('Message failed'))
    }
  }
}

// Health check for WebSocket connections
export function healthCheck() {
  let healthy = 0
  let unhealthy = 0
  
  for (const sockets of userSockets.values()) {
    for (const ws of sockets) {
      if (ws.readyState === 1) healthy++
      else unhealthy++
    }
  }
  
  return { healthy, unhealthy, total: healthy + unhealthy }
}