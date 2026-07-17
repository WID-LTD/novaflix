import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHooksFeed } from '../lib/api'
import Icon from '../components/ui/Icon'
import HooksCard from '../components/features/HooksCard'
import type { HookItem } from '../types'

export default function HooksFeed() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<HookItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPage = useCallback(async (pageNum: number) => {
    const res = await getHooksFeed(pageNum)
    if (res.success) {
      setItems(prev => pageNum === 1 ? res.data : [...prev, ...res.data])
      setHasMore(!!res.nextPage)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  // IntersectionObserver to detect which card is most in view
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-index') || '0', 10)
            setActiveIndex(idx)
          }
        }
      },
      { threshold: 0.7 }
    )

    const cards = container.querySelectorAll('[data-index]')
    cards.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [items])

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage(prev => prev + 1)
          fetchPage(page + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, page, fetchPage])

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 z-30 w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 active:scale-90 transition-all"
        aria-label="Close hooks feed"
      >
        <Icon name="close" className="text-white" />
      </button>

      {/* Index indicator */}
      <div className="absolute top-4 left-4 z-30 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white/60">
        {activeIndex + 1} / {items.length}
      </div>

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >
        {items.map((item, i) => (
          <div key={item.id} data-index={i}>
            <HooksCard item={item} active={i === activeIndex} />
          </div>
        ))}

        {loading && (
          <div className="h-dvh w-full flex-shrink-0 snap-start bg-surface-container flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  )
}
