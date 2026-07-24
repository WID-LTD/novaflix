import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import * as db from '../db.js'

async function seedCreatorTest() {
  const email = 'creator@test.com'
  const existing = await db.findUserByEmail(email)
  if (existing) {
    console.log('Creator test account already exists. Skipping.')
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash('creator123', 10)
  const user = await db.createUser({
    id: uuidv4(),
    email,
    password: hashedPassword,
    name: 'Test Creator',
    role: 'creator',
    plan: 'premium',
    avatar: null,
    bio: 'I am a test creator account for NovaFlix development.',
    email_verified: true,
  })

  console.log('Created test creator account:')
  console.log('  Email:    ' + user.email)
  console.log('  Password: creator123')
  console.log('  Role:     ' + user.role)
  console.log('  Plan:     ' + user.plan)
  process.exit(0)
}

seedCreatorTest().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
