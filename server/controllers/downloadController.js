import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOWNLOADS_DIR = path.join(__dirname, '..', 'download')

export async function list(req, res) {
  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true })
      return res.json({ success: true, files: [] })
    }
    const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f !== '.gitkeep').map(name => {
      const stat = fs.statSync(path.join(DOWNLOADS_DIR, name))
      return {
        name,
        size: stat.size,
        sizeLabel: formatSize(stat.size),
        createdAt: stat.birthtime,
        modifiedAt: stat.mtime,
      }
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json({ success: true, files })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function remove(req, res) {
  try {
    const filePath = path.join(DOWNLOADS_DIR, req.params.filename)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
    fs.unlinkSync(filePath)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}
