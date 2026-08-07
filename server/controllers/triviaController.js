import { v4 as uuidv4 } from 'uuid'
import * as db from '../db.js'

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

async function generateDaily(tmdb, key) {
  let results = []
  try {
    const { data } = await tmdb.get('/trending/movie/week', { params: { language: 'en-US' } })
    results = data.results || []
  } catch {
    const { data } = await tmdb.get('/movie/popular', { params: { language: 'en-US' } })
    results = data.results || []
  }
  if (!results.length) return []

  const withYear = results.filter((m) => m.release_date && parseInt(m.release_date.split('-')[0]))
  const questions = []

  const addYear = (m, difficulty) => {
    const y = parseInt(m.release_date.split('-')[0])
    const opts = shuffle([y, y + 1, y - 2, y + 3])
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
      image_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    })
  }

  const addPlot = (m, others, difficulty) => {
    const opts = shuffle([m, ...others])
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
      image_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
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
      image_url: newest.poster_path ? `https://image.tmdb.org/t/p/w500${newest.poster_path}` : null,
    })
  }

  if (withYear.length >= 2) {
    addYear(withYear[0], 'easy')
    addYear(withYear[1], 'easy')
  }
  const withPlot = results.filter((m) => m.overview && m.overview.length > 60)
  if (withPlot.length >= 4) {
    const target = withPlot[0]
    addPlot(target, withPlot.slice(1, 4), 'medium')
  }
  if (withPlot.length >= 5) {
    const target = withPlot[4]
    addPlot(target, withPlot.slice(0, 3).concat(withPlot[5] || withPlot[3]), 'hard')
  }
  if (withYear.length >= 4) {
    addNewest(withYear.slice(0, 4), 'medium')
  }
  return questions.slice(0, 5)
}

export async function today(req, res) {
  try {
    const key = dateKey()
    let questions = await db.getTriviaForDate(key)
    if (!questions.length) {
      const generated = await generateDaily(req.app.locals.tmdb, key)
      for (const q of generated) await db.insertTriviaQuestion(q)
      questions = await db.getTriviaForDate(key)
    }
    const attempts = await db.pool.query(
      `SELECT question_id, correct FROM trivia_attempts WHERE user_id = $1 AND game_type = 'trivia' AND answered_at::date = CURRENT_DATE`,
      [req.userId]
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

export async function submitDaily(req, res) {
  try {
    const { answers } = req.body
    if (!Array.isArray(answers) || !answers.length) return res.status(400).json({ error: 'answers required' })
    const key = dateKey()
    const streakRow = await db.getTriviaStreak(req.userId)
    let correctCount = 0
    let coins = 0
    let xp = 0

    for (const a of answers) {
      const q = await db.getTriviaQuestion(a.id)
      if (!q) continue
      const correct = q.answer_index === a.answerIndex
      const points = correct ? 10 : 0
      coins += points
      xp += correct ? 2 : 0
      if (correct) correctCount++
      await db.recordTriviaAttempt({
        userId: req.userId,
        questionId: q.id,
        gameType: 'trivia',
        correct,
        points,
      })
    }

    if (coins > 0) {
      await db.addCoins(req.userId, coins)
      const { addXp } = await import('../db.js')
      addXp(req.userId, xp).catch(() => {})
    }

    const streak = await db.updateTriviaStreak(req.userId, key, correctCount > 0)
    const newBalance = await db.getCoins(req.userId)
    res.json({
      success: true,
      score: correctCount,
      total: answers.length,
      coinsEarned: coins,
      coins: newBalance,
      streak,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    const rows = await db.getTriviaLeaderboard(Math.min(parseInt(req.query.limit, 10) || 20, 50))
    res.json({ success: true, leaderboard: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function guess(req, res) {
  try {
    const tmdb = req.app.locals.tmdb
    let results = []
    try {
      const { data } = await tmdb.get('/movie/popular', { params: { language: 'en-US', page: 1 + Math.floor(Math.random() * 3) } })
      results = data.results || []
    } catch {
      const { data } = await tmdb.get('/trending/movie/week', { params: { language: 'en-US' } })
      results = data.results || []
    }
    const pool = results.filter((m) => m.poster_path && m.title)
    if (!pool.length) return res.status(503).json({ error: 'No movies available' })

    const target = pool[0]
    const others = shuffle(pool.slice(1, 7)).slice(0, 3)
    const opts = shuffle([target, ...others])
    const clue = (target.overview || '').slice(0, 120)

    const q = await db.insertTriviaQuestion({
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

    await db.pool.query(
      `DELETE FROM trivia_questions WHERE game_type = 'guess' AND created_at < NOW() - INTERVAL '1 day'`
    )

    res.json({
      success: true,
      question: {
        id: q.id,
        game_type: 'guess',
        clue,
        image_url: q.image_url,
        options: q.options,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function submitGuess(req, res) {
  try {
    const { questionId, answerIndex } = req.body
    if (!questionId) return res.status(400).json({ error: 'questionId required' })
    const q = await db.getTriviaQuestion(questionId)
    if (!q || q.game_type !== 'guess') return res.status(404).json({ error: 'Question not found' })
    const correct = q.answer_index === answerIndex
    const points = correct ? 15 : 0
    await db.recordTriviaAttempt({
      userId: req.userId,
      questionId: q.id,
      gameType: 'guess',
      correct,
      points,
    })
    if (correct) {
      await db.addCoins(req.userId, points)
      const { addXp } = await import('../db.js')
      addXp(req.userId, 3).catch(() => {})
    }
    res.json({
      success: true,
      correct,
      answer: q.answer_text,
      coinsEarned: points,
      coins: await db.getCoins(req.userId),
    })
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
    res.json({ success: true, cosmetic: result.cosmetic, coins: await db.getCoins(req.userId) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function equip(req, res) {
  try {
    const { equipped } = req.body
    const result = await db.equipCosmetic(req.userId, req.params.id, !!equipped)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function seedCatalog(req, res) {
  try {
    const items = [
      ['Rising Star', 'badge', 'A badge for newcomers', 50, '✨'],
      ['Movie Buff', 'badge', 'Watch 25 films', 100, '🎬'],
      ['Cinematic Master', 'title', 'Show off your knowledge', 250, '👑'],
      ['Horror Scholar', 'title', 'For the brave', 250, '🧛'],
      ['Neon Frame', 'avatar_frame', 'A glowing neon avatar frame', 150, '🖼️'],
      ['Gold Frame', 'avatar_frame', 'Premium gold avatar frame', 300, '🪙'],
      ['Plot Genius', 'badge', 'For trivia champions', 200, '🧠'],
      ['Night Owl', 'badge', 'For late night watchers', 120, '🦉'],
    ]
    let count = 0
    for (const [name, kind, description, price, icon] of items) {
      const exists = await db.pool.query(`SELECT 1 FROM cosmetics WHERE name = $1`, [name])
      if (!exists.rows.length) {
        await db.pool.query(
          `INSERT INTO cosmetics (name, kind, description, price, icon) VALUES ($1, $2, $3, $4, $5)`,
          [name, kind, description, price, icon]
        )
        count++
      }
    }
    res.json({ success: true, seeded: count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
