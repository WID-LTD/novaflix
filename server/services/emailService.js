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

export async function sendNewsletterEmail(to, name, subject, content) {
  const client = getClient()
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
