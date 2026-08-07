import { useCallback, useEffect, useState } from 'react'
import { getToken } from '../lib/auth'

const BASE = '/api'

export interface PushStatus {
  configured: boolean
  publicKey: string | null
}

export function usePushNotifications(enabled: boolean) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [configured, setConfigured] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (!ok) return
    setPermission(Notification.permission)

    let cancelled = false
    ;(async () => {
      try {
        const token = getToken()
        if (!token) return
        const res = await fetch(`${BASE}/push/status`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (!cancelled && data?.success) {
          setConfigured(Boolean(data.configured))
          setPublicKey(data.publicKey || null)
        }
      } catch {
        /* push status unavailable */
      }
    })()

    return () => { cancelled = true }
  }, [enabled])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false
    if (Notification.permission === 'denied') return false
    setSubscribing(true)
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      if (Notification.permission !== 'granted') return false

      if (!publicKey) {
        const token = getToken()
        const res = await fetch(`${BASE}/push/status`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (!data?.publicKey) return false
        setPublicKey(data.publicKey)
      }

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!) as unknown as BufferSource,
        })
      }
      const token = getToken()
      const res = await fetch(`${BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))) } }),
      })
      const data = await res.json()
      return Boolean(data?.success)
    } catch {
      return false
    } finally {
      setSubscribing(false)
    }
  }, [supported, publicKey])

  return { supported, permission, configured, publicKey, subscribing, subscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
