import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MediaItem } from '../../types'
import MovieCard from './MovieCard'
import Skeleton from '../ui/Skeleton'
import Icon from '../ui/Icon'

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
    <section className="relative mb-8 md:mb-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-headline-md text-on-surface flex items-center gap-2">
          {title}
          <Icon name="chevron_right" className="text-primary" />
        </h2>
        {link && (
          <Link
            to={link}
            className="font-label-md text-label-md text-primary hover:underline transition-colors"
          >
            View All
          </Link>
        )}
      </div>

      <div className="relative group">
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-r from-background to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Scroll left"
          >
            <Icon name="chevron_left" className="text-on-surface" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x"
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
            className="absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-l from-background to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Scroll right"
          >
            <Icon name="chevron_right" className="text-on-surface" />
          </button>
        )}
      </div>
    </section>
  )
}
