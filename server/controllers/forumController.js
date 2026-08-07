import { v4 as uuidv4 } from 'uuid'
import * as db from '../db.js'
import { broadcastTopicReply } from '../lib/realtime.js'
import { notifyUser } from '../services/realtime.js'

export async function listTopics(req, res) {
  try {
    const { category, limit, offset } = req.query
    const sort = req.query.sort === 'hot' ? 'hot' : 'new'
    const topics = await db.getForumTopics(category || 'all', parseInt(limit, 10) || 30, parseInt(offset, 10) || 0, sort)
    const ids = topics.map((t) => t.id)
    let votes = {}
    if (req.userId) votes = await db.getUserForumVotes(req.userId, ids)
    const out = topics.map((t) => ({ ...t, myVote: votes[t.id] || 0 }))
    res.json({ success: true, sort, topics: out })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function createTopic(req, res) {
  try {
    const { title, category, content } = req.body
    if (!title || !content) return res.status(400).json({ error: 'title and content required' })
    const topic = await db.createForumTopic({
      id: uuidv4(),
      title,
      category: category || 'general',
      content,
      authorId: req.userId,
    })
    res.json({ success: true, topic })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getTopic(req, res) {
  try {
    const topic = await db.getForumTopicById(req.params.id)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })
    const replies = await db.getForumReplies(req.params.id)
    const ids = [topic.id, ...replies.map((r) => r.id)]
    let votes = {}
    if (req.userId) votes = await db.getUserForumVotes(req.userId, ids)
    res.json({
      success: true,
      topic: { ...topic, myVote: votes[topic.id] || 0 },
      replies: replies.map((r) => ({ ...r, myVote: votes[r.id] || 0 })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

function normalizeVote(vote) {
  if (vote === -1) return -1
  if (vote === 0) return 0
  return 1
}

export async function vote(req, res) {
  try {
    const v = normalizeVote(req.body.vote)
    const result = await db.castForumVote({ targetType: 'topic', targetId: req.params.id, userId: req.userId, vote: v })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addReply(req, res) {
  try {
    const { content, parentId } = req.body
    if (!content) return res.status(400).json({ error: 'content required' })
    const topic = await db.getForumTopicById(req.params.id)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })
    const reply = await db.createForumReply({
      id: uuidv4(),
      topicId: req.params.id,
      parentId,
      authorId: req.userId,
      content,
    })
    const enriched = await db.getForumReplyById(reply.id)
    broadcastTopicReply(req.params.id, enriched)
    if (topic.author_id && topic.author_id !== req.userId) {
      const [replier] = await Promise.all([db.findUserById(req.userId).catch(() => null)])
      const notification = await db.createNotification({
        userId: topic.author_id,
        type: 'forum',
        title: `${replier?.name || 'Someone'} replied to your hot take`,
        body: `${topic.title || 'Topic'} — ${content.slice(0, 140)}`,
        link: `/forum/${req.params.id}`,
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

export async function replyVote(req, res) {
  try {
    const v = normalizeVote(req.body.vote)
    const result = await db.castForumVote({ targetType: 'reply', targetId: req.params.id, userId: req.userId, vote: v })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function categories(req, res) {
  try {
    const { rows } = await db.pool.query(
      `SELECT DISTINCT category FROM forum_topics ORDER BY category`
    )
    res.json({ success: true, categories: rows.map((r) => r.category) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
