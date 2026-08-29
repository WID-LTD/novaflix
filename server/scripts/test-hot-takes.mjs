import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })
const secret = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').match(/^JWT_SECRET=(.*)$/m)[1]

const U1 = '48aeea13-ac62-4b83-9116-d72b521e609b' // probe account
const U2 = '31853d60-3d24-4a8c-b724-d6850547c1d8' // second account
const mk = (uid) => jwt.sign({ id: uid }, secret, { expiresIn: '1h' })
const BASE = 'http://127.0.0.1:3030/api'

let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`PASS: ${name}${detail ? ' -> ' + detail : ''}`) }
  else { fail++; console.log(`FAIL: ${name}${detail ? ' -> ' + detail : ''}`) }
}

const api = (uid) => async (p, opts = {}) => {
  const res = await fetch(`${BASE}${p}`, {
    ...opts,
    headers: { Authorization: `Bearer ${mk(uid)}`, ...(opts.headers || {}) },
  })
  let body = null
  try { body = await res.json() } catch {}
  return { status: res.status, body }
}
const u1 = api(U1)
const u2 = api(U2)

await new Promise(r => setTimeout(r, 1500))

// ---- 1. Create ----
const created = await u1('/hot-takes', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ movieTitle: 'The Dark Knight (2008)', title: 'Joker carried the entire movie.', noSpoilers: true }),
})
check('create hot take', created.status === 200 && created.body?.success === true && !!created.body?.topic?.id, JSON.stringify(created.body || {}).slice(0, 100))
check('movie_title stored', created.body?.topic?.movie_title === 'The Dark Knight (2008)')
check('category is hot-take', created.body?.topic?.category === 'hot-take')
const takeId = created.body?.topic?.id

// spoiler gate
const noConfirm = await u1('/hot-takes', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ movieTitle: 'X', title: 'spoiler take', noSpoilers: false }),
})
check('spoiler confirmation enforced', noConfirm.status === 400)

// ---- 2. List ----
const list = await u2('/hot-takes?sort=hot')
check('list includes new take', Array.isArray(list.body?.topics) && list.body.topics.some(t => t.id === takeId))
const listed = list.body.topics.find(t => t.id === takeId)
check('list carries stats block', listed?.stats && typeof listed.stats.agreePct === 'number')

// ---- 3. Voting math ----
const v1a = await u1(`/hot-takes/${takeId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: 1 }) })
check('agree vote -> agree=1 pct=100 lead=agree', v1a.body?.stats?.agree === 1 && v1a.body?.stats?.agreePct === 100 && v1a.body?.stats?.leadingSide === 'agree', JSON.stringify(v1a.body?.stats))
const v1b = await u1(`/hot-takes/${takeId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: 1 }) })
check('re-vote toggles off -> tied', v1b.body?.stats?.total === 0 && v1b.body?.myVote === 0, JSON.stringify(v1b.body?.stats))
const v1c = await u1(`/hot-takes/${takeId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: -1 }) })
check('disagree vote counts', v1c.body?.stats?.disagree === 1)

// switch sides mid-debate
const v2a = await u2(`/hot-takes/${takeId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: 1 }) })
check('second voter agree -> 1/1 tie pct=50', v2a.body?.stats?.agree === 1 && v2a.body?.stats?.disagree === 1 && v2a.body?.stats?.agreePct === 50 && v2a.body?.stats?.leadingSide === 'tied', JSON.stringify(v2a.body?.stats))

// ---- 4. Replies with stance ----
const r1 = await u1(`/hot-takes/${takeId}/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Take away Ledger and the third act falls flat.', stance: 'agree' }) })
check('reply posted with agree stance', r1.status === 200 && r1.body?.reply?.stance === 'agree')
const r2 = await u2(`/hot-takes/${takeId}/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Hard disagree — Zimmer and the practical stunts made it.', stance: 'disagree' }) })
check('disagree stance stored', r2.body?.reply?.stance === 'disagree')

const detail = await u2(`/hot-takes/${takeId}`)
check('detail returns topic+replies+myVote', detail.body?.topic?.id === takeId && Array.isArray(detail.body?.replies) && detail.body.replies.length === 2 && detail.body.topic?.myVote === 1)
check('detail stats consistent', detail.body?.topic?.stats?.total === 2)

// ---- 5. LIVE WebSocket broadcast ----
const wsLive = await new Promise((resolve) => {
  const ws = new WebSocket(`ws://127.0.0.1:3030/ws?token=${encodeURIComponent(mk(U2))}`)
  const events = []
  const timer = setTimeout(() => { try { ws.close() } catch {}; resolve(events) }, 12000)
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'topic-join', payload: { topicId: takeId } }))
    // give the join a beat, then fire a vote + a reply from user1
    setTimeout(async () => {
      await u1(`/hot-takes/${takeId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: 1 }) }) // U1 flips -1 -> +1 => agree=2 disagree=0 pct=100
      await u1(`/hot-takes/${takeId}/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Live wire check.', stance: 'agree' }) })
    }, 800)
  }
  ws.onmessage = (ev) => {
    try {
      const d = JSON.parse(ev.data)
      if (d.type === 'hot-take-vote' || d.type === 'topic-reply') events.push(d)
      if (events.length >= 2) { clearTimeout(timer); try { ws.close() } catch {}; resolve(events) }
    } catch {}
  }
  ws.onerror = () => { clearTimeout(timer); resolve(events) }
})
const voteEvt = wsLive.find(e => e.type === 'hot-take-vote')
const replyEvt = wsLive.find(e => e.type === 'topic-reply')
check('LIVE vote push received (room broadcast)', !!voteEvt && voteEvt.agree === 2 && voteEvt.disagree === 0 && voteEvt.agreePct === 100, voteEvt ? `agree=${voteEvt.agree} pct=${voteEvt.agreePct}` : 'none')
check('LIVE reply push received via topic room', !!replyEvt && replyEvt.reply?.content === 'Live wire check.')

// ---- 6. Stats endpoint sanity (U1 flipped to agree: 2 agree / 0 disagree) ----
const statsNow = await u2(`/hot-takes/${takeId}/stats`)
check('stats endpoint', statsNow.body?.stats?.total === 2 && statsNow.body?.stats?.agreePct === 100, JSON.stringify(statsNow.body?.stats))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
