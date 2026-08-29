import { createContext, useContext, useState, useEffect, useCallback, useRef, type FC, type ReactNode } from 'react'
import {
  login as apiLogin,
  register as apiRegister,
  verifyEmail as apiVerifyEmail,
  resendVerification as apiResendVerification,
  loginVerify as apiLoginVerify,
  centralizedLogin as apiCentralizedLogin,
  authLogout as apiAuthLogout,
  authRefreshToken,
  getMe,
  getToken,
  setToken,
  removeToken,
  getSettings
} from './auth'
import { setLocale } from '../i18n'

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
  suspended_until?: string | null
  suspension_reason?: string
  banned_reason?: string
  accountStatus?: 'active' | 'suspended' | 'banned'
  accountReason?: string
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
  hdrDolby: boolean
  premierAccess: boolean
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: { maxResolution: '480p', maxResolutionNum: 480, concurrentScreens: 1, downloadDevices: 0, adFree: false, unlimitedSkips: false, spatialAudio: false, hdrDolby: false, premierAccess: false },
  student: { maxResolution: '720p', maxResolutionNum: 720, concurrentScreens: 1, downloadDevices: 1, adFree: false, unlimitedSkips: false, spatialAudio: false, hdrDolby: false, premierAccess: false },
  basic: { maxResolution: '720p', maxResolutionNum: 720, concurrentScreens: 1, downloadDevices: 1, adFree: true, unlimitedSkips: false, spatialAudio: false, hdrDolby: false, premierAccess: false },
  standard: { maxResolution: '1080p', maxResolutionNum: 1080, concurrentScreens: 2, downloadDevices: 2, adFree: true, unlimitedSkips: true, spatialAudio: false, hdrDolby: false, premierAccess: false },
  premium: { maxResolution: '4K', maxResolutionNum: 2160, concurrentScreens: 4, downloadDevices: 6, adFree: true, unlimitedSkips: true, spatialAudio: true, hdrDolby: true, premierAccess: true },
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
  authLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string; emailVerified?: boolean; needsVerification?: boolean; needsLoginVerification?: boolean; reason?: string; userId?: string }>
  authLogout: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; needsLoginVerification?: boolean; reason?: string; userId?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; userId?: string; needsVerification?: boolean }>
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>
  verifyLogin: (code: string) => Promise<{ success: boolean; error?: string }>
  resendVerification: () => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refresh: () => Promise<void>
  isPremium: boolean
  isCreator: boolean
  isAdmin: boolean
  accountStatus: 'active' | 'suspended' | 'banned'
  planFeatures: PlanFeatures
  planRank: number
  meetsPlan: (minPlan: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Token refresh every 14 minutes (tokens expire at 15 min)
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = getToken()
      if (!token) return
      const res = await authRefreshToken()
      if (res.success && res.token) {
        setToken(res.token)
      } else {
        // Refresh failed — log out
        removeToken()
        setUser(null)
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      }
    }, 14 * 60 * 1000)
    refreshTimerRef.current = interval
    return () => clearInterval(interval)
  }, [])

  const loadUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    const res = await getMe(token)
    if (res.success && res.user) {
      setUser(res.user)
      const settingsRes = await getSettings(token)
      if (settingsRes.success && settingsRes.settings?.locale) {
        setLocale(settingsRes.settings.locale)
      }
    } else {
      removeToken()
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  /** Centralized login (new system) */
  const authLogin = async (email: string, password: string) => {
    const res = await apiCentralizedLogin(email, password)
    if (res.success && res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      return { success: true, role: res.user.role, emailVerified: res.user.email_verified }
    }
    if (res.needsLoginVerification && res.userId) {
      setPendingUserId(res.userId)
      return { success: false, needsLoginVerification: true, reason: res.reason, userId: res.userId, error: res.error }
    }
    if (res.needsVerification && res.userId) {
      setPendingUserId(res.userId)
      return { success: false, needsVerification: true, userId: res.userId, error: res.error }
    }
    return { success: false, error: res.error || 'Login failed' }
  }

  /** Logout with server-side token invalidation */
  const authLogout = async () => {
    await apiAuthLogout()
    removeToken()
    setUser(null)
    setPendingUserId(null)
  }

  /** @deprecated Use authLogin instead — kept for old pages */
  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    if (res.success && res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      return { success: true }
    }
    if (res.needsLoginVerification && res.userId) {
      setPendingUserId(res.userId)
      return { success: false, needsLoginVerification: true, reason: res.reason, userId: res.userId, error: res.message }
    }
    if (res.needsVerification && res.userId) {
      setPendingUserId(res.userId)
      return { success: false, needsVerification: true, userId: res.userId, error: res.message }
    }
    return { success: false, error: res.error || 'Login failed' }
  }

  /** @deprecated Old pages — new pages should not use register at all */
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

  const verifyLogin = async (code: string) => {
    if (!pendingUserId) return { success: false, error: 'No pending verification' }
    const res = await apiLoginVerify(pendingUserId, code)
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
      authLogin, authLogout,
      login, register, verifyEmail, verifyLogin, resendVerification, logout: authLogout, refresh: loadUser,
      isPremium: currentPlan !== 'free',
      isCreator: user?.role === 'creator' || user?.role === 'admin',
      isAdmin: user?.role === 'admin',
      accountStatus: user?.accountStatus || 'active',
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
