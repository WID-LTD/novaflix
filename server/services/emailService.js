import { TransactionalEmailsApi } from '@sendinblue/client'

const apiKey = process.env.BREVO_API_KEY
const fromEmail = process.env.BREVO_EMAIL || 'chukwusuccess247@gmail.com'
const fromName = process.env.BREVO_NAME || 'NovaFlix'

let apiInstance = null

function getClient() {
  if (!apiKey) return null
  if (!apiInstance) {
    apiInstance = new TransactionalEmailsApi()
    apiInstance.authentications['apiKey'].apiKey = apiKey
  }
  return apiInstance
}

export async function sendVerificationCode(to, code, name) {
  const client = getClient()
  if (!client) {
    console.warn('[email] BREVO_API_KEY not set, skipping verification email')
    return
  }

  const sendSmtpEmail = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to, name: name || to }],
    subject: 'Verify your NovaFlix account',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #090909; color: #fff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #E50914; font-size: 28px; margin: 0;">NovaFlix</h1>
        </div>
        <h2 style="font-size: 20px; margin: 0 0 8px;">Welcome${name ? ', ' + name : ''}!</h2>
        <p style="color: #aaa; font-size: 14px; line-height: 1.6;">Use the code below to verify your email address and start streaming.</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #E50914; background: #181818; padding: 12px 24px; border-radius: 8px; display: inline-block;">${code}</span>
        </div>
        <p style="color: #666; font-size: 12px;">This code expires in 15 minutes. If you didn't create an account, you can ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">NovaFlix — Premium Streaming for Everyone</p>
      </div>
    `,
  }

  try {
    await client.sendTransacEmail(sendSmtpEmail)
    console.log('[email] Verification code sent to', to)
  } catch (err) {
    console.error('[email] Failed to send:', err.message)
    throw err
  }
}

export async function sendPasswordResetEmail(to, name, resetUrl) {
  const client = getClient()
  if (!client) {
    console.warn('[email] BREVO_API_KEY not set, skipping password reset email')
    return
  }

  const sendSmtpEmail = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to, name: name || to }],
    subject: 'Reset your NovaFlix password',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #090909; color: #fff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #E50914; font-size: 28px; margin: 0;">NovaFlix</h1>
        </div>
        <h2 style="font-size: 20px; margin: 0 0 8px;">Reset your password${name ? ', ' + name : ''}</h2>
        <p style="color: #aaa; font-size: 14px; line-height: 1.6;">We received a request to reset your NovaFlix password. Click the button below to choose a new one. This link expires in 30 minutes.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #E50914; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #aaa; font-size: 12px; word-break: break-all; background: #111; padding: 12px; border-radius: 8px;">${resetUrl}</p>
        <p style="color: #666; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">NovaFlix — Premium Streaming for Everyone</p>
      </div>
    `,
  }

  try {
    await client.sendTransacEmail(sendSmtpEmail)
    console.log('[email] Password reset link sent to', to)
  } catch (err) {
    console.error('[email] Failed to send password reset:', err.message)
    throw err
  }
}

