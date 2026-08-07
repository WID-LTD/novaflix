import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import { uploadFilm, createEgg } from '../lib/auth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
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
  const [uploadId, setUploadId] = useState('')
  const [showEggModal, setShowEggModal] = useState(false)
  const [eggTs, setEggTs] = useState(0)
  const [eggX, setEggX] = useState(0.5)
  const [eggY, setEggY] = useState(0.5)
  const [eggHint, setEggHint] = useState('')
  const [eggRewardType, setEggRewardType] = useState<'badge' | 'secret_room'>('badge')
  const [eggRoomName, setEggRoomName] = useState('')
  const [eggRoomDesc, setEggRoomDesc] = useState('')
  const [eggSaving, setEggSaving] = useState(false)
  const previewRef = useRef<HTMLVideoElement>(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (!showEggModal) return
    const t = setTimeout(() => {
      const v = previewRef.current
      if (v) v.currentTime = 0
    }, 200)
    return () => clearTimeout(t)
  }, [showEggModal])

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
      setUploadId(res.upload?.id || '')
      setUploaded(true)
    } else {
      toast.error(res.error || 'Upload failed')
    }
  }

  const handlePreviewClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const v = previewRef.current
    if (!v) return
    const rect = v.getBoundingClientRect()
    setEggTs(Number(v.currentTime.toFixed(2)))
    setEggX(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
    setEggY(Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)))
  }

  const handleSaveEgg = async () => {
    if (!user || !uploadId) return
    if (eggTs <= 0) {
      toast.error('Scrub the preview and click the exact frame to set the hidden moment')
      return
    }
    setEggSaving(true)
    const token = localStorage.getItem('novaflix-token') || ''
    const res = await createEgg(token, {
      contentId: uploadId,
      ts: eggTs,
      x: eggX,
      y: eggY,
      hint: eggHint,
      rewardType: eggRewardType,
      rewardName: eggRoomName,
      rewardDescription: eggRoomDesc,
    })
    setEggSaving(false)
    if (res.success) {
      toast.success('Hidden key added! Fans who pause at the right moment will find it.')
      setShowEggModal(false)
      setEggHint('')
      setEggRoomName('')
      setEggRoomDesc('')
    } else {
      toast.error(res.error || 'Failed to add key')
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
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
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => setShowEggModal(true)} variant="secondary">
              <Icon name="vpn_key" size="sm" className="mr-2" />
              Add Hidden Key
            </Button>
            <Button onClick={() => setUploaded(false)}>Upload Another</Button>
          </div>
          <p className="text-on-surface-variant/40 text-xs mt-6">
            Tip: hide a digital key at a memorable moment to unlock badges & secret rooms for your fans.
          </p>
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

      <Modal isOpen={showEggModal} onClose={() => setShowEggModal(false)} title="Add a Hidden Key">
        <div className="space-y-4">
          <div>
            <p className="text-on-surface-variant text-sm mb-2">
              Scrub the preview and <span className="text-primary-container font-medium">click the exact frame</span> to mark the hidden moment.
            </p>
            {videoFile && (
              <video
                ref={previewRef}
                src={URL.createObjectURL(videoFile)}
                onClick={handlePreviewClick}
                muted
                controls
                className="w-full aspect-video rounded-xl bg-black"
              />
            )}
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-on-surface-variant">
                Time: <span className="font-mono text-on-surface">{formatTime(eggTs)}</span>
              </span>
              <span className="text-on-surface-variant">
                Spot: <span className="font-mono text-on-surface">
                  ({eggX.toFixed(2)}, {eggY.toFixed(2)})
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const v = previewRef.current
                if (v) {
                  v.pause()
                  v.currentTime = 0
                }
                setEggTs(0)
              }}
              className="text-xs text-primary-container mt-1"
            >
              Clear selection
            </button>
          </div>

          <div>
            <label className="text-on-surface-variant text-sm mb-1.5 block">
              <Icon name="lightbulb" size="sm" className="inline mr-1.5" /> Clue (shown when fans are close)
            </label>
            <Input
              placeholder="e.g. 'There is no spoon'"
              value={eggHint}
              onChange={(e) => setEggHint(e.target.value)}
            />
          </div>

          <div>
            <label className="text-on-surface-variant text-sm mb-2 block">Reward</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEggRewardType('badge')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-colors ${
                  eggRewardType === 'badge'
                    ? 'border-primary-container bg-primary-container/10 text-on-surface'
                    : 'border-outline/30 text-on-surface-variant hover:border-outline/60'
                }`}
              >
                <Icon name="military_tech" />
                Badge
              </button>
              <button
                type="button"
                onClick={() => setEggRewardType('secret_room')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-colors ${
                  eggRewardType === 'secret_room'
                    ? 'border-primary-container bg-primary-container/10 text-on-surface'
                    : 'border-outline/30 text-on-surface-variant hover:border-outline/60'
                }`}
              >
                <Icon name="door_front" />
                Secret Room
              </button>
            </div>
          </div>

          {eggRewardType === 'secret_room' && (
            <div className="space-y-3">
              <div>
                <label className="text-on-surface-variant text-sm mb-1.5 block">Room Name</label>
                <Input
                  placeholder="e.g. The Directors' Lounge"
                  value={eggRoomName}
                  onChange={(e) => setEggRoomName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-on-surface-variant text-sm mb-1.5 block">Room Invite Message</label>
                <textarea
                  value={eggRoomDesc}
                  onChange={(e) => setEggRoomDesc(e.target.value)}
                  placeholder="Describe the secret you've unlocked for your fans…"
                  rows={3}
                  className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container resize-none"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSaveEgg}
            size="lg"
            className="w-full"
            loading={eggSaving}
            disabled={eggTs <= 0 || eggSaving}
          >
            <Icon name="vpn_key" size="sm" className="mr-2" />
            Place Hidden Key
          </Button>
        </div>
      </Modal>
    </div>
  )
}
