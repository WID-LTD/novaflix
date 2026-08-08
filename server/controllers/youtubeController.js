import { probeYoutube, startYoutubeImport, getYoutubeJob } from '../services/youtubeService.js'

export async function youtubePreview(req, res) {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'YouTube URL is required' })
    const info = await probeYoutube(url)
    res.json({ success: true, info })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function youtubeImport(req, res) {
  try {
    const { url, height, title, description, genre } = req.body
    if (!url) return res.status(400).json({ error: 'YouTube URL is required' })
    if (!height) return res.status(400).json({ error: 'Quality is required' })

    const { jobId, uploadId } = await startYoutubeImport({
      url,
      height,
      title: title || '',
      description: description || '',
      genre: genre || '',
      userId: req.userId,
    })

    res.json({ success: true, jobId, uploadId })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function youtubeImportStatus(req, res) {
  try {
    const { jobId } = req.params
    const job = getYoutubeJob(jobId)
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' })
    res.json({ success: true, job })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}