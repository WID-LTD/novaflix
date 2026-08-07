import {
  getDigitalKeysByContent,
  getCollectedKeyIds,
  collectKey,
  getUserCollectedKeys,
  createDigitalKey,
  createSecretRoom,
  getUploadById,
  getCosmeticById,
  getDefaultEggBadge,
  getSecretRoom,
  hasSecretRoomAccess
} from '../db.js'

export async function getPlacements(req, res) {
  try {
    const contentId = req.query.contentId
    if (!contentId) {
      return res.status(400).json({ success: false, error: 'contentId required' })
    }
    const placements = await getDigitalKeysByContent(contentId)
    const collected = await getCollectedKeyIds(req.userId, contentId)
    res.json({
      success: true,
      placements: placements.map(p => ({
        id: p.id,
        ts_seconds: Number(p.ts_seconds),
        pos_x: Number(p.pos_x),
        pos_y: Number(p.pos_y),
        radius: Number(p.radius),
        hint: p.hint,
        reward_type: p.reward_type
      })),
      collected
    })
  } catch (err) {
    console.error('getPlacements error:', err)
    res.status(500).json({ success: false, error: 'Failed to load egg placements' })
  }
}

export async function collectPlacement(req, res) {
  try {
    const { keyId } = req.body
    if (!keyId) {
      return res.status(400).json({ success: false, error: 'keyId required' })
    }
    const result = await collectKey(req.userId, keyId)
    if (result.error) {
      return res.status(404).json({ success: false, error: result.error })
    }
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('collectPlacement error:', err)
    res.status(500).json({ success: false, error: 'Failed to collect key' })
  }
}

export async function getMine(req, res) {
  try {
    const keys = await getUserCollectedKeys(req.userId)
    res.json({
      success: true,
      keys: keys.map(k => ({
        keyId: k.key_id,
        contentId: k.content_id,
        ts_seconds: Number(k.ts_seconds),
        hint: k.hint,
        rewardType: k.reward_type,
        collectedAt: k.collected_at,
        badge: k.reward_type === 'badge' ? { name: k.badge_name, icon: k.badge_icon } : null,
        room: k.room_id ? { id: k.room_id, name: k.room_name } : null
      }))
    })
  } catch (err) {
    console.error('getMine error:', err)
    res.status(500).json({ success: false, error: 'Failed to load collected keys' })
  }
}

export async function getRoom(req, res) {
  try {
    const room = await getSecretRoom(req.params.id)
    if (!room) {
      return res.status(404).json({ success: false, error: 'room_not_found' })
    }
    const allowed = await hasSecretRoomAccess(req.userId, room.id)
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Collect the matching key to enter this room' })
    }
    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        contentId: room.content_id,
        ts_seconds: Number(room.ts_seconds),
        createdAt: room.created_at
      }
    })
  } catch (err) {
    console.error('getRoom error:', err)
    res.status(500).json({ success: false, error: 'Failed to load room' })
  }
}

export async function createEgg(req, res) {
  try {
    const { contentId, ts, x, y, radius, hint, rewardType, rewardName, rewardDescription, badgeId } = req.body
    if (!contentId || ts === undefined) {
      return res.status(400).json({ success: false, error: 'contentId and ts required' })
    }
    const upload = await getUploadById(contentId)
    if (!upload || upload.user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'You can only add keys to your own uploads' })
    }
    const rewardTypeVal = rewardType === 'secret_room' ? 'secret_room' : 'badge'
    let rewardRef = null

    if (rewardTypeVal === 'badge') {
      let cosmetic
      if (badgeId) {
        cosmetic = await getCosmeticById(badgeId)
      } else {
        cosmetic = await getDefaultEggBadge()
      }
      if (!cosmetic || cosmetic.kind !== 'badge') {
        return res.status(400).json({ success: false, error: 'Invalid badge' })
      }
      rewardRef = cosmetic.id
    }

    const code = `c-${contentId.slice(0, 8)}-${Date.now()}`
    const key = await createDigitalKey({
      contentId,
      creatorId: req.userId,
      code,
      ts: Number(ts),
      x: x !== undefined ? Number(x) : 0.5,
      y: y !== undefined ? Number(y) : 0.5,
      radius: radius !== undefined ? Number(radius) : 0.08,
      hint: hint || '',
      rewardType: rewardTypeVal,
      rewardRef
    })

    let room = null
    if (rewardTypeVal === 'secret_room') {
      room = await createSecretRoom({
        keyId: key.id,
        name: rewardName || 'Secret Room',
        description: rewardDescription || ''
      })
    }

    res.status(201).json({ success: true, key, room })
  } catch (err) {
    console.error('createEgg error:', err)
    res.status(500).json({ success: false, error: 'Failed to create key' })
  }
}
