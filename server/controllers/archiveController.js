import { v4 as uuidv4 } from 'uuid'
import { createArchiveItem, updateArchiveItem, getArchiveItems, getArchiveItemById, getAllArchiveItems, logArchiveAccess } from '../db.js'

const PLAN_RANK = { free: 0, student: 1, basic: 2, standard: 3, premium: 4 }

function getPlanRank(plan) {
  return PLAN_RANK[plan] ?? 0
}

export async function create(req, res) {
  try {
    const { title, description, contentType, mediaUrl, posterUrl, year, genre, minPlan } = req.body
    if (!title) return res.status(400).json({ error: 'Title required' })
    const item = await createArchiveItem({
      id: uuidv4(), title, description, contentType, mediaUrl, posterUrl, year, genre, minPlan,
    })
    res.json({ success: true, item })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function update(req, res) {
  try {
    const item = await updateArchiveItem(req.params.id, req.body)
    if (!item) return res.status(404).json({ error: 'Archive item not found' })
    res.json({ success: true, item })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function list(req, res) {
  try {
    const userPlanRank = req.userId ? getPlanRank(req.user.plan) : 0
    const items = await getArchiveItems(userPlanRank)
    res.json({ success: true, items })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function get(req, res) {
  try {
    const item = await getArchiveItemById(req.params.id)
    if (!item) return res.status(404).json({ error: 'Archive item not found' })
    const userPlanRank = req.userId ? getPlanRank(req.user.plan) : 0
    const itemPlanRank = getPlanRank(item.min_plan)
    if (userPlanRank < itemPlanRank) {
      return res.status(403).json({ error: 'Upgrade your plan to access this content', requiredPlan: item.min_plan })
    }
    if (req.userId) await logArchiveAccess(req.userId, item.id)
    res.json({ success: true, item })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

export async function listAll(req, res) {
  try {
    const items = await getAllArchiveItems()
    res.json({ success: true, items })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
