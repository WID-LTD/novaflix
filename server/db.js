import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data.json')

const defaults = {
  users: [],
  uploads: [],
  watchHistory: [],
  subscriptions: [],
  tips: [],
}

let data = { ...defaults }

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      data = { ...defaults, ...JSON.parse(raw) }
    } else {
      data = { ...defaults }
      save()
    }
  } catch {
    data = { ...defaults }
    save()
  }
}

function save() {
  try {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('[db] save error:', err.message)
  }
}

load()

export function getDb() {
  return data
}

export function findUserByEmail(email) {
  return data.users.find((u) => u.email === email)
}

export function findUserById(id) {
  return data.users.find((u) => u.id === id)
}

export function createUser(user) {
  data.users.push(user)
  save()
  return user
}

export function updateUser(id, updates) {
  const idx = data.users.findIndex((u) => u.id === id)
  if (idx === -1) return null
  data.users[idx] = { ...data.users[idx], ...updates }
  save()
  return data.users[idx]
}

export function addUpload(upload) {
  data.uploads.push(upload)
  save()
  return upload
}

export function getUploadsByUserId(userId) {
  return data.uploads.filter((u) => u.userId === userId)
}

export function getAllUploads() {
  return data.uploads
}

export function addWatchEntry(entry) {
  data.watchHistory.push(entry)
  save()
  return entry
}

export function getWatchHistory(userId) {
  return data.watchHistory.filter((w) => w.userId === userId)
}

export function addSubscription(sub) {
  data.subscriptions.push(sub)
  save()
  return sub
}

export function getUserSubscription(userId) {
  return data.subscriptions.find((s) => s.userId === userId && s.active)
}

export function addTip(tip) {
  data.tips.push(tip)
  save()
  return tip
}

export function getTipsForCreator(creatorId) {
  return data.tips.filter((t) => t.creatorId === creatorId)
}

export function getTotalMinutesWatched(userId) {
  return data.watchHistory
    .filter((w) => w.userId === userId)
    .reduce((acc, w) => acc + (w.minutes || 0), 0)
}

export function getTotalViewsForUpload(uploadId) {
  return data.watchHistory.filter((w) => w.uploadId === uploadId).length
}
