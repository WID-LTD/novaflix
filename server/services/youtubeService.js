import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { uploadFile } from '../lib/r2.js'
import { addUpload, getUploadById, updateUpload } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Prefer the bundled yt-dlp, fall back to PATH installs.
const YT_DLP =
  (fs.existsSync(path.join(__dirname, '..', 'bin', 'yt-dlp')) && path.join(__dirname, '..', 'bin', 'yt-dlp')) ||
  process.env.YT_DLP_PATH ||
  'yt-dlp'

const WORK_DIR = process.env.YOUTUBE_WORK_DIR || path.join(os.tmpdir(), 'novaflix-youtube')

// Safety cap on imported file size so creators can test imports quickly.
const MAX_IMPORT_BYTES = (parseInt(process.env.MAX_YOUTUBE_IMPORT_MB || '100', 10) || 100) * 1024 * 1024

// In-memory job registry for a single-process deployment. Client polls status.
const jobs = new Map()

function ensureWorkDir() {
  if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true })
}

function parseYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

export function getYoutubeJob(jobId) {
  return jobs.get(jobId) || null
}

export function getYoutubeJobByUploadId(uploadId) {
  for (const job of jobs.values()) {
    if (job.uploadId === uploadId) return job
  }
  return null
}

function runYtJson(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP, args)
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => { out += d.toString() })
    child.stderr.on('data', (d) => { err += d.toString() })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0 && out.trim()) {
        try {
          resolve({ json: JSON.parse(out) })
        } catch (e) {
          reject(new Error('Failed to parse yt-dlp output'))
        }
      } else {
        reject(new Error(`yt-dlp probe failed: ${err.slice(-200)}`))
      }
    })
  })
}

/**
 * Probe a YouTube URL with yt-dlp and return metadata + available qualities.
 */
export async function probeYoutube(url) {
  const id = parseYoutubeId(url)
  if (!id) {
    throw new Error('Not a valid YouTube URL')
  }
  const args = ['--skip-download', '--no-playlist', '--no-warnings', '--dump-json', url]
  const { json } = await runYtJson(args)
  const formats = (json.formats || []).filter((f) => f.vcodec && f.vcodec !== 'none')
  const heights = [...new Set(formats.map((f) => f.height).filter(Boolean))].sort((a, b) => b - a)

  return {
    id,
    title: json.title || '',
    thumbnail: json.thumbnail || '',
    duration: json.duration || 0,
    durationLabel: json.duration_string || '',
    heights,
  }
}

/**
 * Start an import: probes, downloads at chosen quality, uploads to R2, and
 * creates the upload row. Progress is tracked in the job registry.
 */
export async function startYoutubeImport({ url, height, title, description, genre, userId }) {
  const info = await probeYoutube(url)
  if (!info.heights.includes(height)) {
    throw new Error(`Quality ${height}p is not available for this video`)
  }

  ensureWorkDir()
  const uploadId = uuidv4()
  const jobId = uuidv4()
  const filePath = path.join(WORK_DIR, `${uploadId}.mp4`)

  jobs.set(jobId, {
    jobId,
    uploadId,
    status: 'processing',
    progress: 0,
    error: null,
    created: Date.now(),
    source: 'youtube',
    url,
  })

  // Kick off the async download (no await — caller returns jobId immediately).
  downloadAndStore({
    jobId,
    uploadId,
    url,
    height,
    title,
    description,
    genre,
    userId,
    filePath,
    info,
  }).catch((err) => {
    console.error('[youtube-import] Failed:', err.message)
    const job = jobs.get(jobId)
    if (job) {
      job.status = 'error'
      job.error = err.message
    }
  })

  return { jobId, uploadId }
}

