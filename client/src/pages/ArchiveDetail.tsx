import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { getToken } from '../lib/auth'
import VideoPlayer from '../components/features/VideoPlayer'

const BASE = '/api'

export default function ArchiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = getToken()

  useEffect(() => {
    if (!id || !token) { setLoading(false); return }
    fetch(`${BASE}/archive/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(r => {
        if (r.success) setItem(r.item)
        else setError(r.error || 'Not found')
        setLoading(false)
      })
  }, [id, token])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-container" /></div>

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <Icon name="lock" className="text-5xl text-on-surface-variant/30" />
      <p className="text-body-lg text-on-surface-variant text-center">{error}</p>
      <button onClick={() => navigate('/pricing')} className="px-6 py-2.5 bg-primary-container text-on-primary-container rounded-xl font-label-md">View Plans</button>
    </div>
  )

  if (!item) return <div className="min-h-screen flex items-center justify-center"><p className="text-body-lg text-on-surface-variant">Not found</p></div>

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/archive')} className="flex items-center gap-2 text-label-md text-on-surface-variant hover:text-on-surface mb-6">
          <Icon name="arrow_back" /> Back to Vault
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-video bg-surface-container rounded-2xl flex items-center justify-center overflow-hidden">
            {item.poster_url ? (
              <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <Icon name="video_library" className="text-6xl text-on-surface-variant/20" />
            )}
          </div>
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface mb-3">{item.title}</h1>
            <div className="flex items-center gap-3 text-label-sm text-on-surface-variant mb-4">
              {item.year && <span>{item.year}</span>}
              {item.genre && <span>{item.genre}</span>}
              <span className="capitalize">{item.content_type}</span>
            </div>
            <p className="text-body-md text-on-surface-variant mb-6">{item.description}</p>
            {item.media_url && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-4">
                {item.media_url.includes('youtube') || item.media_url.includes('youtu.be') ? (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <img
                      src={`https://img.youtube.com/vi/${item.media_url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <button
                      onClick={() => window.open(item.media_url, '_blank')}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary-container/90 flex items-center justify-center hover:scale-110 transition-transform backdrop-blur-sm"
                      aria-label="Watch on YouTube"
                    >
                      <Icon name="play_arrow" fill={true} className="text-on-primary-container w-8 h-8 ml-1" />
                    </button>
                  </div>
                ) : item.content_type === 'video' ? (
                  <VideoPlayer
                    streamUrl={item.media_url}
                    autoPlay={false}
                    muted={false}
                    showControls={true}
                  />
                ) : item.content_type === 'audio' ? (
                  <audio src={item.media_url} controls className="w-full mt-4" />
                ) : (
                  <div className="p-4 text-center">
                    <a href={item.media_url} target="_blank" rel="noopener noreferrer" className="text-primary-container underline">Open content</a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
