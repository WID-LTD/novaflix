import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  getDailyTrivia, submitDailyTrivia, getTriviaStreak, getTriviaLeaderboard,
  getGuessMovie, submitGuess, getCoinsBalance, getCosmetics, purchaseCosmetic, equipCosmetic,
} from '../lib/auth'

interface Q {
  id: string
  question: string
  options: string[]
  answered?: boolean
  correct?: boolean | null
  image_url?: string | null
  difficulty?: string
  clue?: string | null
}

function ScoreResult({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? score / total : 0
  const tier = pct >= 0.7 ? 'pass' : pct >= 0.4 ? 'good' : 'fail'
  const config = {
    pass: { color: '#22c55e', glow: 'rgba(34,197,94,0.35)', label: 'Excellent!', copy: 'You clearly know your films. Bravo!' },
    good: { color: '#f97316', glow: 'rgba(249,115,22,0.35)', label: 'Good!', copy: 'Solid effort — a few more shows and you’ll be unstoppable.' },
    fail: { color: '#ef4444', glow: 'rgba(239,68,68,0.35)', label: 'You failed', copy: 'Don’t worry — even hits have outtakes. Try again!' },
  }[tier]
  const isFail = tier === 'fail'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      className="bg-surface-container-high border border-white/5 rounded-2xl p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.15 }}
        className="relative w-28 h-28 mx-auto mb-5"
        style={{ filter: `drop-shadow(0 0 22px ${config.glow})` }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke={config.color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          {isFail ? (
            <>
              <motion.path d="M30 30 L70 70" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.35 }} />
              <motion.path d="M70 30 L30 70" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.6 }} />
            </>
          ) : (
            <motion.path d="M22 52 L43 72 L79 32" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.35 }} />
          )}
        </svg>
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0.8, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          style={{ border: `3px solid ${config.color}` }}
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-headline-sm font-bold text-on-surface mb-1"
      >
        {config.label}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="text-2xl font-extrabold mb-2"
        style={{ color: config.color }}
      >
        {score}/{total}
      </motion.p>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        className="h-2 rounded-full mx-auto mb-3 max-w-[240px]"
        style={{ background: config.color }}
      />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-sm text-on-surface-variant mb-5">
        {config.copy}
      </motion.p>
    </motion.div>
  )
}

