import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MediaItem } from '../../types'
import MovieCard from './MovieCard'
import Skeleton from '../ui/Skeleton'

interface ContentRowProps {
  title: string
  items: MediaItem[]
  loading?: boolean
  link?: string
}

export default function ContentRow({ title, items, loading, link }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 10)
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  return (
    <section className="relative mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-xl md:text-section font-bold text-white">{title}</h2>
        {link && (
          <Link
            to={link}
            className="text-sm text-gray-400 hover:text-accent transition-colors font-medium"
          >
            See All
          </Link>
        )}
      </div>

      <div className="relative group">
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-r from-surface to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto px-4 md:px-8 scrollbar-hide pb-2"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[160px] md:w-[180px]">
                  <Skeleton variant="poster" className="w-full" />
                  <Skeleton variant="text" className="w-3/4 mt-2" />
                  <Skeleton variant="text" className="w-1/2 mt-1" />
                </div>
              ))
            : items.map((item, i) => (
                <MovieCard key={`${item.id}-${item.type}`} item={item} index={i} />
              ))}
        </div>

        {showRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-l from-surface to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </section>
  )
}
