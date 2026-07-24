import { addLike, removeLike, getContentLikes, hasUserLiked, addComment, getContentComments, deleteComment, getCommentsForCreator, addFollower, removeFollower, isFollowing, getFollowerCount, getFollowingCount, checkAndAwardAchievements } from '../db.js'

export async function toggleLike(req, res) {
  try {
    const { contentId, contentType, creatorId } = req.body
    if (!contentId || !contentType) return res.status(400).json({ error: 'contentId and contentType required' })

    const liked = await hasUserLiked(req.userId, contentId, contentType)
    if (liked) {
      await removeLike(req.userId, contentId, contentType)
    } else {
      await addLike(req.userId, contentId, contentType, creatorId)
    }

    const count = await getContentLikes(contentId, contentType)
    res.json({ success: true, liked: !liked, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function checkLike(req, res) {
  try {
    const { contentId, contentType } = req.query
    const liked = await hasUserLiked(req.userId, contentId, contentType)
    const count = await getContentLikes(contentId, contentType)
    res.json({ success: true, liked, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function postComment(req, res) {
  try {
    const { contentId, contentType, text, creatorId } = req.body
    if (!contentId || !contentType || !text) return res.status(400).json({ error: 'contentId, contentType, and text required' })

    const comment = await addComment(req.userId, contentId, contentType, text, creatorId)
    res.json({ success: true, comment })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function listComments(req, res) {
  try {
    const { contentId, contentType } = req.query
    if (!contentId || !contentType) return res.status(400).json({ error: 'contentId and contentType required' })

    const comments = await getContentComments(contentId, contentType)
    res.json({ success: true, comments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function removeComment(req, res) {
  try {
    const { id } = req.params
    const deleted = await deleteComment(id, req.userId)
    if (!deleted) return res.status(404).json({ error: 'Comment not found' })
    res.json({ success: true, message: 'Comment deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function toggleFollow(req, res) {
  try {
    const { followingId } = req.body
    if (!followingId) return res.status(400).json({ error: 'followingId required' })
    if (req.userId === followingId) return res.status(400).json({ error: 'Cannot follow yourself' })

    const following = await isFollowing(req.userId, followingId)
    if (following) {
      await removeFollower(req.userId, followingId)
    } else {
      await addFollower(req.userId, followingId)
    }

    const count = await getFollowerCount(followingId)
    checkAndAwardAchievements(req.userId).catch(() => {})
    res.json({ success: true, following: !following, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function checkFollow(req, res) {
  try {
    const { followingId } = req.query
    if (!followingId) return res.status(400).json({ error: 'followingId required' })

    const following = await isFollowing(req.userId, followingId)
    const count = await getFollowerCount(followingId)
    res.json({ success: true, following, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
