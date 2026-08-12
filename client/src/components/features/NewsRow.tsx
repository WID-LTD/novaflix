import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { NewsArticle } from '../../lib/api'
import Skeleton from '../ui/Skeleton'
import Icon from '../ui/Icon'

interface NewsRowProps {
  title: string
  articles: NewsArticle[]
  loading?: boolean
  link?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

function articleRoute(a: NewsArticle) {
  return { pathname: `/news/deep-dive/${encodeURIComponent(a.url)}`, state: { article: a } }
}

export default function NewsRow({ title, articles, loading, link }: NewsRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  if (!loading && articles.length === 0) return null

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
          <Icon name="newspaper" className="text-primary" />
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
                <div key={i} className="flex-shrink-0 w-[260px] md:w-[300px]">
                  <Skeleton variant="poster" className="w-full aspect-[16/10]" />
                  <Skeleton variant="text" className="w-1/3 mt-3" />
                  <Skeleton variant="text" className="w-full mt-2" />
                  <Skeleton variant="text" className="w-2/3 mt-1" />
                </div>
              ))
            : articles.map((a) => (
                <Link
                  key={a.id}
                  to={articleRoute(a)}
                  className="group flex-shrink-0 w-[260px] md:w-[300px] snap-start block"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-surface-container-high rounded-xl mb-3 border border-white/5">
                    {a.image ? (
                      <img
                        src={a.image}
                        alt={a.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={(e) => { (e.currentTarget.parentElement as HTMLElement).classList.add('hidden') }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                        <Icon name="newspaper" className="text-3xl" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/70 mb-1.5">
                    <span>{a.source}</span>
                    <span>·</span>
                    <span>{formatDate(a.publishedAt)}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {a.title}
                  </h3>
                </Link>
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