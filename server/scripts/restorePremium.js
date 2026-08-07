import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { addSubscription, updateUser, createTransaction } from '../db.js'

const USER_ID = '210d0620-26c8-4822-8563-0384b45a0a1d'
const EMAIL = 'ikewisdom92@gmail.com'
const PASSWORD = 'wizzy1234'
const PLAN = 'premium'

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 10)

  const reference = `RESTORE-${uuidv4().split('-')[0]}-${Date.now()}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const tx = await createTransaction({
    userId: USER_ID,
    reference,
    type: 'subscription',
    plan: PLAN,
    amount: 5500,
    status: 'success',
    metadata: { gateway: 'manual-restore', note: 'DB was restored without payment records; plan restored manually' },
  })
  console.log('transaction:', tx.id, tx.reference)

  const sub = await addSubscription({
    id: uuidv4(),
    userId: USER_ID,
    plan: PLAN,
    active: true,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  })
  console.log('subscription:', sub.id, sub.startedAt, sub.expiresAt)

  const user = await updateUser(USER_ID, {
    plan: PLAN,
    email_verified: true,
    password: hashed,
  })
  console.log('user updated:', user.email, user.plan, user.email_verified)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
