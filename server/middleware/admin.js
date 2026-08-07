import { findUserById, getAdminRolePermissions } from '../db.js'

export async function adminMiddleware(req, res, next) {
  try {
    const user = await findUserById(req.userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.user = user
    const role = await getAdminRolePermissions(user.id)
    req.permissions = role.permissions
    req.adminRoleSlug = role.slug
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// requirePermission('users.view') or requirePermission(['users.view', 'users.edit'])
export function requirePermission(...keys) {
  const flat = keys.flat()
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(403).json({ error: 'Admin access required' })
      const perms = req.permissions || []
      // Super admin bypasses per-key checks.
      if (req.adminRoleSlug === 'super-admin') return next()
      const allowed = flat.some((k) => perms.includes(k))
      if (!allowed) return res.status(403).json({ error: 'Insufficient permissions' })
      next()
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

export async function creatorOrAdminMiddleware(req, res, next) {
  try {
    const user = await findUserById(req.userId)
    if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Creator or admin access required' })
    }
    req.user = user
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
