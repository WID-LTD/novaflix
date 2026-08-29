import jwt from 'jsonwebtoken'
import { WebSocket } from 'ws'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const API = 'http://localhost:3030/api'
const SECRET = process.env.JWT_SECRET

const CREATOR_ID  = 'a338abb0-da7a-480c-aa12-5186602cf3a8' // Jackie Chan (seed creator)
const FOLLOWER_ID = '48aeea13-ac62-4b83-9116-d72b521e609b' // wsprobe2@test.com (registered this session)

if (!SECRET) {
  console.error('FAIL: JWT_SECRET missing from server/.env')
  process.exit(1)
}

function mint(id, email, role, plan) {
  return jwt.sign({ id, email, role, plan }, SECRET, { expiresIn: '1h' })
}

const followerToken = mint(FOLLOWER_ID, 'wsprobe2@test.com', 'user', 'free')
const creatorToken  = mint(CREATOR_ID, 'seed-creator@test.com', 'creator', 'premium')

const meA = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${followerToken}` } }).then(r => r.json())
const meB = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${creatorToken}` } }).then(r => r.json())
console.log('follower /auth/me:', meA.success ? 'OK id=' + meA.user.id : 'FAIL: ' + JSON.stringify(meA))
console.log('creator  /auth/me:', meB.success ? 'OK id=' + meB.user.id : 'FAIL: ' + JSON.stringify(meB))
if (!meA.success || !meB.success) process.exit(1)

const wait = (ms) => new Promise(r => setTimeout(r, ms))
const frames = []
const ws = new WebSocket(`ws://localhost:3030/ws?token=${followerToken}`)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
  setTimeout(() => reject(new Error('ws timeout')), 8000)
})
ws.onmessage = (ev) => { try { frames.push(JSON.parse(ev.data)) } catch {} }
console.log('PASS: follower WS connected')
await wait(500)

// Ensure clean: double-toggle (unfollow if already following)
await fetch(`${API}/interactions/follow`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${followerToken}` },
  body: JSON.stringify({ followingId: CREATOR_ID }),
})
await wait(300)

const beforeLen = frames.length
const followRes = await fetch(`${API}/interactions/follow`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${followerToken}` },
  body: JSON.stringify({ followingId: CREATOR_ID }),
}).then(r => r.json())

console.log('follow HTTP response:', JSON.stringify(followRes))
await wait(1200)

const followFrames = frames.filter(f => f.type === 'follow' && f.contentType === 'creator' && f.contentId === CREATOR_ID)
if (followFrames.length > 0 && typeof followFrames[0].followers_count === 'number') {
  console.log('PASS: live follow broadcast received ->', JSON.stringify(followFrames[0]))
} else {
  console.log('FAIL: no follow broadcast. all frames:', JSON.stringify(frames.slice(beforeLen)).slice(0, 600))
}

// Cleanup
await fetch(`${API}/interactions/follow`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${followerToken}` },
  body: JSON.stringify({ followingId: CREATOR_ID }),
})
await wait(500)
ws.close()
process.exit(0)
