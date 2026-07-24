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
