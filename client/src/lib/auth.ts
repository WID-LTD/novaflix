const BASE = '/api'

interface AuthResponse {
  success: boolean
  token?: string
  user?: any
  error?: string
  message?: string
  userId?: string
  needsVerification?: boolean
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
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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

export async function createCheckout(token: string, plan: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payment/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
    })
    return res.json()
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export async function confirmPayment(token: string, plan: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payment/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
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

export async function uploadFilm(token: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${BASE}/creator/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
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
    const res = await fetch(`${BASE}/creator/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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

export async function getCreatorComments(token: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/creator/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch { return { success: false, comments: [], error: 'Network error' } }
}

// Payment (Paystack)
export async function initializePayment(token: string, plan: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}/payment/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
    })
    return res.json()
  } catch { return { success: false, error: 'Network error' } }
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
