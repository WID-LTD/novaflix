const topicRooms = new Map()

export function joinTopicRoom(topicId, ws) {
  if (!topicRooms.has(topicId)) topicRooms.set(topicId, new Set())
  topicRooms.get(topicId).add(ws)
  ws.topicRoomId = topicId
}

export function leaveTopicRoom(topicId, ws) {
  if (!topicId || !topicRooms.has(topicId)) return
  topicRooms.get(topicId).delete(ws)
  if (topicRooms.get(topicId).size === 0) topicRooms.delete(topicId)
  if (ws.topicRoomId === topicId) ws.topicRoomId = null
}

export function leaveAllTopicRooms(ws) {
  if (ws.topicRoomId) leaveTopicRoom(ws.topicRoomId, ws)
}

export function broadcastTopicReply(topicId, reply) {
  const set = topicRooms.get(topicId)
  if (!set) return
  for (const client of set) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'topic-reply', topicId, reply }))
    }
  }
}
