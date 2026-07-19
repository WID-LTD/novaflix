import { v4 as uuidv4 } from 'uuid'
import * as db from '../db.js'

export async function list(req, res) {
  try {
    const { search } = req.query
    const communities = await db.getCommunities(search)
    res.json({ success: true, communities })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getById(req, res) {
  try {
    const community = await db.getCommunityById(req.params.id)
    if (!community) return res.status(404).json({ error: 'Community not found' })
    const isMember = await db.isCommunityMember(req.params.id, req.userId)
    const posts = await db.getPosts(req.params.id)
    res.json({ success: true, community, isMember, posts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function create(req, res) {
  try {
    if (req.user.role !== 'creator' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only creators can create communities' })
    }
    const { name, description, avatar } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })
    const id = uuidv4()
    const community = await db.createCommunity({
      id,
      name,
      description,
      avatar,
      creatorId: req.userId,
      memberCount: 1,
    })
    await db.joinCommunity(id, req.userId)
    res.json({ success: true, community })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function join(req, res) {
  try {
    const result = await db.joinCommunity(req.params.id, req.userId)
    res.json({ success: true, member: !!result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function leave(req, res) {
  try {
    const result = await db.leaveCommunity(req.params.id, req.userId)
    res.json({ success: true, left: !!result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function myCommunities(req, res) {
  try {
    const communities = await db.getMyCommunities(req.userId)
    res.json({ success: true, communities })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addPost(req, res) {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })
    const isMember = await db.isCommunityMember(req.params.id, req.userId)
    if (!isMember) return res.status(403).json({ error: 'You must join this community to post' })
    const post = await db.createPost({
      id: uuidv4(),
      communityId: req.params.id,
      userId: req.userId,
      content,
    })
    const { rows } = await db.pool.query(
      `SELECT p.*, u.name as user_name, u.avatar as user_avatar
       FROM community_posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [post.id]
    )
    res.json({ success: true, post: rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function deletePost(req, res) {
  try {
    const post = await db.deletePost(req.params.postId, req.userId)
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
