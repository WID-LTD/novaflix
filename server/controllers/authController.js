import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database.js'
import { findUserByEmail, findUserById, findUserByGoogleId, createUser, saveVerificationCode, verifyCode, updateUser, updateLastLogin, findDevice, upsertDevice, findKnownLocation, recordLocation } from '../db.js'
import { sendVerificationCode, sendWelcomeEmail, sendLoginVerificationCode, sendPasswordResetEmail, isEmailConfigured } from '../services/emailService.js'
import { resolveJwtSecret } from '../config/jwtSecret.js'

const JWT_SECRET = resolveJwtSecret()
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

    if (!isEmailConfigured()) {
      return res.status(503).json({ error: 'Email verification is temporarily unavailable. Please try again later.' })
    }

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
    console.log(`[auth] register: ${email} (verification code sent)`)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password, deviceId, lat, lng, accuracy } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await findUserByEmail(email)
    if (!user) {
      console.warn(`[auth] login failed: no account for ${email}`)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!user.password) {
      console.warn(`[auth] login failed: ${email} uses Google Sign-In`)
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      console.warn(`[auth] login failed: bad password for ${email}`)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (user.role === 'banned') {
      console.warn(`[auth] login blocked: banned account ${email}`)
      return res.status(403).json({ error: 'Account banned', banned: true, reason: user.banned_reason || undefined })
    }
    if (user.suspended_until && new Date(user.suspended_until).getTime() > Date.now()) {
      console.warn(`[auth] login blocked: suspended account ${email}`)
      return res.status(403).json({
        error: 'Account suspended',
        suspended: true,
        reason: user.suspension_reason || undefined,
        suspendedUntil: user.suspended_until,
      })
    }

    if (!user.email_verified) {
      console.warn(`[auth] login blocked: unverified email ${email}`)
      return res.json({ success: true, needsVerification: true, userId: user.id, error: 'Email not verified' })
    }

    const ip = req.ip || req.connection?.remoteAddress
    const ua = req.headers['user-agent'] || ''
    const devId = deviceId || fingerprint(`${ip}|${ua}`)

    const reason = await needsLoginVerification(user, { devId, ip, lat, lng })
    if (reason) {
      if (!isEmailConfigured()) {
        console.warn(`[auth] Login verification required (${reason}) but email is not configured; allowing sign-in.`)
        return res.status(503).json({ error: 'Security verification is temporarily unavailable. Please try again later.' })
      }
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
    console.log(`[auth] login success: ${email} (${user.role})`)
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
    if (!valid) {
      console.warn(`[auth] verify failed: bad/expired code for user ${userId?.slice?.(0, 8)}`)
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    await updateUser(userId, { email_verified: true })
    const user = await findUserById(userId)

    try {
      await sendWelcomeEmail(user.email, user.name)
    } catch {}

    const token = signToken(user)
    const safe = { ...user, password: undefined }
    console.log(`[auth] verify success: ${user.email}`)
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
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email required' })

    if (!isEmailConfigured()) {
      return res.status(503).json({ error: 'Password reset is temporarily unavailable. Please try again later.' })
    }

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

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
  const host = req.get('host')
  return `${proto}://${host}`
}

function parseCookies(req) {
  const header = req.headers.cookie || ''
  const cookies = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) cookies[decodeURIComponent(key)] = decodeURIComponent(value)
  }
  return cookies
}

function sanitizeRedirectPath(path) {
  if (path && typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) {
    return path.slice(0, 500)
  }
  return '/home'
}

export async function startGoogleAuth(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return res.status(503).json({ error: 'Google Sign-In is not configured. Please try again later.' })
  }

  const redirectPath = sanitizeRedirectPath(req.query.redirect)
  const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`
  const state = jwt.sign({ purpose: 'google-oauth', path: redirectPath, ts: Date.now() }, JWT_SECRET, { expiresIn: '10m' })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })

  res.cookie('google_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.headers['x-forwarded-proto'] === 'https' || req.secure,
    maxAge: 10 * 60 * 1000,
    path: '/',
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}

export async function googleCallback(req, res) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const fail = (msg) => res.redirect(`${appUrl}/oauth/callback?error=${encodeURIComponent(msg)}`)

  try {
    const { code, state, error } = req.query

    if (error) return fail('Google Sign-In was cancelled or failed.')

    const cookieState = parseCookies(req).google_oauth_state
    if (!code || !state || !cookieState || state !== cookieState) {
      return fail('Invalid sign-in request. Please try again.')
    }

    let statePayload
    try {
      statePayload = jwt.verify(state, JWT_SECRET)
    } catch {
      return fail('Sign-in request expired. Please try again.')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) return fail('Google Sign-In is not configured. Please try again later.')

    const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    })

    const { id_token } = tokenRes.data
    if (!id_token) return fail('Unable to verify your Google account.')

    const profile = jwt.decode(id_token)
    if (!profile || !profile.sub || !profile.email) return fail('Unable to read your Google account.')

    if (profile.email_verified === false) {
      return fail('Your Google email is not verified.')
    }

    let user = await findUserByGoogleId(profile.sub)
    let isNew = false

    if (!user) {
      const existing = await findUserByEmail(profile.email)
      if (existing) {
        await updateUser(existing.id, { google_id: profile.sub, email_verified: true, avatar: existing.avatar || profile.picture || null })
        user = await findUserById(existing.id)
      } else {
        isNew = true
        user = {
          id: uuidv4(),
          email: profile.email,
          name: profile.name || profile.given_name || profile.email.split('@')[0],
          password: null,
          role: 'user',
          plan: 'free',
          avatar: profile.picture || null,
          bio: '',
          email_verified: true,
          google_id: profile.sub,
        }
        await createUser(user)
      }
    }

    if (user.role === 'banned') {
      return res.redirect(`${appUrl}/oauth/callback?error=${encodeURIComponent('Account banned')}`)
    }
    if (user.suspended_until && new Date(user.suspended_until).getTime() > Date.now()) {
      return res.redirect(`${appUrl}/oauth/callback?error=${encodeURIComponent('Account suspended')}`)
    }

    await recordLogin(req, user, undefined, undefined, undefined, undefined)

    const token = signToken(user)
    const redirectPath = sanitizeRedirectPath(statePayload.path)

    res.clearCookie('google_oauth_state')
    res.redirect(`${appUrl}/oauth/callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectPath)}&new=${isNew ? '1' : '0'}`)
  } catch (err) {
    console.error('[auth] Google OAuth callback error:', err.message)
    fail('Google Sign-In failed. Please try again.')
  }
}
