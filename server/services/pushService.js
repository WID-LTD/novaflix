import webpush from 'web-push'
import { getPushSubscriptionsForUsers, deletePushSubscription } from '../db.js'

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@novaflix.com'

let configured = false
try {
  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    configured = true
  }
} catch (err) {
  console.error('[push] VAPID setup failed:', err.message)
}

export function isPushConfigured() {
  return configured
}

export function getVapidPublicKey() {
  return publicKey
}

export async function pushToSubscriptions(subscriptions, payload) {
  if (!configured || !subscriptions || subscriptions.length === 0) return 0
  const data = JSON.stringify(payload)
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        )
        .catch(async (err) => {
          if (err && (err.statusCode === 404 || err.statusCode === 410)) {
            await deletePushSubscription(sub.endpoint).catch(() => {})
          }
          throw err
        })
    )
  )
  return results.filter((r) => r.status === 'fulfilled').length
}

export async function pushToUsers(userIds, payload) {
  if (!userIds || userIds.length === 0) return 0
  const subs = await getPushSubscriptionsForUsers(userIds)
  return pushToSubscriptions(subs, payload)
}
