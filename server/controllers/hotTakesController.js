import { v4 as uuidv4 } from 'uuid'
import * as db from '../db.js'
import pool from '../config/database.js'
import { broadcastTopicReply } from '../lib/realtime.js'
import { broadcastFeed, notifyUser } from '../services/realtime.js'

const CATEGORY = 'hot-take'

// Agree/Disagree mapping: upvotes => agree, downvotes => disagree.
function computeStats(t) {
  const agree = Number(t.upvotes) || 0
  const disagree = Number(t.downvotes) || 0
  const total = agree + disagree
  return {
    agree,
    disagree,
    total,
    agreePct: total > 0 ? Math.round((agree / total) * 100) : 50,
    leadingSide: total === 0 || agree === disagree ? 'tied' : agree > disagree ? 'agree' : 'disagree',
  }
}

export async function listHotTakes(req, res) {
  try {
    const sort = req.query.sort === 'new' ? 'new' : 'hot'
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 60)
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)
    const topics = await db.getForumTopics(CATEGORY, limit, offset, sort)
    const ids = topics.map((t) => t.id)
    let votes = {}
    if (req.userId && ids.length) votes = await db.getUserForumVotes(req.userId, ids)
    const out = topics.map((t) => ({
      ...t,
      myVote: votes[t.id] || 0,
      stats: computeStats(t),
    }))
    res.json({ success: true, sort, topics: out })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function createHotTake(req, res) {
  try {
    const { movieTitle, title, content, noSpoilers } = req.body
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Your hot take headline is required' })
    if (!noSpoilers) return res.status(400).json({ error: 'You must confirm the take is spoiler-free' })
    const topic = await db.createForumTopic({
      id: uuidv4(),
      title: String(title).trim().slice(0, 255),
      category: CATEGORY,
      content: content && String(content).trim() ? String(content).trim() : String(title).trim(),
      authorId: req.userId,
    })
    // Movie metadata lives outside createForumTopic — patch it on.
    await pool.query(
      `UPDATE forum_topics SET movie_title = $2, no_spoilers = TRUE WHERE id = $1`,
      [topic.id, movieTitle ? String(movieTitle).trim().slice(0, 255) : null]
    )
    const fresh = await db.getForumTopicById(topic.id)
    const payload = { ...fresh, myVote: 0, stats: computeStats(fresh) }
    try { broadcastFeed({ type: 'hot-take-created', topic: payload }) } catch {}
    res.json({ success: true, topic: payload })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getHotTake(req, res) {
  try {
    const topic = await db.getForumTopicById(req.params.id)
    if (!topic) return res.status(404).json({ error: 'Hot take not found' })
    const replies = await db.getForumReplies(topic.id)
    const voteIds = [topic.id, ...replies.map((r) => r.id)]
    const votes = req.userId ? await db.getUserForumVotes(req.userId, voteIds) : {}
    res.json({
      success: true,
      topic: { ...topic, myVote: votes[topic.id] || 0, stats: computeStats(topic) },
      replies: replies.map((r) => ({ ...r, myVote: votes[r.id] || 0 })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function voteHotTake(req, res) {
  try {
    const raw = Number(req.body.vote)
    const v = raw === -1 ? -1 : raw === 0 ? 0 : 1
    const result = await db.castForumVote({ targetType: 'topic', targetId: req.params.id, userId: req.userId, vote: v })
    const stats = computeStats(result)
    // Global push: keeps both the debate panel AND the sidebar tallies live.
    try {
      broadcastFeed({
        type: 'hot-take-vote',
        topicId: req.params.id,
        ...stats,
        voterId: req.userId,
        serverMyVote: result.myVote,
      })
    } catch {}
    res.json({ success: true, myVote: result.myVote, stats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addHotTakeReply(req, res) {
  try {
    const { content, stance, parentId } = req.body
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'content required' })
    const topic = await db.getForumTopicById(req.params.id)
    if (!topic) return res.status(404).json({ error: 'Hot take not found' })
    const cleanStance = stance === 'disagree' ? 'disagree' : 'agree'

    const reply = await db.createForumReply({
      id: uuidv4(),
      topicId: req.params.id,
      parentId,
      authorId: req.userId,
      content: String(content).trim(),
    })
    await pool.query(`UPDATE forum_replies SET stance = $2 WHERE id = $1`, [reply.id, cleanStance])

    const enriched = await db.getForumReplyById(reply.id)
    broadcastTopicReply(req.params.id, enriched)

    if (topic.author_id && topic.author_id !== req.userId) {
      const replier = await db.findUserById(req.userId).catch(() => null)
      const notification = await db.createNotification({
        userId: topic.author_id,
        type: 'forum',
        title: `${replier?.name || 'Someone'} joined your debate`,
        body: `${topic.title || 'Hot take'} — ${String(content).slice(0, 140)}`,
        link: `/hot-takes?take=${req.params.id}`,
        actorId: req.userId,
      }).catch(() => null)
      if (notification) notifyUser(topic.author_id, { type: 'notification', notification })
    }
    res.json({ success: true, reply: enriched })
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message })
    res.status(500).json({ error: err.message })
  }
}

// GET /api/hot-takes/:id/stats — lightweight poll for clients without WS.
export async function hotTakeStats(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT upvotes, downvotes FROM forum_topics WHERE id = $1`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Hot take not found' })
    res.json({ success: true, stats: computeStats(rows[0]) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
