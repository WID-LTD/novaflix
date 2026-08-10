import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') })
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { createUser, findUserByEmail } from '../db.js'
import { resolveJwtSecret } from '../config/jwtSecret.js'

// The db module's pool initializes asynchronously.
await new Promise((r) => setTimeout(r, 2500))

const email = process.argv[2] || `test-creator-${Date.now()}@novaflix.dev`
const password = process.argv[3] || 'TestPass123!'

let user = await findUserByEmail(email)
if (!user) {
  const hashed = await (await import('bcryptjs')).hash(password, 10)
  user = {
    id: uuidv4(),
    email,
    name: 'Test Creator',
    password: hashed,
    role: 'creator',
    plan: 'premium',
    avatar: null,
    bio: '',
    email_verified: true,
  }
  await createUser(user)
}

const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role, plan: user.plan },
  resolveJwtSecret()
)
console.log(JSON.stringify({ email, userId: user.id, token }))