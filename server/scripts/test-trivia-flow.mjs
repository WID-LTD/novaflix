// E2E: Daily Trivia flow against the running server.
// 1. GET /today -> assert >=20 questions across all 4 difficulty tiers
// 2. POST /submit (fail run) -> success (previously 500'd on missing index),
//    passed:false, coinsEarned:0, streak frozen
// 3. POST /submit repeat -> alreadyPlayed:true (proves ON CONFLICT target works)
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const API = 'http://localhost:3030/api'
const SECRET = process.env.JWT_SECRET
const USER_ID = '48aeea13-ac62-4b83-9116-d72b521e609b' // wsprobe2@test.com

if (!SECRET) { console.error('FAIL: JWT_SECRET missing'); process.exit(1) }
const token = jwt.sign({ id: USER_ID, email: 'wsprobe2@test.com', role: 'user', plan: 'free' }, SECRET, { expiresIn: '1h' })
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

let failures = 0
function check(name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' -> ' + detail : ''}`)
  if (!cond) failures++
}

// ---- streak before ----
const sBefore = await fetch(`${API}/trivia/streak`, { headers: H }).then(r => r.json())
console.log('streak before:', JSON.stringify(sBefore))

// ---- 1. today ----
const t = await fetch(`${API}/trivia/today`, { headers: H }).then(r => r.json())
check('today success', t.success === true, `total=${t.total}`)
check('at least 20 daily questions', Array.isArray(t.questions) && t.questions.length >= 20, `got ${t.questions?.length}`)
const tiers = {}
for (const q of t.questions || []) tiers[q.difficulty] = (tiers[q.difficulty] || 0) + 1
const hasAllTiers = ['easy', 'normal', 'hard', 'very_hard'].every(x => tiers[x] > 0)
check('all four difficulty tiers present', hasAllTiers, JSON.stringify(tiers))
const shuffled = (t.questions || []).some((q, i, arr) => i > 0 && q.difficulty !== arr[i - 1].difficulty)
check('difficulties shuffled (adjacent differ)', shuffled)

// ---- 2. fail-run submit ----
const answers = (t.questions || []).map(q => ({ id: q.id, answerIndex: 0 }))
const sub = await fetch(`${API}/trivia/submit`, { method: 'POST', headers: H, body: JSON.stringify({ answers }) }).then(r => r.json())
check('submit succeeds (index fix works)', sub.success === true, sub.error ? `error=${sub.error}` : '')
if (sub.success) {
  const pct = Math.round((100 * sub.score) / Math.max(1, sub.total))
  check('passed flag boolean', typeof sub.passed === 'boolean', `score=${sub.score}/${sub.total} (${pct}%) passed=${sub.passed}`)
  if (sub.alreadyPlayed) {
    // Day already consumed by an earlier run — server replays stored results
    // with zero coins; fresh-day crediting is covered by test-trivia-coins.mjs.
    console.log('INFO: already played today, skipping reward assertions')
  } else if (sub.passed === false) {
    check('no coins on fail', sub.coinsEarned === 0, `coinsEarned=${sub.coinsEarned}`)
    check('streak frozen on fail', sub.streak === (sBefore.streak || 0), `${sBefore.streak || 0} -> ${sub.streak}`)
  } else {
    // Fresh passing run: exactly 2 coins per correct answer.
    check('pass awards 2 coins per correct answer', sub.coinsEarned === sub.score * 2, `score=${sub.score} coinsEarned=${sub.coinsEarned}`)
  }
  check('results enriched with difficulty', Array.isArray(sub.results) && sub.results.every(r => typeof r.difficulty === 'string'), '')
}

// ---- 3. repeat submit ----
const sub2 = await fetch(`${API}/trivia/submit`, { method: 'POST', headers: H, body: JSON.stringify({ answers }) }).then(r => r.json())
check('repeat submit alreadyPlayed', sub2.success === true && sub2.alreadyPlayed === true, `alreadyPlayed=${sub2.alreadyPlayed}`)
check('repeat passes verdict too', typeof sub2.passed === 'boolean', `passed=${sub2.passed}`)

console.log(failures === 0 ? '\nALL TRIVIA CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
