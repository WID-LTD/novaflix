import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import { uploadFilm } from '../lib/auth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

export default function Upload() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('video/')) setVideoFile(file)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    setUploading(true)
    const token = localStorage.getItem('novaflix-token') || ''
    const res = await uploadFilm(token, {
      title,
      description,
      genre,
      videoFile: videoFile || undefined,
      posterFile: posterFile || undefined,
    })
    setUploading(false)
    if (res.success) {
      setUploaded(true)
    } else {
      toast.error(res.error || 'Upload failed')
    }
  }

  if (uploaded) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mx-auto mb-6">
            <Icon name="check_circle" className="w-10 h-10 text-primary-container" />
          </div>
          <h1 className="text-headline-md font-bold mb-3">Uploaded Successfully!</h1>
          <p className="text-on-surface-variant mb-2">Your film is being processed.</p>
          <p className="text-on-surface-variant/60 text-sm mb-8">It will be reviewed and published within 24 hours.</p>
          <Button onClick={() => setUploaded(false)}>Upload Another</Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon name="cloud_upload" className="w-8 h-8 text-primary-container" />
          <div>
            <h1 className="text-headline-md font-bold">Upload Your Film</h1>
            <p className="text-on-surface-variant/60 text-sm mt-1">Share your story with the world</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
              dragOver
                ? 'border-secondary bg-secondary/5'
                : videoFile
                  ? 'border-primary-container bg-primary-container/5'
                  : 'border-outline/30 hover:border-outline/50'
            }`}
          >
            {videoFile ? (
              <div>
                <Icon name="movie" className="w-12 h-12 text-primary-container mx-auto mb-3" />
                <p className="font-label-md text-label-md text-on-surface">{videoFile.name}</p>
                <p className="text-on-surface-variant/60 text-sm mt-1">
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  className="text-xs text-primary-container hover:text-red-400 mt-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Icon name="cloud_upload" className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm mb-1">
                  Drag & drop your video file here
                </p>
                <p className="text-on-surface-variant/60 text-xs mb-4">or</p>
                <label className="cursor-pointer">
                  <span className="inline-flex px-4 py-2 bg-surface-variant/20 border border-outline/30 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant/40 transition-colors">
                    Browse Files
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-on-surface-variant/40 text-xs mt-3">MP4, WebM, MOV • Max 2GB</p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-gutter">
            <div>
              <label className="text-on-surface-variant text-sm mb-1.5 block">
                <Icon name="movie" size="sm" className="inline mr-1.5" /> Film Title
              </label>
              <Input
                placeholder="Enter your film title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-on-surface-variant text-sm mb-1.5 block">
                <Icon name="local_offer" size="sm" className="inline mr-1.5" /> Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm on-surface focus:outline-none focus:border-primary-container"
                required
              >
                <option value="">Select genre</option>
                <option value="action">Action</option>
                <option value="comedy">Comedy</option>
                <option value="drama">Drama</option>
                <option value="horror">Horror</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="documentary">Documentary</option>
                <option value="animation">Animation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-on-surface-variant text-sm mb-1.5 block">
              <Icon name="description" size="sm" className="inline mr-1.5" /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your film..."
              rows={4}
              className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container resize-none"
              required
            />
          </div>

          <div>
            <label className="text-on-surface-variant text-sm mb-1.5 block">
              <Icon name="image" size="sm" className="inline mr-1.5" /> Poster Image
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2.5 bg-surface-variant/20 border border-outline/30 rounded-xl text-sm on-surface hover:bg-surface-variant/40 transition-colors">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                />
              </label>
              {posterFile && (
                <span className="text-on-surface-variant text-sm">{posterFile.name}</span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={uploading}
            disabled={!title || !videoFile || !genre || !description}
          >
            {uploading ? 'Uploading...' : 'Upload Film'}
          </Button>

          <p className="text-on-surface-variant/40 text-xs text-center">
            By uploading, you agree to our Content Guidelines and Terms of Service.
            Your film will be reviewed before publishing.
          </p>
        </form>
      </div>
    </div>
  )
}
