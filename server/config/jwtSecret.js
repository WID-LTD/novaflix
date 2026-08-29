const PLACEHOLDER = 'novaflix-secret-key-change-in-production'

export function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === PLACEHOLDER || secret.length < 32) {
    console.error('\x1b[31m[FATAL] JWT_SECRET must be set to a strong secret (>= 32 chars).\x1b[0m')
    console.error('\x1b[31m[FATAL] Using a weak or default secret makes authentication tokens forgeable.\x1b[0m')
    console.error('\x1b[31m[FATAL] Set JWT_SECRET in your .env file and restart the server.\x1b[0m')
    process.exit(1)
  }
  return secret
}
