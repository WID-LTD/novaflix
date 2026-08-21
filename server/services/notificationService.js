import pool from '../config/database.js'
import { notifyUser } from './realtime.js'

export async function createAndSendNotification({
  userId, type, title, body, link, actorId, metadata = {}
}) {
  const notification = await createNotification({
    userId, type, title, body, link, actorId, metadata
  })

  // Real-time if user online
  notifyUser(userId, { type: 'notification', notification })

  // Push notification if user offline
  const subscriptions = await getPushSubscriptionsForUser(userId)
  if (subscriptions.length > 0) {
    await pushToSubscriptions(subscriptions, {
      title,
      body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: { url: link, tag: `notification-${notification.id}` }
    })
  }

  return notification
}

// Helper functions for common notification types
export async function notifyLiveStreamStarted(creatorId) {
  const followers = await getFollowers(creatorId)
  const creator = await findUserById(creatorId)
  
  for (const follower of followers) {
    await createAndSendNotification({
      userId: follower.id,
      type: 'live_stream',
      title: `${creator.name} went live!`,
      body: 'Tap to join the live stream',
      link: `/live/${creatorId}`,
      actorId: creatorId,
    })
  }
}

export async function notifyNewContent(creatorId, contentId, contentType, title) {
  const followers = await getFollowers(creatorId)
  
  for (const follower of followers) {
    await createAndSendNotification({
      userId: follower.id,
      type: 'new_content',
      title: 'New content from your creator!',
      body: `${title} is now available`,
      link: `/${contentType}/${contentId}`,
      actorId: creatorId,
    })
  }
}

export async function notifyNewEpisode(showId, episodeNumber, title) {
  // Get users who have this show in watchlist
  const { rows } = await pool.query(
    `SELECT DISTINCT user_id FROM watchlist WHERE content_id = $1 AND content_type = 'tv'`,
    [showId]
  )
  
  for (const { user_id } of rows) {
    await createAndSendNotification({
      userId: user_id,
      type: 'new_episode',
      title: 'New episode available!',
      body: `Episode ${episodeNumber} of ${title} is now available`,
      link: `/tv/${showId}?season=...&episode=${episodeNumber}`,
    })
  }
}

export async function notifyPaymentReceived(userId, amount, type, contentTitle) {
  await createAndSendNotification({
    userId,
    type: 'payment_received',
    title: 'Payment Received!',
    body: `You received ${type === 'tip' ? 'a tip' : 'a gift'} of ₦${amount.toLocaleString()} for "${contentTitle}"`,
    link: '/creator/wallet',
  })
}

export async function notifyWithdrawalCompleted(userId, amount, status) {
  await createAndSendNotification({
    userId,
    type: 'withdrawal_completed',
    title: status === 'completed' ? 'Withdrawal Completed' : 'Withdrawal Failed',
    body: status === 'completed' 
      ? `Your withdrawal of ₦${amount.toLocaleString()} has been processed`
      : `Your withdrawal of ₦${amount.toLocaleString()} could not be processed`,
    link: '/creator/wallet',
  })
}

export async function notifyNewFollower(userId, followerId) {
  const follower = await findUserById(followerId)
  await createAndSendNotification({
    userId,
    type: 'new_follower',
    title: 'New Follower!',
    body: `${follower.name} started following you`,
    link: `/profile/${followerId}`,
    actorId: followerId,
  })
}

export async function notifyCommentReply(userId, commentId, postId, actorId) {
  const commenter = await findUserById(actorId)
  await createAndSendNotification({
    userId,
    type: 'comment_reply',
    title: 'New Reply',
    body: `${commenter.name} replied to your comment`,
    link: `/post/${postId}#comment-${commentId}`,
    actorId,
  })
}

export async function notifyMention(userId, contentId, contentType, actorId) {
  const actor = await findUserById(actorId)
  await createAndSendNotification({
    userId,
    type: 'mention',
    title: 'You were mentioned!',
    body: `${actor.name} mentioned you`,
    link: `/${contentType}/${contentId}`,
    actorId,
  })
}

export async function notifyMilestoneReached(userId, milestone, value) {
  const titles = {
    '1k_followers': '1,000 Followers!',
    '10k_followers': '10,000 Followers!',
    '100k_views': '100K Views!',
    '1m_views': '1 Million Views!',
  }
  
  await createAndSendNotification({
    userId,
    type: 'milestone',
    title: titles[milestone] || 'Milestone Reached!',
    body: `Congratulations! You've reached ${value.toLocaleString()} ${milestone.replace('_', ' ')}`,
    link: '/creator/dashboard',
  })
}

// Helper functions
async function createNotification({ userId, type, title, body, link, actorId, metadata = {} }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, link, actor_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, type, title, body, link, actorId, JSON.stringify(metadata)]
  )
  return rows[0]
}

async function getPushSubscriptionsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  )
  return rows
}

async function pushToSubscriptions(subscriptions, payload) {
  const webpush = require('web-push')
  const results = await Promise.allSettled(
    subscriptions.map(sub => 
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint])
        }
        throw err
      })
    )
  )
  return results.filter(r => r.status === 'fulfilled').length
}

async function getFollowers(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.avatar FROM users u
     JOIN followers f ON f.follower_id = u.id
     WHERE f.following_id = $1`,
    [userId]
  )
  return rows
}

async function findUserById(userId) {
  const { rows } = await pool.query('SELECT id, name, avatar FROM users WHERE id = $1', [userId])
  return rows[0]
}