import { 
  getNotifications, 
  getUnreadCount, 
  markNotificationRead, 
  markAllNotificationsRead,
  createAndSendNotification,
  notifyLiveStreamStarted,
  notifyNewContent,
  notifyNewEpisode,
  notifyPaymentReceived,
  notifyWithdrawalCompleted,
  notifyNewFollower,
  notifyCommentReply,
  notifyMention,
  notifyMilestoneReached
} from '../services/notificationService.js'

export async function list(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 30
    const offset = parseInt(req.query.offset, 10) || 0
    const items = await getNotifications(req.userId, limit, offset)
    res.json({ success: true, notifications: items, total: items.length, offset, limit })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function unreadCount(req, res) {
  try {
    const count = await getUnreadCount(req.userId)
    res.json({ success: true, count })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function markRead(req, res) {
  try {
    const item = await markNotificationRead(req.params.id, req.userId)
    if (!item) return res.status(404).json({ success: false, error: 'Notification not found' })
    res.json({ success: true, notification: item })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function markAllRead(req, res) {
  try {
    const updated = await markAllNotificationsRead(req.userId)
    res.json({ success: true, updated })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// Admin/Internal endpoints for triggering notifications
export async function sendLiveStreamNotification(req, res) {
  try {
    const { creatorId } = req.body
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' })
    await notifyLiveStreamStarted(creatorId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendNewContentNotification(req, res) {
  try {
    const { creatorId, contentId, contentType, title } = req.body
    if (!creatorId || !contentId || !contentType || !title) {
      return res.status(400).json({ error: 'creatorId, contentId, contentType, title required' })
    }
    await notifyNewContent(creatorId, contentId, contentType, title)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendNewEpisodeNotification(req, res) {
  try {
    const { showId, episodeNumber, title } = req.body
    if (!showId || !episodeNumber || !title) {
      return res.status(400).json({ error: 'showId, episodeNumber, title required' })
    }
    await notifyNewEpisode(showId, episodeNumber, title)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendPaymentNotification(req, res) {
  try {
    const { userId, amount, type, contentTitle } = req.body
    if (!userId || !amount || !type || !contentTitle) {
      return res.status(400).json({ error: 'userId, amount, type, contentTitle required' })
    }
    await notifyPaymentReceived(userId, amount, type, contentTitle)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendWithdrawalNotification(req, res) {
  try {
    const { userId, amount, status } = req.body
    if (!userId || !amount || !status) {
      return res.status(400).json({ error: 'userId, amount, status required' })
    }
    await notifyWithdrawalCompleted(userId, amount, status)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendMilestoneNotification(req, res) {
  try {
    const { userId, milestone, value } = req.body
    if (!userId || !milestone || value === undefined) {
      return res.status(400).json({ error: 'userId, milestone, value required' })
    }
    await notifyMilestoneReached(userId, milestone, value)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendFollowNotification(req, res) {
  try {
    const { userId, followerId } = req.body
    if (!userId || !followerId) {
      return res.status(400).json({ error: 'userId, followerId required' })
    }
    await notifyNewFollower(userId, followerId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendCommentReplyNotification(req, res) {
  try {
    const { userId, commentId, postId } = req.body
    if (!userId || !commentId || !postId) {
      return res.status(400).json({ error: 'userId, commentId, postId required' })
    }
    await notifyCommentReply(userId, commentId, postId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendMentionNotification(req, res) {
  try {
    const { userId, contentId, contentType } = req.body
    if (!userId || !contentId || !contentType) {
      return res.status(400).json({ error: 'userId, contentId, contentType required' })
    }
    await notifyMention(userId, contentId, contentType)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}