const BASE = '/api'

interface AuthResponse {
  success: boolean
  token?: string
  user?: any
  error?: string
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
