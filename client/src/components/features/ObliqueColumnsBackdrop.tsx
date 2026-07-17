import { useState, useEffect, useRef } from 'react'
import { getTrendingFeed } from '../../lib/api'

interface BackdropItem {
  backdrop: string | null
  title: string
}

const SKEW_DEG = 18

export default function ObliqueColumnsBackdrop() {
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
      <div className="absolute inset-0 flex">
        {items.map((item, i) => (
          <div
            key={i}
            className="relative flex-1 overflow-hidden"
            style={{
              transform: `skewX(-${SKEW_DEG}deg)`,
              marginLeft: i > 0 ? '-3%' : 0,
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
                style={{
                  transform: `skewX(${SKEW_DEG}deg) scale(1.3)`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={item.backdrop!}
                  alt={item.title}
                  className="w-full h-full object-cover backdrop-zoom"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
    </div>
  )
}
