import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HookItem } from '../../types'
import Icon from '../ui/Icon'

interface HooksCardProps {
  item: HookItem
  active: boolean
  onEnded?: () => void
}

export default function HooksCard({ item, active, onEnded }: HooksCardProps) {
  const navigate = useNavigate()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [posterHidden, setPosterHidden] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    if (!iframeRef.current || item.type === 'ad') return
    if (active) {
      iframeRef.current.src = item.videoUrl?.replace('autoplay=0', 'autoplay=1') || ''
      setPosterHidden(true)
    }
  }, [active, item.videoUrl, item.type])

  const toggleMute = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: muted ? 'unMute' : 'mute', args: '' }),
        '*'
      )
      setMuted(!muted)
    }
  }

  if (item.type === 'ad') {
    return (
      <div className="h-dvh w-full flex-shrink-0 snap-start bg-surface-container flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 border border-premium/30 flex items-center justify-center mx-auto mb-4">
            <Icon name="workspace_premium" className="w-8 h-8 text-primary-container" />
          </div>
          <p className="text-on-surface-variant text-sm">Sponsored Content</p>
          <p className="text-on-surface-variant/60 text-xs mt-1">Upgrade to Premium for fewer ads</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh w-full flex-shrink-0 snap-start relative bg-black">
      {/* Video / Poster */}
      <div className="absolute inset-0 flex items-center justify-center">
        {item.poster && !posterHidden && (
          <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
        )}
        <iframe
          ref={iframeRef}
          title={item.title}
          className="w-full h-full"
          style={{ pointerEvents: active ? 'auto' : 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
        <div className="flex items-center gap-2 mb-2">
          {item.promoted && (
            <span className="text-[10px] uppercase tracking-wider text-primary-container bg-primary-container/20 px-2 py-0.5 rounded font-semibold">
              Sponsored
            </span>
          )}
          <span className="text-xs text-on-surface-variant/60">{item.year}</span>
        </div>
        <h2 className="text-headline-md font-bold text-white mb-3">{item.title}</h2>

        <div className="flex gap-3">
          {item.mediaId && (
            <button
              onClick={() => navigate(`/${item.mediaType === 'tv' ? 'tv' : 'movie'}/${item.mediaId}`)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-xl font-semibold text-sm hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
            >
              <Icon name="play_arrow" fill={true} /> Watch Full Movie
            </button>
          )}
          <button
            onClick={toggleMute}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            <Icon name={muted ? 'volume_off' : 'volume_up'} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
