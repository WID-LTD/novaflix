import { useRef, useState } from 'react'
import Icon from '../ui/Icon'
import type { CastMember, CrewMember } from '../../lib/api'

const IMG_BASE = 'https://image.tmdb.org/t/p/w185'

type Person = { id: number | string; name: string; profile_path: string | null; detail: string }

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
}

function PersonCard({ person }: { person: Person }) {
  return (
    <div className="flex-shrink-0 w-[116px] snap-start">
      {person.profile_path ? (
        <div className="w-full aspect-square overflow-hidden rounded-full bg-surface-container-high border border-white/5 mb-3">
          <img
            src={`${IMG_BASE}${person.profile_path}`}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).classList.add('hidden') }}
          />
        </div>
      ) : (
        <div className="w-full aspect-square rounded-full bg-surface-container-high border border-white/5 mb-3 flex flex-col items-center justify-center gap-1 text-on-surface-variant/70">
          <Icon name="person" className="text-3xl" />
          <span className="text-xs font-bold tracking-wide text-on-surface-variant">{initials(person.name)}</span>
        </div>
      )}
      <p className="text-sm font-semibold text-on-surface leading-tight text-center truncate" title={person.name}>
        {person.name}
      </p>
      <p className="text-xs text-on-surface-variant/80 leading-tight text-center truncate mt-0.5" title={person.detail}>
        {person.detail}
      </p>
    </div>
  )
}

interface CastCrewProps {
  cast: CastMember[]
  crew: CrewMember[]
}

export default function CastCrew({ cast, crew }: CastCrewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 10)
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const people: Person[] = [
    ...cast.map((c) => ({ id: c.id, name: c.name, profile_path: c.profile_path, detail: c.character })),
    ...crew.map((c) => ({ id: `c-${c.id}-${c.job}`, name: c.name, profile_path: c.profile_path, detail: c.job })),
  ]

  if (people.length === 0) return null

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-headline-md">Cast &amp; Crew</h3>
        <div className="flex items-center gap-2">
          {showLeft && (
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-1.5 rounded-full bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 transition-colors"
            >
              <Icon name="chevron_left" className="text-lg" />
            </button>
          )}
          {showRight && (
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-1.5 rounded-full bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 transition-colors"
            >
              <Icon name="chevron_right" className="text-lg" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-2 snap-x"
      >
        {people.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
    </div>
  )
}