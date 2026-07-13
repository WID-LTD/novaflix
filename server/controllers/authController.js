import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { findUserByEmail, findUserById, createUser, saveVerificationCode, verifyCode, updateUser } from '../db.js'
import { sendVerificationCode, sendWelcomeEmail } from '../services/emailService.js'

const JWT_SECRET = process.env.JWT_SECRET || 'novaflix-secret-key-change-in-production'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
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
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    if (!user.email_verified) {
      const code = generateCode()
      await saveVerificationCode(user.id, code)
      try {
        await sendVerificationCode(email, code, user.name)
      } catch {}
      return res.json({ success: true, needsVerification: true, message: 'Please verify your email first', userId: user.id })
    }

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
    if (user.email_verified) return res.status(400).json({ error: 'Email already verified' })

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
  res.json({ success: true, user: safe })
}
