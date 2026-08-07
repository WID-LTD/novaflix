import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database.js'
import { findUserByEmail, findUserById, createUser, saveVerificationCode, verifyCode, updateUser, updateLastLogin, findDevice, upsertDevice, findKnownLocation, recordLocation } from '../db.js'
import { sendVerificationCode, sendWelcomeEmail, sendLoginVerificationCode, sendPasswordResetEmail } from '../services/emailService.js'

const JWT_SECRET = process.env.JWT_SECRET || 'novaflix-secret-key-change-in-production'
const INACTIVITY_DAYS = 14
const LOCATION_RADIUS_KM = 150

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function fingerprint(input) {
  return createHash('sha256').update(input).digest('hex')
}

async function needsLoginVerification(user, ctx) {
  if (!user.last_login_at) return 'inactive'
  const daysSince = (Date.now() - new Date(user.last_login_at).getTime()) / 86400000
  if (daysSince > INACTIVITY_DAYS) return 'inactive'

  if (ctx.lat !== undefined && ctx.lng !== undefined && ctx.lat !== null && ctx.lng !== null) {
    const known = await findKnownLocation(user.id, ctx.lat, ctx.lng, LOCATION_RADIUS_KM)
    if (!known) return 'unknown-location'
  }

  const knownDevice = await findDevice(user.id, ctx.devId)
  if (!knownDevice) {
    if (ctx.ip) {
      const { rows } = await pool.query(
        'SELECT 1 FROM user_devices WHERE user_id = $1 AND ip_address = $2 LIMIT 1',
        [user.id, ctx.ip]
      )
      if (rows.length > 0) return null
    }
    return 'new-device'
  }

  return null
}

async function recordLogin(req, user, deviceId, lat, lng, accuracy) {
  const ip = req.ip || req.connection?.remoteAddress
  const ua = req.headers['user-agent'] || ''
  const devId = deviceId || fingerprint(`${ip}|${ua}`)
  await updateLastLogin(user.id)
  await upsertDevice(user.id, devId, ip, ua)
  if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
    await recordLocation(user.id, lat, lng, accuracy, 'geolocation', ip, ua)
  }
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, plan: user.plan || 'free' }, JWT_SECRET, { expiresIn: '30d' })
}

export async function register(req, res) {
  try {
    const { email, password, name } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const existing = await findUserByEmail(email)
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 10)
    const user = {
      id: uuidv4(),
      email,
      name: name || email.split('@')[0],
      password: hashed,
      role: 'user',
      plan: 'free',
      avatar: null,
      bio: '',
      email_verified: false,
    }
    await createUser(user)

    const code = generateCode()
    await saveVerificationCode(user.id, code)

    try {
      await sendVerificationCode(email, code, user.name)
    } catch (emailErr) {
      console.error('[auth] Failed to send verification email:', emailErr.message)
    }

    res.json({ success: true, message: 'Verification code sent to email', userId: user.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password, deviceId, lat, lng, accuracy } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    if (user.role === 'banned') {
      return res.status(403).json({ error: 'Account banned', banned: true, reason: user.banned_reason || undefined })
    }
    if (user.suspended_until && new Date(user.suspended_until).getTime() > Date.now()) {
      return res.status(403).json({
        error: 'Account suspended',
        suspended: true,
        reason: user.suspension_reason || undefined,
        suspendedUntil: user.suspended_until,
      })
    }

    if (!user.email_verified) {
      return res.json({ success: true, needsVerification: true, userId: user.id, error: 'Email not verified' })
    }

    const ip = req.ip || req.connection?.remoteAddress
    const ua = req.headers['user-agent'] || ''
    const devId = deviceId || fingerprint(`${ip}|${ua}`)

    const reason = await needsLoginVerification(user, { devId, ip, lat, lng })
    if (reason) {
      const code = generateCode()
      await saveVerificationCode(user.id, code)
      try {
        await sendLoginVerificationCode(user.email, user.name, code, reason)
      } catch (err) {
        console.error('[auth] Failed to send login verification email:', err.message)
      }
      return res.json({ success: true, needsLoginVerification: true, userId: user.id, reason })
    }

    await recordLogin(req, user, devId, lat, lng, accuracy)

    const token = signToken(user)
    const safe = { ...user, password: undefined }
    res.json({ success: true, token, user: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function loginVerify(req, res) {
  try {
    const { userId, code, deviceId, lat, lng, accuracy } = req.body
    if (!userId || !code) return res.status(400).json({ error: 'User ID and code required' })

    const valid = await verifyCode(userId, code)
    if (!valid) return res.status(400).json({ error: 'Invalid or expired verification code' })

    const user = await findUserById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (user.role === 'banned') {
      return res.status(403).json({ error: 'Account banned', banned: true, reason: user.banned_reason || undefined })
    }
    if (user.suspended_until && new Date(user.suspended_until).getTime() > Date.now()) {
      return res.status(403).json({ error: 'Account suspended', suspended: true, reason: user.suspension_reason || undefined, suspendedUntil: user.suspended_until })
    }

    await recordLogin(req, user, deviceId, lat, lng, accuracy)

    const token = signToken(user)
    const safe = { ...user, password: undefined }
    res.json({ success: true, token, user: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function verifyEmail(req, res) {
  try {
    const { userId, code } = req.body
    if (!userId || !code) return res.status(400).json({ error: 'User ID and code required' })

    const valid = await verifyCode(userId, code)
    if (!valid) return res.status(400).json({ error: 'Invalid or expired verification code' })

    await updateUser(userId, { email_verified: true })
    const user = await findUserById(userId)

    try {
      await sendWelcomeEmail(user.email, user.name)
    } catch {}

    const token = signToken(user)
    const safe = { ...user, password: undefined }
    res.json({ success: true, token, user: safe, message: 'Email verified successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function resendVerification(req, res) {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'User ID required' })

    const user = await findUserById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const code = generateCode()
    await saveVerificationCode(user.id, code)
    try {
      await sendVerificationCode(user.email, code, user.name)
    } catch {}

    res.json({ success: true, message: 'Verification code resent' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getMe(req, res) {
  const user = await findUserById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const safe = { ...user, password: undefined }
  let accountStatus = 'active'
  if (user.role === 'banned') accountStatus = 'banned'
  else if (user.suspended_until && new Date(user.suspended_until).getTime() > Date.now()) accountStatus = 'suspended'
  safe.accountStatus = accountStatus
  safe.accountReason = accountStatus === 'suspended' ? (user.suspension_reason || '') : (user.banned_reason || '')
  res.json({ success: true, user: safe })
}export async function forgotPassword(req, res) {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email required' })

    const user = await findUserByEmail(email)
    if (user) {
      const token = jwt.sign({ id: user.id, role: user.role, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '30m' })
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
      try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl)
      } catch (err) {
        console.error('[auth] Failed to send password reset email:', err.message)
      }
    }

    res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' })
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(400).json({ error: 'Invalid or expired reset link' })
    }
    if (payload.purpose !== 'password-reset' || !payload.id) {
      return res.status(400).json({ error: 'Invalid or expired reset link' })
    }

    const user = await findUserById(payload.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const hashed = await bcrypt.hash(password, 10)
    const updates = { password: hashed }
    if (!user.email_verified) updates.email_verified = true
    await updateUser(user.id, updates)

    res.json({ success: true, message: 'Password updated. You can now sign in.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
