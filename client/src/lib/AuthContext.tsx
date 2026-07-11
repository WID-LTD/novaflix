import { createContext, useContext, useState, useEffect, type FC, type ReactNode, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, getMe, getToken, setToken, removeToken } from './auth'

interface User {
  id: string
  email: string
  name: string
  plan: string
  avatar: string | null
  bio: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isPremium: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
    return { success: false, error: res.error || 'Login failed' }
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await apiRegister(email, password, name)
    if (res.success && res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      return { success: true }
    }
    return { success: false, error: res.error || 'Registration failed' }
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isPremium: user?.plan === 'premium' || user?.plan === 'duo' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
