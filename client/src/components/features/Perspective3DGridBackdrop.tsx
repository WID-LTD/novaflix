import { useState, useEffect, useRef } from 'react'
import { getTrendingFeed } from '../../lib/api'

interface BackdropItem {
  backdrop: string | null
  title: string
}

const transforms = [
  'perspective(1200px) rotateY(6deg) rotateX(-4deg) scale(1.15)',
  'perspective(1200px) rotateY(-6deg) rotateX(-4deg) scale(1.15)',
  'perspective(1200px) rotateY(6deg) rotateX(4deg) scale(1.15)',
  'perspective(1200px) rotateY(-6deg) rotateX(4deg) scale(1.15)',
]

const origins = [
  'top left',
  'top right',
  'bottom left',
  'bottom right',
]

export default function Perspective3DGridBackdrop() {
  const [items, setItems] = useState<BackdropItem[]>([])
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    getTrendingFeed().then((res) => {
      if (!res.success || !mounted.current) return
      const all = [...res.data.movies, ...res.data.tv]
        .filter((m) => m.backdrop)
        .slice(0, 4)
      if (all.length > 0) setItems(all)
    })
    return () => { mounted.current = false }
  }, [])

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-primary-container/10 to-background" />
    )
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-background">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="relative overflow-hidden"
            style={{
              transform: transforms[i],
              transformOrigin: origins[i],
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                opacity: 0,
                animation: `fadeInOpacity 0.8s ease-out ${i * 0.2}s forwards`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{ transform: 'scale(1.3)' }}
              >
                <img
                  src={item.backdrop!}
                  alt={item.title}
                  className="w-full h-full object-cover backdrop-zoom"
                  loading="eager"
                />
              </div>
            </div>
            <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/40" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-black/40" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
    </div>
  )
}
