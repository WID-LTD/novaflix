import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchMedia } from '../../lib/api'
import { useStore } from '../../store/useStore'
import Icon from './Icon'

interface SearchLightboxProps {
  open: boolean
  onClose: () => void
}

export default function SearchLightbox({ open, onClose }: SearchLightboxProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'movie' | 'tv'>('movie')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const recentlySearched = useStore((s) => s.recentlySearched)
  const addRecentSearch = useStore((s) => s.addRecentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSuggestions([])
      setSelectedIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const doFetch = useCallback(async (q: string, t: 'movie' | 'tv') => {
    if (!q.trim()) { setSuggestions([]); return }
    setLoading(true)
    const res = await searchMedia(q.trim(), t)
    if (res.success) {
      setSuggestions(res.data.slice(0, 8))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doFetch(query, type), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, type, doFetch])

  const handleSubmit = () => {
    if (!query.trim()) return
    addRecentSearch(query.trim())
    onClose()
    navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        e.preventDefault()
        break
      case 'ArrowUp':
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        e.preventDefault()
        break
      case 'Enter':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const item = suggestions[selectedIndex]
          onClose()
          navigate(`/${item.type}/${item.id}`)
        } else {
          handleSubmit()
        }
        e.preventDefault()
        break
      case 'Escape':
        onClose()
        break
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col"
          onClick={onClose}
        >
          <div
            className="w-full max-w-2xl mx-auto mt-16 md:mt-24 px-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search movies, TV shows..."
                className="w-full bg-white text-black font-bold text-lg md:text-xl rounded-2xl py-5 px-6 pr-14 placeholder-gray-400 outline-none shadow-2xl"
              />
              <button
                onClick={handleSubmit}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600"
                aria-label="Search"
              >
                <Icon name="search" />
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setType('movie')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  type === 'movie' ? 'bg-primary-container text-on-primary-container' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setType('tv')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  type === 'tv' ? 'bg-primary-container text-on-primary-container' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                TV Shows
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-4 bg-white rounded-2xl overflow-hidden shadow-2xl divide-y divide-gray-100">
                {suggestions.map((item, i) => (
                  <button
                    key={`${item.id}-${item.type}`}
                    onClick={() => {
                      onClose()
                      navigate(`/${item.type}/${item.id}`)
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                      i === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    {item.poster ? (
                      <img src={item.poster} alt="" className="w-12 h-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                        <Icon name="movie" className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.year} · {item.type === 'movie' ? 'Movie' : 'TV'}</p>
                    </div>
                    <Icon name="chevron_right" className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {!query && recentlySearched.length > 0 && (
              <div className="mt-6">
                <p className="text-white/60 text-sm mb-3 font-semibold">Recent Searches</p>
                <div className="flex flex-wrap gap-2">
                  {recentlySearched.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s)
                        addRecentSearch(s)
                      }}
                      className="px-4 py-2 bg-white/10 rounded-full text-sm text-white hover:bg-white/20 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!query && recentlySearched.length === 0 && (
              <div className="mt-16 text-center">
                <Icon name="search" className="text-5xl text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-lg">Search for movies and TV shows</p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close search"
          >
            <Icon name="close" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}