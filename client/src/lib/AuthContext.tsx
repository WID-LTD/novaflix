import { createContext, useContext, useState, useEffect, type FC, type ReactNode, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, verifyEmail as apiVerifyEmail, resendVerification as apiResendVerification, getMe, getToken, setToken, removeToken } from './auth'

interface User {
  id: string
  email: string
  name: string
  plan: string
  role: string
  avatar: string | null
  bio: string
  email_verified: boolean
  createdAt: string
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  student: 1,
  basic: 2,
  standard: 3,
  premium: 4,
}

export interface PlanFeatures {
  maxResolution: string
  maxResolutionNum: number
  concurrentScreens: number
  downloadDevices: number
  adFree: boolean
  unlimitedSkips: boolean
  spatialAudio: boolean
  premierAccess: boolean
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: { maxResolution: '480p', maxResolutionNum: 480, concurrentScreens: 1, downloadDevices: 0, adFree: false, unlimitedSkips: false, spatialAudio: false, premierAccess: false },
  student: { maxResolution: '720p', maxResolutionNum: 720, concurrentScreens: 1, downloadDevices: 1, adFree: false, unlimitedSkips: false, spatialAudio: false, premierAccess: false },
  basic: { maxResolution: '720p', maxResolutionNum: 720, concurrentScreens: 1, downloadDevices: 1, adFree: false, unlimitedSkips: false, spatialAudio: false, premierAccess: false },
  standard: { maxResolution: '1080p', maxResolutionNum: 1080, concurrentScreens: 2, downloadDevices: 2, adFree: true, unlimitedSkips: true, spatialAudio: false, premierAccess: false },
  premium: { maxResolution: '4K', maxResolutionNum: 2160, concurrentScreens: 4, downloadDevices: 6, adFree: true, unlimitedSkips: true, spatialAudio: true, premierAccess: true },
}

export function getPlanRank(plan: string): number {
  return PLAN_RANK[plan] ?? 0
}

export function getPlanFeatures(plan: string): PlanFeatures {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free
}

interface AuthContextType {
  user: User | null
  loading: boolean
  pendingUserId: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; userId?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; userId?: string; needsVerification?: boolean }>
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>
  resendVerification: () => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isPremium: boolean
  isCreator: boolean
  isAdmin: boolean
  planFeatures: PlanFeatures
  planRank: number
  meetsPlan: (minPlan: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    const res = await getMe(token)
    if (res.success && res.user) {
      setUser(res.user)
    } else {
      removeToken()
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    if (res.success && res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      return { success: true }
    }
    if (res.needsVerification && res.userId) {
      setPendingUserId(res.userId)
      return { success: false, needsVerification: true, userId: res.userId, error: res.message }
    }
    return { success: false, error: res.error || 'Login failed' }
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await apiRegister(email, password, name)
    if (res.success && res.userId) {
      setPendingUserId(res.userId)
      return { success: true, userId: res.userId }
    }
    if (res.success && res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      return { success: true }
    }
    return { success: false, error: res.error || 'Registration failed' }
  }

  const verifyEmail = async (code: string) => {
    if (!pendingUserId) return { success: false, error: 'No pending verification' }
    const res = await apiVerifyEmail(pendingUserId, code)
    if (res.success && res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      setPendingUserId(null)
      return { success: true }
    }
    return { success: false, error: res.error || 'Verification failed' }
  }

  const resendVerification = async () => {
    if (!pendingUserId) return { success: false, error: 'No pending verification' }
    const res = await apiResendVerification(pendingUserId)
    return { success: res.success, error: res.error }
  }

  const logout = () => {
    removeToken()
    setUser(null)
    setPendingUserId(null)
  }

  const currentPlan = user?.plan || 'free'

  return (
    <AuthContext.Provider value={{
      user, loading, pendingUserId,
      login, register, verifyEmail, resendVerification, logout, refresh: loadUser,
      isPremium: currentPlan !== 'free',
      isCreator: user?.role === 'creator' || user?.role === 'admin',
      isAdmin: user?.role === 'admin',
      planFeatures: getPlanFeatures(currentPlan),
      planRank: getPlanRank(currentPlan),
      meetsPlan: (minPlan: string) => getPlanRank(currentPlan) >= getPlanRank(minPlan),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
