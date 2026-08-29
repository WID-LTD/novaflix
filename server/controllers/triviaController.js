import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database.js'
import * as db from '../db.js'
import { broadcastFeed, notifyUser } from '../services/realtime.js'
import { pickFromBank } from '../lib/triviaBank.js'

const MIN_DAILY_QUESTIONS = 20   // guaranteed daily set size floor
const TARGET_DAILY_QUESTIONS = 24
const PASS_THRESHOLD = 0.7       // >= 70% correct => pass (green check); below = fail, no coins
const COINS_PER_ANSWER = 2       // flat reward for every correct answer (trivia + guess)
const GUESS_DAILY_LIMIT = 1      // one movie guess per UTC day, resets at midnight like trivia

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function stripAnswer(q) {
  const { answer_index, answer_text, ...rest } = q
  return rest
}

function yearOpts(baseYear, spread) {
  // Deterministic build — NEVER rejection-sample against a Set here: a narrow
  // spread like [-1, 1] can only ever yield 3 distinct years, so a
  // "while (size < 4)" draw loop would spin forever and freeze the event loop.
  const opts = new Set([baseYear])
  for (const offset of shuffle([...spread])) {
    if (opts.size >= 4) break
    opts.add(baseYear + offset)
  }
  let k = 2
  while (opts.size < 4) {
    opts.add(baseYear + (k % 2 === 0 ? k : -k))
    k++
  }
  return shuffle([...opts])
}