export async function sendLoginVerificationCode(to, name, code, reason) {
  const client = getClient()
  if (!client) {
    console.warn('[email] BREVO_API_KEY not set, skipping login verification email')
    return
  }

  const copy = {
    'new-device': 'We noticed a sign-in from a new device or network.',
    'inactive': "You haven't signed in for a while, so we'd like to confirm it's you.",
    'unknown-location': 'We noticed a sign-in from an unfamiliar location.',
  }
  const intro = copy[reason] || copy['new-device']

  const sendSmtpEmail = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to, name: name || to }],
    subject: 'Confirm it\'s you — NovaFlix login code',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #090909; color: #fff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #E50914; font-size: 28px; margin: 0;">NovaFlix</h1>
        </div>
        <h2 style="font-size: 20px; margin: 0 0 8px;">Confirm it's you</h2>
        <p style="color: #aaa; font-size: 14px; line-height: 1.6;">${intro} Use the code below to finish signing in.</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #E50914; background: #181818; padding: 12px 24px; border-radius: 8px; display: inline-block;">${code}</span>
        </div>
        <p style="color: #666; font-size: 12px;">This code expires in 15 minutes. If this wasn't you, change your password right away.</p>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">NovaFlix — Premium Streaming for Everyone</p>
      </div>
    `,
  }

  try {
    await client.sendTransacEmail(sendSmtpEmail)
    console.log(`[email] Login verification code sent to ${to} (${reason})`)
  } catch (err) {
    console.error('[email] Failed to send login verification:', err.message)
    throw err
  }
}

export async function sendWelcomeEmail(to, name) {
  const client = getClient()
  if (!client) {
    console.warn('[email] BREVO_API_KEY not set, skipping welcome email')
    return
  }

  const sendSmtpEmail = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to, name: name || to }],
    subject: 'Welcome to NovaFlix!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #090909; color: #fff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #E50914; font-size: 28px; margin: 0;">NovaFlix</h1>
        </div>
        <h2 style="font-size: 20px; margin: 0 0 8px;">Welcome to NovaFlix${name ? ', ' + name : ''}! 🎬</h2>
        <p style="color: #aaa; font-size: 14px; line-height: 1.6;">Your account is now verified. Start exploring thousands of movies, TV shows, and exclusive creator content.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}" style="display: inline-block; background: #E50914; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">Start Watching</a>
        </div>
        <div style="background: #111; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #fff; font-size: 13px; margin: 0 0 8px; font-weight: 600;">What's next?</p>
          <ul style="color: #aaa; font-size: 13px; line-height: 1.8; padding-left: 16px; margin: 0;">
            <li>Browse trending movies and TV shows</li>
            <li>Create your personal watchlist</li>
            <li>Join watch parties with friends</li>
            <li>Support your favorite creators</li>
          </ul>
        </div>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">NovaFlix — Premium Streaming for Everyone</p>
      </div>
    `,
  }

  try {
    await client.sendTransacEmail(sendSmtpEmail)
    console.log('[email] Welcome email sent to', to)
  } catch (err) {
    console.error('[email] Failed to send welcome:', err.message)
  }
}

export async function sendAnnouncementEmail(to, name, { title, body, link }) {
  const client = getClient()
  if (!client) {
    console.warn('[email] BREVO_API_KEY not set, skipping announcement email')
    return false
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const target = link ? (link.startsWith('http') ? link : `${appUrl}${link.startsWith('/') ? '' : '/'}${link}`) : appUrl

  const sendSmtpEmail = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to, name: name || to }],
    subject: title || 'NovaFlix Announcement',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #090909; color: #fff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #E50914; font-size: 28px; margin: 0;">NovaFlix</h1>
        </div>
        <h2 style="color: #fff; font-size: 20px; margin: 0 0 12px;">${title || 'Announcement'}</h2>
        <p style="color: #ccc; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${body || ''}</p>
        <a href="${target}" style="display: inline-block; background: #E50914; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">View on NovaFlix</a>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">
          <a href="${appUrl}/unsubscribe?email=${to}" style="color: #E50914;">Unsubscribe</a>
        </p>
      </div>
    `,
  }

  try {
    await client.sendTransacEmail(sendSmtpEmail)
    return true
  } catch (err) {
    console.error('[email] Failed to send announcement email:', err.message)
    return false
  }
}

export async function sendNewsletterEmail(to, name, subject, content) {  const client = getClient()
  if (!client) {
    console.warn('[email] BREVO_API_KEY not set, skipping newsletter')
    return
  }

  const sendSmtpEmail = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to, name: name || to }],
    subject: subject || 'NovaFlix Newsletter',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #090909; color: #fff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #E50914; font-size: 28px; margin: 0;">NovaFlix</h1>
        </div>
        ${content}
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/unsubscribe?email=${to}" style="color: #E50914;">Unsubscribe</a>
        </p>
      </div>
    `,
  }

  try {
    await client.sendTransacEmail(sendSmtpEmail)
    console.log('[email] Newsletter sent to', to)
  } catch (err) {
    console.error('[email] Failed to send newsletter:', err.message)
  }
}