export default function Trivia() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'trivia' | 'guess' | 'shop' | 'leaderboard'>('trivia')

  // Daily trivia
  const [questions, setQuestions] = useState<Q[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<any>(null)
  const [triviaLoading, setTriviaLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Guess the movie
  const [guessQ, setGuessQ] = useState<Q | null>(null)
  const [guessPicked, setGuessPicked] = useState<number | null>(null)
  const [guessResult, setGuessResult] = useState<any>(null)

  // Shop
  const [cosmetics, setCosmetics] = useState<any[]>([])
  const [coins, setCoins] = useState(0)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  const loadTrivia = useCallback(() => {
    setTriviaLoading(true)
    getDailyTrivia().then(r => {
      if (r.success) {
        setQuestions(r.questions)
        setAnswers({})
        setResult(null)
        setCurrentIndex(0)
      }
      setTriviaLoading(false)
    })
  }, [])

  useEffect(() => {
    loadTrivia()
    getTriviaStreak()
  }, [loadTrivia])

  const pickAnswer = (qid: string, idx: number) => {
    setAnswers(prev => ({ ...prev, [qid]: idx }))
  }

  const submit = async () => {
    if (Object.keys(answers).length === 0) return
    const res = await submitDailyTrivia(Object.entries(answers).map(([id, answerIndex]) => ({ id, answerIndex })))
    if (res.success) {
      setResult(res)
      getCoinsBalance().then(r => r.success && setCoins(r.coins))
      setQuestions(prev => prev.map(q => ({ ...q, answered: true })))
    }
  }

  const loadGuess = useCallback(() => {
    setGuessPicked(null)
    setGuessResult(null)
    getGuessMovie().then(r => {
      if (r.success) setGuessQ(r.question)
    })
  }, [])

  useEffect(() => { if (tab === 'guess') loadGuess() }, [tab, loadGuess])

  const guess = async (idx: number) => {
    if (guessPicked !== null || !guessQ) return
    setGuessPicked(idx)
    const res = await submitGuess(guessQ.id, idx)
    if (res.success) {
      setGuessResult(res)
      getCoinsBalance().then(r => r.success && setCoins(r.coins))
    }
  }

  const loadShop = useCallback(() => {
    getCosmetics().then(r => {
      if (r.success) {
        setCosmetics(r.cosmetics)
        setCoins(r.coins)
      }
    })
    getTriviaLeaderboard().then(r => r.success && setLeaderboard(r.leaderboard))
  }, [])

  useEffect(() => { if (tab === 'shop' || tab === 'leaderboard') loadShop() }, [tab, loadShop])

  const buy = async (id: string) => {
    const res = await purchaseCosmetic(id)
    if (res.success) {
      setCoins(res.coins)
      loadShop()
    }
  }

  const toggleEquip = async (id: string, currentlyEquipped: boolean) => {
    const res = await equipCosmetic(id, !currentlyEquipped)
    if (res.success) loadShop()
  }

  if (!user) {
    return (
      <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav text-center">
        <h1 className="text-headline-md font-bold text-on-surface mb-3">Trivia & Rewards</h1>
        <p className="text-on-surface-variant mb-6">Sign in to play trivia and earn coins.</p>
        <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-label-md hover:brightness-110">
          Sign in
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'trivia' as const, label: 'Daily Trivia', icon: 'quiz' as const },
    { id: 'guess' as const, label: 'Guess the Movie', icon: 'videocam' as const },
    { id: 'shop' as const, label: 'Cosmetics Shop', icon: 'shopping_bag' as const },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: 'leaderboard' as const },
  ]

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Icon name="quiz" className="text-primary-container" />
            <h1 className="text-headline-md font-bold text-on-surface">Trivia & Rewards</h1>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-surface-container-high border border-white/5 rounded-full px-3 py-1.5 text-sm text-amber-300">
            <Icon name="monetization_on" className="w-4 h-4" /> {coins.toLocaleString()} coins
          </div>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto bg-surface-container-high rounded-xl p-1 border border-white/5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 whitespace-nowrap inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <Icon name={t.icon} className="text-base leading-none" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'trivia' && (
          <div className="space-y-4">
            {triviaLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : result ? (
              <div className="space-y-4">
                <ScoreResult score={result.score} total={result.total} />
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="text-center">
                  <p className="text-on-surface-variant mb-4">
                    +{result.coinsEarned} coins earned · Current streak: {result.streak} 🔥
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button onClick={loadTrivia} className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-label-md hover:brightness-110">
                      Play again
                    </button>
                    <button onClick={() => setTab('shop')} className="px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-label-md hover:bg-primary/10">
                      Spend coins
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : questions.length === 0 ? (
              <p className="text-center text-on-surface-variant py-12">No trivia available today — check back soon!</p>
            ) : (
              <div className="space-y-4">
                <motion.div
                  key={questions[currentIndex]?.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="bg-surface-container-high border border-white/5 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase bg-white/5 text-on-surface-variant">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <div className="flex gap-1">
                      {questions.map((_, qi) => (
                        <span key={qi} className={`w-1.5 h-1.5 rounded-full ${qi < currentIndex ? 'bg-primary-container' : qi === currentIndex ? 'bg-primary' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const q = questions[currentIndex]
                    if (!q) return null
                    return (
                      <>
                        <div className="flex items-start gap-3 mb-3">
                          {q.image_url && <img src={q.image_url} alt="" className="w-12 object-cover rounded-lg shrink-0" style={{ height: '4.5rem' }} />}
                          <div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${q.difficulty === 'easy' ? 'bg-green-500/15 text-green-300' : q.difficulty === 'medium' ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
                              {q.difficulty || 'trivia'}
                            </span>
                            <h3 className="text-sm font-semibold text-on-surface mt-1">{q.question}</h3>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          {q.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => pickAnswer(q.id, i)}
                              className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                                answers[q.id] === i
                                  ? 'bg-primary-container border-primary-container text-on-primary-container'
                                  : 'bg-surface-container border-white/10 text-on-surface hover:border-primary/40'
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </button>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </motion.div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                    disabled={typeof answers[questions[currentIndex]?.id] !== 'number'}
                    className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-label-md hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    Next Question <Icon name="arrow_forward" size="sm" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={Object.keys(answers).length < questions.length}
                    className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-label-md hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    Submit answers · {Object.keys(answers).length}/{questions.length} selected
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'guess' && (
          <div className="space-y-4">
            {!guessQ ? (
              <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-high border border-white/5 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <h2 className="text-headline-sm font-bold text-on-surface mb-1">Guess the Movie</h2>
                  <p className="text-sm text-on-surface-variant">15 coins per correct guess</p>
                </div>
                <div className="relative w-full max-w-xs mx-auto mb-4">
                  {guessQ.image_url && (
                    <img src={guessQ.image_url} alt="Blurred movie" className={`w-full rounded-xl object-cover transition-all duration-500 ${guessPicked === null ? 'blur-2xl' : ''}`} style={{ aspectRatio: '2/3' }} />
                  )}
                  {guessPicked === null && <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-sm">🤔 Can you name it?</div>}
                </div>
                {guessQ.clue && <p className="text-sm text-on-surface-variant text-center italic mb-4">"{guessQ.clue}…"</p>}
                <div className="grid gap-2">
                  {guessQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => guess(i)}
                      disabled={guessPicked !== null}
                      className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all disabled:cursor-default ${
                        guessPicked === i
                          ? guessResult?.correct
                            ? 'bg-green-500/20 border-green-500 text-green-300'
                            : 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-surface-container border-white/10 text-on-surface hover:border-primary/40'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  ))}
                </div>
                {guessResult && (
                  <div className="mt-4 text-center">
                    <p className={`text-sm font-semibold ${guessResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                      {guessResult.correct ? `Correct! It was ${guessResult.answer}` : `Nope — it was ${guessResult.answer}`} {guessResult.correct ? `· +${guessResult.coinsEarned} coins` : ''}
                    </p>
                    <button onClick={loadGuess} className="mt-3 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-label-md hover:brightness-110">
                      Next movie
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {tab === 'shop' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {cosmetics.map(c => (
              <div key={c.id} className="bg-surface-container-high border border-white/5 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="text-4xl mb-2">{c.icon}</div>
                <p className="font-label-md text-label-md text-on-surface">{c.name}</p>
                <p className="text-[11px] text-on-surface-variant mb-1">{c.description}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full mb-3 ${c.kind === 'avatar_frame' ? 'bg-purple-500/15 text-purple-300' : c.kind === 'badge' ? 'bg-blue-500/15 text-blue-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {c.kind.replace('_', ' ')}
                </span>
                {c.owned ? (
                  <button onClick={() => toggleEquip(c.id, c.equipped)} className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${c.equipped ? 'bg-primary-container text-on-primary-container' : 'bg-white/5 text-on-surface-variant hover:text-on-surface'}`}>
                    {c.equipped ? 'Equipped ✓' : 'Equip'}
                  </button>
                ) : (
                  <button onClick={() => buy(c.id)} disabled={coins < c.price} className="w-full py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-40">
                    {c.price} coins
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="bg-surface-container-high border border-white/5 rounded-2xl overflow-hidden">
            {leaderboard.length === 0 ? (
              <p className="text-center text-on-surface-variant py-10 text-sm">No trivia played yet — be the first!</p>
            ) : (
              leaderboard.map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-400/20 text-amber-300' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-400/20 text-orange-300' : 'bg-white/5 text-on-surface-variant'}`}>
                    {i + 1}
                  </span>
                  {u.avatar ? <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <Icon name="person" className="text-on-surface-variant/50" />}
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(`/profile/${u.user_id}`)} className="text-sm font-medium text-on-surface truncate hover:text-primary">{u.name}</button>
                    <p className="text-xs text-on-surface-variant/60">🔥 {u.streak} streak · {u.total_correct} correct</p>
                  </div>
                  <span className="text-sm font-bold text-on-surface">{u.total_points} pts</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
