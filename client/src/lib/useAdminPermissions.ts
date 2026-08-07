import { useCallback, useEffect, useState } from 'react'
import { getToken, adminGetMe } from '../lib/auth'

export interface AdminPermState {
  permissions: string[]
  slug: string | null
  roleId: string | null
  roleName: string | null
  loading: boolean
  isSuper: boolean
  can: (key: string) => boolean
}

const SUPER_ADMIN = 'super-admin'

export function useAdminPermissions(): AdminPermState {
  const [state, setState] = useState<AdminPermState>({
    permissions: [],
    slug: null,
    roleId: null,
    roleName: null,
    loading: true,
    isSuper: false,
    can: () => false,
  })

  const load = useCallback(async () => {
    const token = getToken()
    if (!token) return setState((s) => ({ ...s, loading: false }))
    const res = await adminGetMe(token)
    if (res.success) {
      setState((s) => ({
        ...s,
        permissions: res.permissions || [],
        slug: res.slug || null,
        roleId: res.roleId || null,
        roleName: res.roleName || null,
        loading: false,
      }))
    } else {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  useEffect(() => { load() }, [load])

  const isSuper = state.slug === SUPER_ADMIN
  const can = useCallback((key: string) => isSuper || state.permissions.includes(key), [state.permissions, isSuper])

  return { ...state, isSuper, can }
}

export type AdminPerm = ReturnType<typeof useAdminPermissions>
