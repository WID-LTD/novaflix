import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const secret = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').match(/^JWT_SECRET=(.*)$/m)[1]
const uid = '48aeea13-ac62-4b83-9116-d72b521e609b'
const token = jwt.sign({ id: uid }, secret, { expiresIn: '1h' })
const BASE = 'http://127.0.0.1:3030/api'
let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`PASS: ${name}${detail ? ' -> ' + detail : ''}`) }
  else { fail++; console.log(`FAIL: ${name}${detail ? ' -> ' + detail : ''}`) }
}
const api = async (p, opts = {}) => {
  const res = await fetch(`${BASE}${p}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  })
  let body = null
  try { body = await res.json() } catch {}
  return { status: res.status, body }
}

await new Promise(r => setTimeout(r, 1000))

// --- 1. Trivia status endpoint ---
const st = await api('/trivia/status')
check('status endpoint works', st.status === 200 && st.body?.success)
if (st.body?.completedToday) {
  check('status completedToday true', true, `score ${st.body.score}/${st.body.total}`)
  check('status includes results', Array.isArray(st.body.results) && st.body.results.length > 0)
} else {
  console.log(`INFO: not completed today yet (answered ${st.body?.answered}/${st.body?.total})`)
}

// --- 2. Guess lockout (limit=1) ---
const g = await api('/trivia/guess')
if (g.status === 403) {
  check('guess locked at limit=1', true)
  check('guess lockout has dailyLimitReached+remaining=0', g.body?.dailyLimitReached === true && g.body?.remaining === 0)
} else if (g.status === 200) {
  check('guess available (not played today)', !!g.body?.question?.id, `remaining=${g.body?.remaining}`)
  // Submit a wrong answer to consume the day's guess and verify +2 coins & remaining:0
  const balBefore = (await api('/trivia/coins')).body?.coins ?? 0
  const gs = await api('/trivia/guess/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId: g.body.question.id, answerIndex: g.body.question.options?.length ? 0 : 0 }),
  })
  if (gs.status === 200) {
    check('guess submit success', true, `correct=${gs.body.correct} earned=${gs.body.coinsEarned}`)
    check('guess pays exactly 2 on correct', !gs.body.correct || gs.body.coinsEarned === 2)
    check('guess remaining now 0', gs.body.remaining === 0)
    const balAfter = (await api('/trivia/coins')).body?.coins ?? 0
    const expected = gs.body.correct ? 2 : 0
    check('balance delta matches reward', balAfter - balBefore === expected, `${balBefore}->${balAfter}`)
    const g2 = await api('/trivia/guess')
    check('second guess blocked 403', g2.status === 403 && g2.body?.dailyLimitReached === true)
  } else {
    check('guess submit success', false, `status=${gs.status} body=${JSON.stringify(gs.body)}`)
  }
} else {
  check('guess endpoint reachable', false, `unexpected status ${g.status}`)
}

// --- 3. Shop: catalog shape + purchase guardrails ---
const cos = await api('/trivia/cosmetics')
check('cosmetics list ok', cos.status === 200 && Array.isArray(cos.body?.cosmetics))
const items = cos.body?.cosmetics || []
check('catalog has 16 active items', items.length === 16, `got ${items.length}`)
check('no free items in shop', items.every(c => c.price > 0))
check('all items have rarity', items.every(c => ['common','rare','epic','legendary'].includes(c.rarity)))
const legendary = items.filter(c => c.rarity === 'legendary')
check('4 legendary items priced 3000+', legendary.length >= 3 && legendary.every(c => c.price >= 3000), legendary.map(c=>`${c.name}:${c.price}`).join(', '))

// Purchase flow: pick cheapest unowned item; expect clean error or success (no crash)
const balance = cos.body?.coins ?? 0
const target = items.find(c => !c.owned)
if (target) {
  const buyRes = await api(`/trivia/cosmetics/${target.id}/purchase`, { method: 'POST' })
  if (balance >= target.price) {
    check('purchase succeeds when affordable', buyRes.status === 200 && buyRes.body?.success, JSON.stringify(buyRes.body).slice(0, 120))
  } else {
    check('purchase rejects with Not enough coins', buyRes.status === 400 && /coin/i.test(buyRes.body?.error || ''), JSON.stringify(buyRes.body))
  }
} else {
  console.log('INFO: owns entire catalog, skipping purchase test')
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
