import { v4 as uuidv4 } from 'uuid'
import { uploadFile } from '../lib/r2.js'
import { createPost, getPostsFeed, getUserPosts, likePost, getPostComments, addPostComment, deletePost } from '../db.js'
import { broadcastFeed } from '../services/realtime.js'
import { createNotification } from '../db.js'
import { notifyUser } from '../services/realtime.js'

export async function createPost(req, res) {
  try {
    const { content, mediaFiles, visibility = 'public' } = req.body
    if (!content?.trim() && !req.files?.media?.length) {
      return res.status(400).json({ error: 'Content or media required' })
    }

    const mediaUrls = []
    if (req.files?.media) {
      for (const file of req.files.media) {
        const ext = file.originalname.split('.').pop()
        const id = uuidv4()
        const key = `posts/${req.userId}/${id}.${ext}`
        const result = await uploadFile({ buffer: file.buffer, key, contentType: file.mimetype })
        if (result.success) mediaUrls.push({ url: result.url, type: file.mimetype.startsWith('video') ? 'video' : 'image' })
      }
    }

    const post = await createPost({
      id: uuidv4(),
      userId: req.userId,
      content: content || '',
      mediaUrls,
      visibility,
      createdAt: new Date().toISOString(),
    })

    // Notify followers in real-time
    broadcastFeed({ type: 'post', post })

    res.json({ success: true, post })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getFeed(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = 20
    const offset = (page - 1) * limit
    const posts = await getPostsFeed(req.userId, limit, offset)
    res.json({ success: true, posts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getUserPosts(req, res) {
  try {
    const { userId } = req.params
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = 20
    const offset = (page - 1) * 20
    const posts = await getUserPosts(userId, limit, offset)
    res.json({ success: true, posts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function likePost(req, res) {
  try {
    const { postId } = req.params
    const liked = await hasUserLikedPost(req.userId, postId)
    if (liked) {
      await removePostLike(req.userId, postId)
    } else {
      await addPostLike(req.userId, postId)
      addXp(req.userId, 2).catch(() => {})
    }

    const count = await getPostLikes(postId)
    broadcastFeed({ type: 'post:like', postId, count, liked: !liked })
    res.json({ success: true, liked: !liked, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getPostComments(req, res) {
  try {
    const { postId } = req.params
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = 20
    const offset = (page - 1) * limit
    const comments = await getPostComments(postId, limit, offset, req.userId)
    res.json({ success: true, comments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function createPostComment(req, res) {
  try {
    const { postId } = req.params
    const { text, parentId, mediaUrl, mediaType, durationSeconds, unlockAt, milestoneUnlock } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' })

    const comment = await addPostComment(req.userId, postId, text, {
      parentId,
      mediaUrl,
      mediaType,
      durationSeconds,
      unlockAt,
      milestoneUnlock,
    })

    broadcastFeed({ type: 'post:comment', postId: comment.postId, comment })
    
    // Notify post author if different from commenter
    const post = await getPostById(postId)
    if (post && post.userId !== req.userId) {
      const notification = await createNotification({
        userId: post.userId,
        type: 'comment',
        title: 'New comment on your post',
        body: text.slice(0, 100),
        link: `/post/${postId}`,
        actorId: req.userId,
      })
      if (notification) notifyUser(post.userId, { type: 'notification', notification })
    }

    res.json({ success: true, comment })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function deletePost(req, res) {
  try {
    const { postId } = req.params
    const post = await getPostById(postId)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    if (post.userId !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' })
    }
    await deletePost(postId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Helper functions - need to be added to db.js
async function hasUserLikedPost(userId, postId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  )
  return rows.length > 0
}

async function addPostLike(userId, postId) {
  await pool.query(
    'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, postId]
  )
}

async function removePostLike(userId, postId) {
  await pool.query(
    'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  )
}

async function getPostLikes(postId) {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM post_likes WHERE post_id = $1', [postId])
  return parseInt(rows[0].count)
}

async function createPost(data) {
  const { rows } = await pool.query(
    `INSERT INTO posts (id, user_id, content, media_urls, visibility, created_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.id, data.userId, data.content, JSON.stringify(data.mediaUrls || []), data.visibility, data.createdAt]
  )
  return rows[0]
}

async function getPostsFeed(userId, limit, offset) {
  const { rows } = await pool.query(
    `SELECT p.*, u.name as author_name, u.avatar as author_avatar,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as liked
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.visibility = 'public' OR p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId || '00000000-0000-0000-0000-000000000000', limit, offset]
  )
  return rows.map(r => ({
    ...r,
    mediaUrls: JSON.parse(r.media_urls || '[]'),
  }))
}

async function getUserPosts(userId, limit, offset) {
  const { rows } = await pool.query(
    `SELECT p.*, u.name as author_name, u.avatar as author_avatar,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return rows.map(r => ({ ...r, mediaUrls: JSON.parse(r.media_urls || '[]') }))
}

async function addPostLike(userId, postId) {
  await pool.query(
    'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, postId]
  )
}

async function removePostLike(userId, postId) {
  await pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId])
}

async function getPostComments(postId, limit, offset, viewerId) {
  const { rows } = await pool.query(
    `SELECT c.*, u.name as user_name, u.avatar as user_avatar
     FROM post_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1 AND c.parent_id IS NULL
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset]
  )
  return rows
}

async function addPostComment(userId, postId, text, options = {}) {
  const id = uuidv4()
  await pool.query(
    `INSERT INTO post_comments (id, user_id, post_id, text, parent_id, media_url, media_type, duration_seconds, unlock_at, milestone_unlock)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [id, userId, postId, text, options.parentId || null, options.mediaUrl || null, options.mediaType || null, options.durationSeconds || null, options.unlockAt || null, options.milestoneUnlock || null]
  )
  const { rows } = await pool.query(
    `SELECT c.*, u.name as user_name, u.avatar as user_avatar FROM post_comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
    [id]
  )
  return rows[0]
}

async function getPostById(postId) {
  const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [postId])
  return rows[0]
}

async function deletePost(postId) {
  await pool.query('DELETE FROM posts WHERE id = $1', [postId])
}

async function hasUserLikedPost(userId, postId) {
  const { rows } = await pool.query('SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId])
  return rows.length > 0
}