async function generateDaily(tmdb, key) {
  const sources = []
  try {
    const { data } = await tmdb.get('/trending/movie/week', { params: { language: 'en-US' } })
    sources.push(...(data.results || []))
  } catch {}
  try {
    const { data } = await tmdb.get('/movie/popular', { params: { language: 'en-US', page: 1 } })
    sources.push(...(data.results || []))
  } catch {}
  try {
    const { data } = await tmdb.get('/movie/popular', { params: { language: 'en-US', page: 2 } })
    sources.push(...(data.results || []))
  } catch {}

  const seen = new Set()
  const movies = []
  for (const m of sources) {
    if (!seen.has(m.id) && m.poster_path && m.title) {
      seen.add(m.id)
      movies.push(m)
    }
  }
  if (!movies.length) return []

  const withYear = movies.filter((m) => m.release_date && parseInt(m.release_date.split('-')[0]))
  const withPlot = movies.filter((m) => m.overview && m.overview.length > 60)
  const questions = []

  const addYear = (m, difficulty, spread) => {
    const y = parseInt(m.release_date.split('-')[0])
    const opts = yearOpts(y, spread)
    questions.push({
      game_type: 'trivia',
      date_key: key,
      question: `In what year was "${m.title}" released?`,
      options: opts.map((o) => String(o)),
      answer_index: opts.indexOf(y),
      answer_text: String(y),
      movie_id: m.id,
      movie_title: m.title,
      difficulty,
      image_url: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
    })
  }

  const addPlot = (m, distractors, difficulty) => {
    const opts = shuffle([m, ...distractors])
    const overview = (m.overview || '').slice(0, 140)
    questions.push({
      game_type: 'trivia',
      date_key: key,
      question: `Which film's plot is described here? "...${overview}..."`,
      options: opts.map((o) => o.title),
      answer_index: opts.findIndex((o) => o.id === m.id),
      answer_text: m.title,
      movie_id: m.id,
      movie_title: m.title,
      difficulty,
      image_url: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
    })
  }

  const addNewest = (pool, difficulty) => {
    const sorted = [...pool].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    const newest = sorted[0]
    const opts = shuffle(sorted.slice(0, 4))
    questions.push({
      game_type: 'trivia',
      date_key: key,
      question: 'Which of these films was released most recently?',
      options: opts.map((o) => o.title),
      answer_index: opts.findIndex((o) => o.id === newest.id),
      answer_text: newest.title,
      movie_id: newest.id,
      movie_title: newest.title,
      difficulty,
      image_url: `https://image.tmdb.org/t/p/w500${newest.poster_path}`,
    })
  }

  const top = withYear.slice(0, 12)
  const mid = withYear.slice(12, 30)
  const deep = withYear.slice(30)

  const EASY_YEAR_SPREAD = [1, -2, 3, -4, 5, -6]
  const HARD_YEAR_SPREAD = [-1, 1, -2, 2]
  const VERY_HARD_YEAR_SPREAD = [-1, 1]

  for (let i = 0; i < Math.min(6, top.length); i++) {
    addYear(top[i], 'easy', EASY_YEAR_SPREAD)
  }
  for (let i = 0; i < Math.min(6, mid.length); i++) {
    addYear(mid[i], 'hard', HARD_YEAR_SPREAD)
  }
  for (let i = 0; i < Math.min(6, deep.length); i++) {
    addYear(deep[i], 'very_hard', VERY_HARD_YEAR_SPREAD)
  }

  const plotTop = withPlot.slice(0, 12)
  const plotMid = withPlot.slice(12, 30)
  const plotDeep = withPlot.slice(30)

  for (let i = 0; i < Math.min(6, plotTop.length); i++) {
    const distractors = shuffle(plotTop.filter((_, idx) => idx !== i)).slice(0, 3)
    addPlot(plotTop[i], distractors, 'normal')
  }
  for (let i = 0; i < Math.min(6, plotMid.length); i++) {
    const distractors = shuffle(plotMid.filter((_, idx) => idx !== i)).slice(0, 3)
    addPlot(plotMid[i], distractors, 'hard')
  }
  for (let i = 0; i < Math.min(6, plotDeep.length); i++) {
    const distractors = shuffle(plotDeep.filter((_, idx) => idx !== i)).slice(0, 3)
    addPlot(plotDeep[i], distractors, 'very_hard')
  }

  const newestPool = withYear.slice(0, 20)
  for (let i = 0; i < 6; i++) {
    const batch = shuffle(newestPool).slice(0, 4)
    const sorted = [...batch].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    const newest = sorted[0]
    const opts = shuffle(sorted)
    const baseYear = parseInt(newest.release_date.split('-')[0])
    const isVeryHard = sorted.slice(1).some(m => Math.abs(parseInt(m.release_date.split('-')[0]) - baseYear) <= 1)
    questions.push({
      game_type: 'trivia',
      date_key: key,
      question: 'Which of these films was released most recently?',
      options: opts.map((o) => o.title),
      answer_index: opts.findIndex((o) => o.id === newest.id),
      answer_text: newest.title,
      movie_id: newest.id,
      movie_title: newest.title,
      difficulty: isVeryHard ? 'very_hard' : 'normal',
      image_url: `https://image.tmdb.org/t/p/w500${newest.poster_path}`,
    })
  }

  // Balanced difficulty mix: round-robin across easy/normal/hard/very_hard
  // so every daily set spans all four tiers, then shuffle presentation order.
  const tiers = ['easy', 'normal', 'hard', 'very_hard']
  const pools = {}
  for (const t of tiers) {
    pools[t] = shuffle(questions.filter((q) => q.difficulty === t))
  }
  const balanced = []
  let drained = false
  while (balanced.length < TARGET_DAILY_QUESTIONS && !drained) {
    drained = true
    for (const t of tiers) {
      const next = pools[t].shift()
      if (next) {
        balanced.push(next)
        drained = false
        if (balanced.length >= TARGET_DAILY_QUESTIONS) break
      }
    }
  }
  return shuffle(balanced)
}

