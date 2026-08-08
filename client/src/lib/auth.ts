import { API_BASE } from './config'

const BASE = API_BASE

interface AuthResponse {
  success: boolean
  token?: string
  user?: any
  error?: string
  message?: string
  userId?: string
  needsVerification?: boolean
  needsLoginVerification?: boolean
  reason?: 'new-device' | 'inactive' | 'unknown-location'
}

export function getDeviceId(): string {
  let id = localStorage.getItem('novaflix-device-id')
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('novaflix-device-id', id)
  }
  return id
}

export function getCoords(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
    )
  })
}

async function withLoginMeta(body: Record<string, any>): Promise<Record<string, any>> {
  const deviceId = getDeviceId()
  const coords = await getCoords()
  if (coords) {
    body.lat = coords.lat
    body.lng = coords.lng
    body.accuracy = coords.accuracy
  }
  return { ...body, deviceId }
}

export async function register(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const body = await withLoginMeta({ email, password })
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function loginVerify(userId: string, code: string): Promise<AuthResponse> {
  try {
    const body = await withLoginMeta({ userId, code })
    const res = await fetch(`${BASE}/auth/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function forgotPassword(email: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function resetPassword(token: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function verifyEmail(userId: string, code: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function resendVerification(userId: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getMe(token: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function updateProfile(token: string, data: Record<string, any>): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getUserStats(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/user/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function uploadAvatar(token: string, file: File): Promise<any> {
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await fetch(`${BASE}/user/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function uploadShort(file: File, title: string, description?: string): Promise<any> {
  try {
    const token = getToken()
    const formData = new FormData()
    formData.append('video', file)
    formData.append('title', title)
    if (description) formData.append('description', description)
    const res = await fetch(`${BASE}/shorts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function likeShort(shortId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/shorts/${shortId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function bookmarkShort(shortId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/shorts/${shortId}/bookmark`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function shareShort(shortId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/shorts/${shortId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getShortComments(shortId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/shorts/${shortId}/comments`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function postShortComment(shortId: string, text: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/shorts/${shortId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function followUser(userId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ followingId: userId }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function recordShortView(shortId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/shorts/${shortId}/view`, { method: 'POST' })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/user/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function deleteAccount(token: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/user/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getPaymentStatus(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payment/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function uploadFilm(token: string, data: { title: string; description: string; genre: string; videoFile?: File; posterFile?: File }): Promise<any> {
  try {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('genre', data.genre)
    if (data.videoFile) formData.append('video', data.videoFile)
    if (data.posterFile) formData.append('thumbnail', data.posterFile)
    const res = await fetch(`${BASE}/creator/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getCreatorStats(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/creator/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getCreatorUploads(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/creator/uploads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function sendTip(token: string, creatorId: string, amount: number, message?: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/tips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ creatorId, amount, message }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function initializeGlowGift(token: string, creatorId: string, amount: number, note?: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/gift/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ creatorId, amount, note }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function verifyGlowGift(token: string, reference: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/gift/verify?reference=${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getMyGlowGifts(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/gift/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function recordWatch(token: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/user/watch-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getWatchHistory(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/user/watch-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getEggs(token: string, contentId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/eggs?contentId=${encodeURIComponent(contentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function collectEgg(token: string, keyId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/eggs/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ keyId }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getMyEggs(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/eggs/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function createEgg(token: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/eggs/creator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getSecretRoom(token: string, roomId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/eggs/room/${encodeURIComponent(roomId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Creator auth
export async function creatorRegister(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/creator/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function creatorLogin(email: string, password: string): Promise<AuthResponse> {
  try {
    const body = await withLoginMeta({ email, password })
    const res = await fetch(`${BASE}/creator/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function creatorLoginVerify(userId: string, code: string): Promise<AuthResponse> {
  try {
    const body = await withLoginMeta({ userId, code })
    const res = await fetch(`${BASE}/creator/auth/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function creatorForgotPassword(email: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/creator/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function creatorResetPassword(token: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${BASE}/creator/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Creator token management
export function getCreatorToken(): string | null {
  return localStorage.getItem('novaflix-creator-token')
}

export function setCreatorToken(token: string) {
  localStorage.setItem('novaflix-creator-token', token)
}

export function removeCreatorToken() {
  localStorage.removeItem('novaflix-creator-token')
}

// Newsletter
export async function subscribeNewsletter(email: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Admin API
export async function adminGetUsers(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminGetStats(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminGetUploads(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/uploads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminGetCreators(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/creators`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminUpdateUserRole(token: string, userId: string, role: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminBanUser(token: string, userId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminSendNewsletter(token: string, subject: string, content: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/newsletter/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subject, content }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminGetNewsletterSubscribers(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/newsletter/subscribers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function adminSendAnnouncement(token: string, payload: Record<string, any>): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function pushSubscribe(token: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<any> {
  try {
    const res = await fetch(`${BASE}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(sub),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function pushStatus(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/push/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Admin platform v2
export async function adminOverview(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/overview`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminAnalytics(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminCatalog(token: string, type?: string): Promise<any> {
  const q = type ? `?type=${type}` : ''
  try {
    const res = await fetch(`${BASE}/admin/catalog${q}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminUpdateCatalogItem(token: string, kind: string, id: string, fields: Record<string, any>): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/catalog/${kind}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminTransactions(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/transactions`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminSubscriptions(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminPromoCodes(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/promo`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminCreatePromo(token: string, payload: Record<string, any>): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/promo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminBanners(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/banners`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminCreateBanner(token: string, data: Record<string, any>): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/banners`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminFeedSettings(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/feed-settings`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminSetFeedSetting(token: string, key: string, value: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/feed-settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ key, value }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminModeration(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/moderation`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminResolveReport(token: string, id: string, status: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/moderation/reports/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminAuditLog(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/audit-log`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminCommunity(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/community`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function submitReport(token: string, targetType: string, targetId: string, reason: string, details?: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/reports`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetType, targetId, reason, details }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function submitAppeal(token: string, message: string, appealType?: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/appeals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message, appealType }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function myAppeals(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/appeals/mine`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, appeals: [], error: 'Network error' } }
}

export async function adminAppeals(token: string, status?: string): Promise<any> {
  try {
    const q = status && status !== 'all' ? `?status=${status}` : ''
    const res = await fetch(`${BASE}/admin/appeals${q}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, appeals: [], error: 'Network error' } }
}

export async function adminDecideAppeal(token: string, id: string, status: string, resolutionNote?: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/appeals/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, resolutionNote }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// RBAC (admin roles & permissions)
export async function adminPermissions(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/permissions`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, permissions: [], error: 'Network error' } }
}

export async function adminRoles(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/roles`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, roles: [], error: 'Network error' } }
}

export async function adminCreateRole(token: string, payload: Record<string, any>): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/roles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminUpdateRole(token: string, id: string, payload: Record<string, any>): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/roles/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminDeleteRole(token: string, id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/roles/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminAssignRole(token: string, userId: string, adminRoleId: string | null): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/users/${userId}/admin-role`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ adminRoleId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function adminGetMe(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/admin/me`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Communities
export async function getCommunities(search?: string): Promise<any> {
  try {
    const token = getToken()
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await fetch(`${BASE}/community${params}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, communities: [], error: 'Network error' } }
}

export async function getCommunity(id: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function createCommunity(data: { name: string; description?: string; avatar?: string }): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function joinCommunity(id: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/${id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function leaveCommunity(id: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/${id}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyCommunities(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/mine`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, communities: [], error: 'Network error' } }
}

export async function addCommunityPost(communityId: string, content: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/${communityId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function deleteCommunityPost(communityId: string, postId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/${communityId}/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function likeCommunityPost(communityId: string, postId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/${communityId}/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getCommunityMembers(communityId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/community/${communityId}/members`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, members: [], error: 'Network error' } }
}

// Downloads
export async function getDownloadedFiles(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/downloads/list`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, files: [], error: 'Network error' } }
}

export async function deleteDownloadedFile(filename: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/downloads/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Recommendations
export async function getForYouRecommendations(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/recommendations/for-you`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return { success: false, data: [], error: 'Network error' }
  }
}

export async function getTrendingRecommendations(): Promise<any> {
  try {
    const res = await fetch(`${BASE}/recommendations/trending`)
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function getSimilarRecommendations(id: string, type?: string): Promise<any> {
  try {
    const params = type ? `?type=${type}` : ''
    const res = await fetch(`${BASE}/recommendations/similar/${id}${params}`)
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Likes
export async function toggleLike(contentId: string, contentType: string, creatorId?: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentId, contentType, creatorId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function checkLike(contentId: string, contentType: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/like?contentId=${contentId}&contentType=${contentType}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Follows
export async function toggleFollow(followingId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ followingId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function checkFollow(followingId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/follow?followingId=${followingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getFollowStats(userId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/follow-stats?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getFollowers(userId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/followers?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getFollowing(userId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/following?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Comments
export async function getComments(contentId: string, contentType: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/interactions/comments?contentId=${contentId}&contentType=${contentType}`)
    return res.json()
  } catch { return { success: false, comments: [], error: 'Network error' } }
}

export async function postComment(contentId: string, contentType: string, text: string, creatorId?: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentId, contentType, text, creatorId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function deleteComment(id: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/comment/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Payouts
export async function createPayoutRecipient(token: string, data: { bankCode: string; accountNumber: string; accountName: string }): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payouts/recipient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function requestWithdraw(token: string, amount: number): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payouts/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getPayoutHistory(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payouts/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, payouts: [], error: 'Network error' } }
}

// Creator dashboard
export async function getCreatorDashboard(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/creator/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getCreatorEarnings(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/creator/earnings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getCreatorComments(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/creator/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, comments: [], error: 'Network error' } }
}

// Payment
export async function initializePayment(token: string, plan: string, gateway?: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payment/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan, gateway }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getGatewayInfo(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payment/gateway-info`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { paystack: { configured: false }, flutterwave: { configured: false } } }
}

export async function verifyPayment(token: string, reference: string, plan: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payment/verify?reference=${reference}&plan=${plan}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Artist Graph
export async function getArtistGraph(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payouts/graph`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, nodes: [], edges: [], error: 'Network error' } }
}

// Membership tiers
export async function createTier(token: string, data: { name: string; description?: string; price: number; benefits?: string[] }): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/tiers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function updateTier(token: string, id: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/tiers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getCreatorTiers(creatorId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/tiers/${creatorId}`)
    return res.json()
  } catch { return { success: false, tiers: [], error: 'Network error' } }
}

export async function getMyTiers(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/my-tiers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, tiers: [], error: 'Network error' } }
}

export async function subscribeToTier(token: string, tierId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tierId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function verifyMembershipPayment(token: string, reference: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/verify?reference=${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyMemberships(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/my-memberships`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, memberships: [], error: 'Network error' } }
}

export async function cancelMembership(token: string, id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMySubscribers(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/memberships/my-subscribers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, subscribers: [], stats: {}, error: 'Network error' } }
}

// Live events
export async function createEvent(token: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function updateEvent(token: string, id: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getEvents(includePast?: boolean): Promise<any> {
  try {
    const params = includePast ? '?includePast=true' : ''
    const res = await fetch(`${BASE}/events${params}`)
    return res.json()
  } catch { return { success: false, events: [], error: 'Network error' } }
}

export async function getEvent(id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/events/${id}`)
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyEvents(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/events/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, events: [], error: 'Network error' } }
}

export async function purchaseEventTicket(token: string, eventId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/events/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function verifyTicketPayment(token: string, reference: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/events/purchase/verify?reference=${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyTickets(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/events/my-tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, tickets: [], error: 'Network error' } }
}

// Store / Products
export async function getProducts(category?: string): Promise<any> {
  try {
    const params = category && category !== 'all' ? `?category=${category}` : ''
    const res = await fetch(`${BASE}/store${params}`)
    return res.json()
  } catch { return { success: false, products: [], error: 'Network error' } }
}

export async function getProduct(id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/store/${id}`)
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function createProduct(token: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function updateProduct(token: string, id: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/store/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyProducts(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/store/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, products: [], error: 'Network error' } }
}

export async function checkoutStore(token: string, items: { productId: string; quantity: number }[]): Promise<any> {
  try {
    const res = await fetch(`${BASE}/store/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function verifyStoreOrder(token: string, reference: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/store/checkout/verify?reference=${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyOrders(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/store/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, orders: [], error: 'Network error' } }
}

// Courses
export async function getCourses(category?: string): Promise<any> {
  try {
    const params = category && category !== 'all' ? `?category=${category}` : ''
    const res = await fetch(`${BASE}/courses${params}`)
    return res.json()
  } catch { return { success: false, courses: [], error: 'Network error' } }
}

export async function getCourse(id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses/${id}`)
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function createCourse(token: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function updateCourse(token: string, id: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyCourses(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, courses: [], error: 'Network error' } }
}

export async function enrollCourse(token: string, courseId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function verifyCoursePayment(token: string, reference: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses/enroll/verify?reference=${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getMyEnrollments(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses/enrollments/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, enrollments: [], error: 'Network error' } }
}

export async function updateCourseProgress(token: string, courseId: string, progress: number): Promise<any> {
  try {
    const res = await fetch(`${BASE}/courses/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId, progress }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Archive
export async function getArchiveItems(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/archive`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, items: [], error: 'Network error' } }
}

export async function getArchiveItem(token: string, id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/archive/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// Token management
export function getToken(): string | null {
  return localStorage.getItem('novaflix-token')
}

export function setToken(token: string) {
  localStorage.setItem('novaflix-token', token)
}

export function removeToken() {
  localStorage.removeItem('novaflix-token')
}

// Achievements
export async function getAchievements(): Promise<any> {
  try {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${BASE}/achievements`, { headers })
    return res.json()
  } catch { return { success: false, data: [], error: 'Network error' } }
}

export async function getMyAchievements(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/achievements/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, data: [], error: 'Network error' } }
}

export async function getGamification(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/achievements/me/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, data: null, error: 'Network error' } }
}

export async function checkAchievements(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/achievements/check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, awarded: [], error: 'Network error' } }
}

// ============ SHARE DEEP-LINKS ============
export async function createShareLink(contentId: string, contentType = 'movie', creatorId?: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/share/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentId, contentType, creatorId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getShareStats(contentId: string, contentType = 'movie'): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/share/links/stats?contentId=${contentId}&contentType=${contentType}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, stats: { totalClicks: 0 }, error: 'Network error' } }
}

// ============ FAN LEADERBOARDS / SUPERFAN ============
export async function getFanLeaderboard(creatorId: string, limit = 20): Promise<any> {
  try {
    const res = await fetch(`${BASE}/fan/${creatorId}/leaderboard?limit=${limit}`)
    return res.json()
  } catch { return { success: false, fans: [], error: 'Network error' } }
}

export async function getFanStatus(creatorId: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/fan/${creatorId}/status`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, engaged: false, points: 0, error: 'Network error' } }
}

// ============ HOT-TAKE FORUM ============
export async function getForumTopics(category = 'all', limit = 30, offset = 0, sort = 'new'): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/forum/topics?category=${category}&limit=${limit}&offset=${offset}&sort=${sort}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, topics: [], error: 'Network error' } }
}

export async function getForumTopic(id: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/forum/topics/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function createForumTopic(title: string, category: string, content: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/forum/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, category, content }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function voteForumTopic(topicId: string, vote: number): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/forum/topics/${topicId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ vote }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function addForumReply(topicId: string, content: string, parentId?: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/forum/topics/${topicId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content, parentId }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function voteForumReply(replyId: string, vote: number): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/forum/replies/${replyId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ vote }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getForumCategories(): Promise<any> {
  try {
    const res = await fetch(`${BASE}/forum/categories`)
    return res.json()
  } catch { return { success: false, categories: [], error: 'Network error' } }
}

// ============ TRIVIA / GAMIFICATION ============
export async function getDailyTrivia(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/today`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, questions: [], error: 'Network error' } }
}

export async function submitDailyTrivia(answers: { id: string; answerIndex: number }[]): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getTriviaStreak(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/streak`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, streak: 0, error: 'Network error' } }
}

export async function getTriviaLeaderboard(limit = 20): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/leaderboard?limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, leaderboard: [], error: 'Network error' } }
}

export async function getGuessMovie(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/guess`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function submitGuess(questionId: string, answerIndex: number): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/guess/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questionId, answerIndex }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function getCoinsBalance(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/coins`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, coins: 0, error: 'Network error' } }
}

export async function getCosmetics(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/cosmetics`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, cosmetics: [], coins: 0, error: 'Network error' } }
}

export async function purchaseCosmetic(id: string): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/cosmetics/${id}/purchase`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function equipCosmetic(id: string, equipped: boolean): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/trivia/cosmetics/${id}/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ equipped }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

// ============ DIRECT CHAT ============
export async function getConversations(): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, conversations: [], error: 'Network error' } }
}

export async function getDirectMessages(withUserId: string, limit = 50): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/chat/messages?with=${withUserId}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  } catch { return { success: false, messages: [], error: 'Network error' } }
}

// ============ MEDIA COMMENTS ============
export async function postCommentFull(opts: {
  contentId: string
  contentType: string
  text?: string
  creatorId?: string
  parentId?: string
  mediaUrl?: string
  mediaType?: string
  durationSeconds?: number
  unlockAt?: string
  milestoneUnlock?: string
}): Promise<any> {
  try {
    const token = getToken()
    const res = await fetch(`${BASE}/interactions/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(opts),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}

export async function uploadCommentMedia(file: File): Promise<any> {
  try {
    const token = getToken()
    const fd = new FormData()
    fd.append('media', file)
    const res = await fetch(`${BASE}/interactions/comment-media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
}
