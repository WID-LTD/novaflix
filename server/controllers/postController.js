import { v4 as uuidv4 } from 'uuid'
import { uploadFile } from '../lib/r2.js'
import { getPostsFeed, getUserPostsById, getPostComments as dbGetPostComments, addPostComment, deleteUserPost, createUserPost as dbCreatePost, getPostById, hasLikedPost, addPostLike, removePostLike, getPostLikes, addXp } from '../db.js'
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

    const post = await dbCreatePost({
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
    const posts = await getUserPostsById(userId, limit, offset)
    res.json({ success: true, posts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function likePost(req, res) {
  try {
    const { postId } = req.params
    const liked = await hasLikedPost(req.userId, postId)
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
    const comments = await dbGetPostComments(postId, limit, offset, req.userId)
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

    broadcastFeed({ type: 'post:comment', postId: comment.post_id || postId, comment })
    
    // Notify post author if different from commenter
    const post = await getPostById(postId)
    const postOwnerId = post?.user_id || post?.userId
    if (post && postOwnerId && postOwnerId !== req.userId) {
      const notification = await createNotification({
        userId: postOwnerId,
        type: 'comment',
        title: 'New comment on your post',
        body: text.slice(0, 100),
        link: `/post/${postId}`,
        actorId: req.userId,
      })
      if (notification) notifyUser(postOwnerId, { type: 'notification', notification })
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
    if (post.user_id !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' })
    }
    await deleteUserPost(postId, req.userId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}