import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchMedia } from '../../lib/api'
import { useStore } from '../../store/useStore'
import Icon from './Icon'

interface SearchLightboxProps {
  open: boolean
  onClose: () => void
  variant?: 'fullscreen' | 'navbar'
}

export default function SearchLightbox({ open, onClose, variant = 'fullscreen' }: SearchLightboxProps) {
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

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTypeSelect = (t: 'movie' | 'tv') => {
    setType(t)
    setMenuOpen(false)
    if (query.trim()) {
      addRecentSearch(query.trim())
      onClose()
      navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${t}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (e.target.value.trim()) setMenuOpen(true)
  }

  if (variant === 'navbar') {
    if (!open) return null
    return (
      <div className="flex items-center flex-1 gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query.trim() || recentlySearched.length > 0) setMenuOpen(true) }}
            placeholder="Search movies, TV shows..."
            className="w-full bg-white/10 backdrop-blur-xl text-white font-bold text-sm md:text-base rounded-xl py-2 px-4 pr-10 placeholder-gray-500 outline-none shadow-lg border-2 border-red-500 h-10"
          />
          <button
            onClick={() => {
              if (query.trim()) {
                handleSubmit()
              } else {
                setMenuOpen(v => !v)
                inputRef.current?.focus()
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/20 transition-colors text-gray-400"
            aria-label="Search"
          >
            <Icon name="search" size="sm" />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
            >
              <div className="flex gap-2 p-3">
                <button
                  onClick={() => handleTypeSelect('movie')}
                  className={`flex-1 rounded-lg text-center text-sm font-semibold transition-colors py-2 ${
                    type === 'movie' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white/10 text-on-surface-variant hover:bg-red-500 hover:text-white'
                  }`}
                >
                  Movies
                </button>
                <button
                  onClick={() => handleTypeSelect('tv')}
                  className={`flex-1 rounded-lg text-center text-sm font-semibold transition-colors py-2 ${
                    type === 'tv' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white/10 text-on-surface-variant hover:bg-red-500 hover:text-white'
                  }`}
                >
                  TV Shows
                </button>
              </div>

              {query && suggestions.length > 0 && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {suggestions.map((item, i) => (
                    <button
                      key={`${item.id}-${item.type}`}
                      onClick={() => {
                        onClose()
                        navigate(`/${item.type}/${item.id}`)
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        i === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      {item.poster ? (
                        <img src={item.poster} alt="" className="w-8 h-11 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-11 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                          <Icon name="movie" size="xs" className="text-on-surface-variant/40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-on-surface text-sm truncate">{item.title}</p>
                        <p className="text-xs text-on-surface-variant/60">{item.year} · {item.type === 'movie' ? 'Movie' : 'TV'}</p>
                      </div>
                      <Icon name="chevron_right" className="text-on-surface-variant/20 shrink-0" size="sm" />
                    </button>
                  ))}
                </div>
              )}

              {!query && recentlySearched.length > 0 && (
                <div className="p-4">
                  <p className="text-on-surface-variant/60 text-xs mb-2 font-semibold">Recent Searches</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentlySearched.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setQuery(s)
                          addRecentSearch(s)
                          inputRef.current?.focus()
                        }}
                        className="px-3 py-1.5 bg-white/10 rounded-full text-xs text-on-surface-variant hover:bg-white/20 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!query && recentlySearched.length === 0 && (
                <div className="p-6 text-center">
                  <Icon name="search" className="text-2xl text-on-surface-variant/20 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant/40">Search for movies and TV shows</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-on-surface-variant shrink-0"
          aria-label="Close search"
        >
          <Icon name="close" size="sm" />
        </button>
      </div>
    )
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
                className="w-full bg-white/10 backdrop-blur-xl text-black font-bold text-lg md:text-xl rounded-2xl py-5 px-6 pr-14 placeholder-gray-400 outline-none shadow-2xl border-2 border-red-500"
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