async function downloadAndStore({ jobId, uploadId, url, height, title, description, genre, userId, filePath, info }) {
  const attemptDownload = () => new Promise((resolve, reject) => {
    const args = [
      '-f', `bv*[height<=${height}]+ba/b[height<=${height}]/b`,
      '--max-filesize', `${Math.floor(MAX_IMPORT_BYTES / 1024 / 1024)}M`,
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--no-warnings',
      '--retries', '5',
      '--fragment-retries', '10',
      '--socket-timeout', '30',
      '-o', filePath,
      url,
    ]
    const child = spawn(YT_DLP, args, { cwd: WORK_DIR })
    let buf = ''
    child.stdout.on('data', (d) => { buf += d.toString() })
    child.stderr.on('data', (d) => {
      buf += d.toString()
      const lines = buf.split('\r')
      buf = lines.pop() || ''
      for (const line of lines) {
        const m = line.match(/(\d+(?:\.\d+)?)%(?: of| \()/)
        if (m) {
          const job = jobs.get(jobId)
          if (job) job.progress = Math.round(parseFloat(m[1]))
        }
        const merge = line.match(/\[Merger\]/i)
        if (merge) {
          const job = jobs.get(jobId)
          if (job) job.progress = 99
        }
      }
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(filePath)) resolve()
      else reject(new Error(`yt-dlp exited with code ${code}: ${buf.slice(-400)}`))
    })
  })

  // Fallback for videos that don't expose separate audio+video streams:
  // grab the best single-file (muxed) stream at or below the requested height.
  const attemptDownloadSingle = () => new Promise((resolve, reject) => {
    const args = [
      '-f', `best[height<=${height}]/best`,
      '--max-filesize', `${Math.floor(MAX_IMPORT_BYTES / 1024 / 1024)}M`,
      '--no-playlist',
      '--no-warnings',
      '--retries', '5',
      '--fragment-retries', '10',
      '--socket-timeout', '30',
      '-o', filePath,
      url,
    ]
    const child = spawn(YT_DLP, args, { cwd: WORK_DIR })
    let buf = ''
    child.stdout.on('data', (d) => { buf += d.toString() })
    child.stderr.on('data', (d) => {
      buf += d.toString()
      const lines = buf.split('\r')
      buf = lines.pop() || ''
      for (const line of lines) {
        const m = line.match(/(\d+(?:\.\d+)?)%(?: of| \()/)
        if (m) {
          const job = jobs.get(jobId)
          if (job) job.progress = Math.round(parseFloat(m[1]))
        }
      }
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(filePath)) resolve()
      else reject(new Error(`yt-dlp exited with code ${code}: ${buf.slice(-400)}`))
    })
  })

  // YouTube frequently rate-limits/errors transiently — retry the download,
  // falling back to the single-file format on persistent failure.
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await attemptDownload()
      lastErr = null
      break
    } catch (err) {
      lastErr = err
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {})
      await new Promise((r) => setTimeout(r, attempt * 3000))
    }
  }
  if (lastErr) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await attemptDownloadSingle()
        lastErr = null
        break
      } catch (err) {
        lastErr = err
        if (fs.existsSync(filePath)) fs.unlink(filePath, () => {})
        await new Promise((r) => setTimeout(r, attempt * 3000))
      }
    }
  }
  if (lastErr) throw lastErr

  // Push the file to storage.
  const buffer = fs.readFileSync(filePath)
  const movie = await uploadFile({
    buffer,
    key: `movies/${userId}/${uploadId}.mp4`,
    contentType: 'video/mp4',
  })
  if (!movie.success) throw new Error(movie.error || 'Video upload failed')

  // Grab a poster from YouTube thumbnails (try maxres, then hq).
  let thumbnailUrl = ''
  const candidates = [
    `https://i.ytimg.com/vi/${info.id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
  ]
  for (const candidate of candidates) {
    try {
      const resp = await axios.get(candidate, { responseType: 'arraybuffer', timeout: 8000 })
      const thumb = await uploadFile({
        buffer: resp.data,
        key: `movies/${userId}/${uploadId}-thumb.jpg`,
        contentType: 'image/jpeg',
      })
      if (thumb.success) {
        thumbnailUrl = thumb.url
        break
      }
    } catch {}
  }

  fs.unlink(filePath, () => {})

  const upload = await addUpload({
    id: uploadId,
    userId,
    title: title || info.title,
    description: description || '',
    genre: genre || '',
    filename: movie.url,
    thumbnailUrl,
    filesize: buffer.length,
    status: 'active',
    views: 0,
    minutesWatched: 0,
    revenue: 0,
    sourceType: 'youtube',
    youtubeId: info.id,
    youtubeUrl: url,
    quality: `${height}p`,
    durationSeconds: info.duration,
  })

  const job = jobs.get(jobId)
  if (job) {
    job.status = 'done'
    job.progress = 100
    job.uploadId = upload.id
  }
}