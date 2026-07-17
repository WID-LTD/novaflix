import { useState, useEffect } from 'react'
import { getTrendingFeed } from '../../lib/api'

interface BackdropItem {
  backdrop: string | null
  title: string
}

const panels = [
  { clip: 'polygon(50% 50%, 0 0, 100% 0)', delay: 0 },
  { clip: 'polygon(50% 50%, 100% 0, 100% 100%)', delay: 0.15 },
  { clip: 'polygon(50% 50%, 100% 100%, 0 100%)', delay: 0.3 },
  { clip: 'polygon(50% 50%, 0 100%, 0 0)', delay: 0.45 },
]

export default function LoginBackdrop() {
  const [items, setItems] = useState<BackdropItem[]>([])

  useEffect(() => {
    getTrendingFeed().then((res) => {
      if (!res.success) return
      const all = [...res.data.movies, ...res.data.tv]
        .filter((m) => m.backdrop)
        .slice(0, 4)
      if (all.length > 0) {
        setItems(all)
      }
    })
  }, [])

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-primary-container/10 to-background" />
    )
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute inset-0 backdrop-zoom"
          style={{
            clipPath: panels[i].clip,
            animationDelay: `${panels[i].delay}s`,
            opacity: 0,
            animation: `fadeIn 0.8s ease-out ${panels[i].delay}s forwards, backdropZoom 20s ease-in-out ${panels[i].delay}s infinite alternate`,
          }}
        >
          <img
            src={item.backdrop!}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
    </div>
  )
}
