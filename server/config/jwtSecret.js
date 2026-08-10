const PLACEHOLDER = 'novaflix-secret-key-change-in-production'

export function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === PLACEHOLDER || secret.length < 32) {
    console.error('\x1b[31m[JWT] ERROR: JWT_SECRET must be set to a strong secret (>= 32 chars) in production.\x1b[0m')
    console.error('\x1b[31m[JWT] Using a weak or default secret makes authentication tokens forgeable.\x1b[0m')
  }
  return secret || PLACEHOLDER
}