export async function today(req, res) {
  try {
    const key = dateKey()
    console.log(`[trivia] today start ${key} u:${req.userId}`)
    let questions = await db.getTriviaForDate(key)
    console.log(`[trivia] existing rows: ${questions.length}`)
    if (!questions.length) {
      const t0 = Date.now()
      const generated = await Promise.race([
        generateDaily(req.app.locals.tmdb, key),
        new Promise((resolve) => setTimeout(() => resolve([]), 25000)),
      ])
      console.log(`[trivia] generated ${generated.length} in ${Date.now() - t0}ms`)
      for (const q of generated) await db.insertTriviaQuestion(q)
      questions = await db.getTriviaForDate(key)
      console.log(`[trivia] rows after insert: ${questions.length}`)
    }
    // Daily guarantee: never serve fewer than MIN_DAILY_QUESTIONS. Top up
    // deterministically from the static bank when TMDB ran short or failed.
    if (questions.length < MIN_DAILY_QUESTIONS) {
      const have = new Set(questions.map((q) => q.question))
      const need = MIN_DAILY_QUESTIONS - questions.length
      console.log(`[trivia] bank top-up need=${need}`)
      for (const bq of pickFromBank(key, need)) {
        if (!have.has(bq.question)) {
          await db.insertTriviaQuestion({ ...bq, game_type: 'trivia', date_key: key })
          have.add(bq.question)
        }
      }
      questions = await db.getTriviaForDate(key)
      console.log(`[trivia] rows after top-up: ${questions.length}`)
    }
    // Scope attempts to the UTC trivia day explicitly (not DB-session CURRENT_DATE).
    const attempts = await db.pool.query(
      `SELECT question_id, correct FROM trivia_attempts WHERE user_id = $1 AND game_type = 'trivia' AND answered_at::date = $2::date`,
      [req.userId, key]
    )
    const answeredMap = {}
    let score = 0
    for (const a of attempts.rows) {
      answeredMap[a.question_id] = a.correct
      if (a.correct) score++
    }
    res.json({
      success: true,
      date: key,
      passThreshold: PASS_THRESHOLD,
      questions: questions.map((q) => ({
        ...stripAnswer(q),
        answered: q.id in answeredMap,
        correct: q.id in answeredMap ? answeredMap[q.id] : null,
      })),
      score,
      total: questions.length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/trivia/status — lets the client restore the "already played today"
// state on page load instead of forcing a full submit to discover it.
export async function status(req, res) {
  try {
    const key = dateKey()
    const attempts = await db.pool.query(
      `SELECT ta.question_id, ta.correct, q.question, q.difficulty
       FROM trivia_attempts ta
       LEFT JOIN trivia_questions q ON q.id = ta.question_id
       WHERE ta.user_id = $1 AND ta.game_type = 'trivia' AND ta.answered_at::date = $2::date`,
      [req.userId, key]
    )
    const totalQ = await db.pool.query(
      `SELECT count(*)::int AS n FROM trivia_questions WHERE game_type = 'trivia' AND date_key = $1`,
      [key]
    )
    const answered = attempts.rows.length
    const total = totalQ.rows[0]?.n || 0

    // Completed only when every question in today's set was attempted.
    if (total > 0 && answered >= total) {
      let score = 0
      for (const r of attempts.rows) if (r.correct) score++
      const streakRow = await db.pool.query(`SELECT streak FROM trivia_streaks WHERE user_id = $1`, [req.userId])
      return res.json({
        success: true,
        completedToday: true,
        score,
        total,
        passed: score / total >= PASS_THRESHOLD,
        passThreshold: PASS_THRESHOLD,
        streak: Number(streakRow.rows[0]?.streak ?? 0) || 0,
        results: attempts.rows.map((r) => ({
          id: r.question_id,
          correct: !!r.correct,
          alreadyAnswered: true,
          difficulty: r.difficulty || 'normal',
          question: r.question,
        })),
      })
    }

    res.json({ success: true, completedToday: false, answered, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function submitDaily(req, res) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { answers } = req.body
    if (!Array.isArray(answers) || !answers.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'answers required' })
    }

    const key = dateKey()
    let correctCount = 0
    let coins = 0
    let xp = 0
    const results = []
    let insertedCount = 0

    for (const a of answers) {
      const q = await db.getTriviaQuestion(a.id)
      if (!q) {
        results.push({ id: a.id, correct: false, alreadyAnswered: true })
        continue
      }

      const isCorrect = q.answer_index === a.answerIndex
      const points = isCorrect ? COINS_PER_ANSWER : 0

      const attemptResult = await client.query(
        `INSERT INTO trivia_attempts (id, user_id, question_id, game_type, correct, points_awarded, answered_at)
         VALUES (gen_random_uuid(), $1, $2, 'trivia',
                 CASE WHEN $3 THEN TRUE ELSE FALSE END,
                 CASE WHEN $3 THEN $4 ELSE 0 END,
                 NOW())
         ON CONFLICT (user_id, question_id, (answered_at::date)) DO NOTHING`,
        [req.userId, a.id, isCorrect, points]
      )

      if (attemptResult.rowCount === 0) {
        results.push({ id: a.id, correct: isCorrect, alreadyAnswered: true })
        continue
      }

      insertedCount++
      if (isCorrect) {
        correctCount++
        coins += points
        xp += Math.ceil(points / 5)
      }
      results.push({
        id: a.id,
        correct: isCorrect,
        alreadyAnswered: false,
        difficulty: q.difficulty || 'normal',
        question: q.question,
        pointsAwarded: points,
      })
    }

    // Pass/fail verdict drives rewards: below threshold => no coins, no XP,
    // streak frozen (updateTriviaStreak preserves values when passed=false).
    const passed = answers.length > 0 && (correctCount / answers.length) >= PASS_THRESHOLD

    if (passed && coins > 0) {
      await db.addCoins(req.userId, coins)
      const { addXp } = await import('../db.js')
      addXp(req.userId, xp).catch(() => {})
    }
    if (!passed) coins = 0

    // Streak advances only on a passing day; freezes on fail (never resets here).
    // updateTriviaStreak RETURNING * gives the full row — ship the bare number.
    const streakRow = await db.updateTriviaStreak(req.userId, key, passed)
    const streak = Number(streakRow?.streak ?? 0) || 0
    const newBalance = await db.getCoins(req.userId)

    await client.query('COMMIT')

    notifyUser(req.userId, { type: 'coins:update', coins: newBalance })

    try {
      broadcastFeed({ type: 'trivia:score', userId: req.userId, score: correctCount, coinsEarned: coins, streak, passed })
      const leaderboard = await db.getTriviaLeaderboard(20)
      broadcastFeed({ type: 'trivia:leaderboard', leaderboard })
    } catch {}

    if (insertedCount === 0 && answers.length > 0) {
      const attemptRows = await db.pool.query(
        `SELECT ta.question_id, ta.correct, q.question, q.difficulty
         FROM trivia_attempts ta
         LEFT JOIN trivia_questions q ON q.id = ta.question_id
         WHERE ta.user_id = $1 AND ta.game_type = 'trivia' AND ta.answered_at::date = $2::date AND ta.question_id = ANY($3)`,
        [req.userId, key, answers.map(a => a.id)]
      )
      let existingScore = 0
      for (const r of attemptRows.rows) {
        if (r.correct) existingScore++
      }
      return res.json({
        success: true,
        score: existingScore,
        total: answers.length,
        passed: answers.length > 0 && (existingScore / answers.length) >= PASS_THRESHOLD,
        passThreshold: PASS_THRESHOLD,
        coinsEarned: 0,
        coins: newBalance,
        streak,
        alreadyPlayed: true,
        results: answers.map(a => {
          const found = attemptRows.rows.find(r => r.question_id === a.id)
          return {
            id: a.id,
            correct: !!found?.correct,
            alreadyAnswered: true,
            difficulty: found?.difficulty || 'normal',
            question: found?.question,
          }
        }),
      })
    }

    res.json({
      success: true,
      score: correctCount,
      total: answers.length,
      passed,
      passThreshold: PASS_THRESHOLD,
      coinsEarned: coins,
      coins: newBalance,
      streak,
      alreadyPlayed: false,
      results,
    })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[trivia] submitDaily failed:', err.stack || err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

export async function streak(req, res) {
  try {
    const s = await db.getTriviaStreak(req.userId)
    res.json({ success: true, ...s })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function leaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50)
    const rows = await db.getTriviaLeaderboard(limit)
    res.json({ success: true, leaderboard: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function guess(req, res) {
  try {
    // Daily limit first: once the day's guess is spent, reloads must see the
    // lockout (403), never the 30s rate limiter (429).
    const todayAttempts = await pool.query(
      `SELECT count(*) FROM trivia_attempts
       WHERE user_id = $1 AND game_type = 'guess' AND answered_at::date = CURRENT_DATE`,
      [req.userId]
    )
    const attemptsToday = parseInt(todayAttempts.rows[0].count, 10)
    if (attemptsToday >= GUESS_DAILY_LIMIT) {
      return res.status(403).json({
        error: 'Daily guess limit reached — come back tomorrow',
        dailyLimitReached: true,
        alreadyPlayed: true,
        remaining: 0,
      })
    }

    const recentGuess = await pool.query(
      `SELECT 1 FROM trivia_attempts
       WHERE user_id = $1 AND game_type = 'guess'
       AND answered_at > NOW() - INTERVAL '30 seconds'
       LIMIT 1`,
      [req.userId]
    )
    if (recentGuess.rows.length > 0) {
      return res.status(429).json({ error: 'Too many requests. Please wait before guessing again.' })
    }

    const tmdb = req.app.locals.tmdb
    let results = []
    try {
      const { data } = await tmdb.get('/movie/popular', { params: { language: 'en-US', page: 1 + Math.floor(Math.random() * 3) } })
      results = data.results || []
    } catch {
      const { data } = await tmdb.get('/trending/movie/week', { params: { language: 'en-US' } })
      results = data.results || []
    }
    const candidates = results.filter((m) => m.poster_path && m.title)
    if (!candidates.length) return res.status(503).json({ error: 'No movies available' })

    const shuffled = shuffle(candidates)
    const target = shuffled[0]
    const others = shuffle(candidates.slice(1, 7)).slice(0, 3)
    const opts = shuffle([target, ...others])
    const clue = (target.overview || '').slice(0, 120)

    let q = await pool.query(
      `SELECT * FROM trivia_questions
       WHERE game_type = 'guess' AND created_at > NOW() - INTERVAL '5 minutes'
       ORDER BY created_at DESC LIMIT 1`
    )

    if (!q.rows.length) {
      q = await db.insertTriviaQuestion({
        game_type: 'guess',
        date_key: null,
        question: 'Guess the movie from the blurred frame',
        options: opts.map((o) => o.title),
        answer_index: opts.findIndex((o) => o.id === target.id),
        answer_text: target.title,
        movie_id: target.id,
        movie_title: target.title,
        difficulty: 'medium',
        clue,
        image_url: target.poster_path ? `https://image.tmdb.org/t/p/w500${target.poster_path}` : null,
      })
    } else {
      q = q.rows[0]
    }

    res.json({
      success: true,
      question: {
        id: q.id,
        game_type: 'guess',
        clue: q.clue,
        image_url: q.image_url,
        options: q.options,
      },
      remaining: GUESS_DAILY_LIMIT - attemptsToday,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function submitGuess(req, res) {
  try {
    const { questionId, answerIndex } = req.body
    if (!questionId) return res.status(400).json({ error: 'questionId required' })
    if (typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex > 3) {
      return res.status(400).json({ error: 'Invalid answer index' })
    }

    const q = await db.getTriviaQuestion(questionId)
    if (!q || q.game_type !== 'guess') return res.status(404).json({ error: 'Question not found' })

    // Daily limit before the cooldown so a spent day always reports 403.
    const todayAttempts = await pool.query(
      `SELECT count(*) FROM trivia_attempts
       WHERE user_id = $1 AND game_type = 'guess' AND answered_at::date = CURRENT_DATE`,
      [req.userId]
    )
    const attemptsToday = parseInt(todayAttempts.rows[0].count, 10)
    if (attemptsToday >= GUESS_DAILY_LIMIT) {
      return res.status(403).json({
        error: 'Daily guess limit reached — come back tomorrow',
        dailyLimitReached: true,
        alreadyPlayed: true,
        remaining: 0,
      })
    }

    const recentGuess = await pool.query(
      `SELECT 1 FROM trivia_attempts
       WHERE user_id = $1 AND game_type = 'guess'
       AND answered_at > NOW() - INTERVAL '30 seconds'
       LIMIT 1`,
      [req.userId]
    )
    if (recentGuess.rows.length > 0) {
      return res.status(429).json({ error: 'Too many requests. Please wait before guessing again.', retryAfter: 30 })
    }

    const existing = await pool.query(
      `SELECT 1 FROM trivia_attempts WHERE user_id = $1 AND question_id = $2 LIMIT 1`,
      [req.userId, questionId]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already guessed this question' })
    }

    const correct = q.answer_index === answerIndex
    const points = correct ? COINS_PER_ANSWER : 0

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query(
        `INSERT INTO trivia_attempts (id, user_id, question_id, game_type, correct, points_awarded, answered_at)
         VALUES (gen_random_uuid(), $1, $2, 'guess', $3, $4, NOW())
         ON CONFLICT DO NOTHING`,
        [req.userId, questionId, correct, points]
      )

      if (correct) {
        await db.addCoins(req.userId, points)
        const { addXp } = await import('../db.js')
        addXp(req.userId, 1).catch(() => {})
      }

      await client.query('COMMIT')

      const newBalance = await db.getCoins(req.userId)
      notifyUser(req.userId, { type: 'coins:update', coins: newBalance })

      try {
        broadcastFeed({ type: 'trivia:guess', userId: req.userId, correct, coinsEarned: points })
      } catch {}

      res.json({
        success: true,
        correct,
        answer: q.answer_text,
        coinsEarned: points,
        coins: newBalance,
        remaining: Math.max(0, GUESS_DAILY_LIMIT - attemptsToday - 1),
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function coins(req, res) {
  try {
    res.json({ success: true, coins: await db.getCoins(req.userId) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function listCosmetics(req, res) {
  try {
    const catalog = await db.getCosmeticsCatalog()
    const owned = await db.getUserCosmetics(req.userId)
    const ownedMap = {}
    for (const o of owned) ownedMap[o.id] = o
    const out = catalog.map((c) => ({ ...c, owned: !!ownedMap[c.id], equipped: ownedMap[c.id]?.equipped || false }))
    res.json({ success: true, cosmetics: out, coins: await db.getCoins(req.userId) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function purchase(req, res) {
  try {
    const result = await db.purchaseCosmetic(req.userId, req.params.id)
    if (result.error) return res.status(400).json({ error: result.error })
    const newBalance = await db.getCoins(req.userId)
    notifyUser(req.userId, { type: 'coins:update', coins: newBalance })
    notifyUser(req.userId, { type: 'cosmetics:update' })
    res.json({ success: true, cosmetic: result.cosmetic, coins: newBalance })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function equip(req, res) {
  try {
    const { equipped } = req.body
    const result = await db.equipCosmetic(req.userId, req.params.id, !!equipped)
    if (result.success) {
      notifyUser(req.userId, { type: 'cosmetics:update' })
    }
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function seedCatalog(req, res) {
  try {
    // Easter-egg badges are granted programmatically via digital keys — never sold.
    await db.pool.query(`UPDATE cosmetics SET active = FALSE WHERE price = 0`)

    // Economy: ~42 coins/day max (20 trivia + 1 guess, all correct at 2 coins each).
    // Tiers are tuned so top items take months of consistent play to unlock.
    const items = [
      // [name, kind, description, price, icon, rarity]
      ['Rising Star', 'badge', 'Every legend starts somewhere', 120, '✨', 'common'],
      ['Popcorn Fan', 'badge', 'For the true movie night regulars', 150, '🍿', 'common'],
      ['Movie Buff', 'badge', 'You know your classics', 180, '🎬', 'common'],
      ['Night Owl', 'badge', 'For late night watchers', 240, '🦉', 'common'],
      ['Scene Stealer', 'title', 'Impossible to ignore', 300, '🎭', 'rare'],
      ['Plot Genius', 'badge', 'For trivia champions', 500, '🧠', 'rare'],
      ['Horror Scholar', 'title', 'For the brave', 600, '🧛', 'rare'],
      ['Action Hero', 'badge', 'Explosions and one-liners', 700, '💥', 'rare'],
      ['Neon Frame', 'avatar_frame', 'A glowing neon avatar frame', 1200, '🖼️', 'epic'],
      ['Silver Screen', 'title', 'Classic Hollywood glamour', 1500, '🎞️', 'epic'],
      ['Gold Frame', 'avatar_frame', 'Premium gold avatar frame', 1800, '🪙', 'epic'],
      ["Director's Cut", 'title', 'The vision behind the camera', 2000, '🎬', 'epic'],
      ['Crystal Frame', 'avatar_frame', 'Fractured light, pure prestige', 3000, '🔮', 'legendary'],
      ['Trivia Titan', 'badge', 'Conquered a hundred quizzes', 4000, '🏆', 'legendary'],
      ['Oscar Worthy', 'title', 'The performance of a lifetime', 5000, '🥇', 'legendary'],
      ['Hollywood Legend', 'title', 'Your name in lights, forever', 6500, '⭐', 'legendary'],
    ]
    let updated = 0
    let inserted = 0
    for (const [name, kind, description, price, icon, rarity] of items) {
      const { rows } = await db.pool.query(
        `UPDATE cosmetics SET kind = $2, description = $3, price = $4, icon = $5, rarity = $6, active = TRUE
         WHERE name = $1 RETURNING id`,
        [name, kind, description, price, icon, rarity]
      )
      if (rows.length) {
        updated++
      } else {
        await db.pool.query(
          `INSERT INTO cosmetics (name, kind, description, price, icon, rarity) VALUES ($1, $2, $3, $4, $5, $6)`,
          [name, kind, description, price, icon, rarity]
        )
        inserted++
      }
    }
    res.json({ success: true, seeded: inserted, refreshed: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}