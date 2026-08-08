import { useRef, useState, useEffect } from 'react'

interface EmbedPlayerProps {
  embedUrl: string
  title?: string
}

export default function EmbedPlayer({ embedUrl, title }: EmbedPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [embedUrl])

  useEffect(() => {
    if (!fullscreen) {
      document.exitFullscreen?.()
      return
    }
    containerRef.current?.requestFullscreen?.().catch(() => {})
  }, [fullscreen])

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  if (error) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">Failed to load player</p>
          <p className="text-sm">Try refreshing or selecting a different source</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden group"
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        allowFullScreen
        title={title || 'Embedded Player'}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={() => setFullscreen(f => !f)}
          className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-lg transition-colors"
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
