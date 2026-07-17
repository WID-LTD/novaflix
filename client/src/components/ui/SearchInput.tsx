import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchMedia } from '../../lib/api'
import Input from './Input'
import Icon from './Icon'
import type { MediaItem } from '../../types'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit?: (e: React.FormEvent) => void
  onClear?: () => void
}

export default function SearchInput({ placeholder = 'Search...', value, onChange, onSubmit, onClear }: SearchInputProps) {
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState<MediaItem[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const doFetch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    setLoading(true)
    const [movieRes, tvRes] = await Promise.all([
      searchMedia(q.trim(), 'movie'),
      searchMedia(q.trim(), 'tv'),
    ])
    const combined: MediaItem[] = []
    if (movieRes.success) combined.push(...movieRes.data.slice(0, 5))
    if (tvRes.success) combined.push(...tvRes.data.slice(0, 5))
    setSuggestions(combined)
    setShowDropdown(combined.length > 0)
    setSelectedIndex(-1)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doFetch(value), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, doFetch])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown') {
        setShowDropdown(true)
        setSelectedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        e.preventDefault()
        break
      case 'ArrowUp':
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        e.preventDefault()
        break
      case 'Enter':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const item = suggestions[selectedIndex]
          navigate(`/${item.type}/${item.id}`)
          setShowDropdown(false)
        }
        e.preventDefault()
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        e.preventDefault()
        break
    }
  }

  const handleSuggestionClick = (item: MediaItem) => {
    navigate(`/${item.type}/${item.id}`)
    setShowDropdown(false)
  }

  const handleClear = () => {
    setSuggestions([])
    setShowDropdown(false)
    onClear?.()
  }

  return (
    <div className="relative">
      <form onSubmit={onSubmit}>
        <Input
          ref={inputRef}
          icon={<Icon name="search" />}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className="text-base py-4 pl-12 pr-12"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-2"
            aria-label="Clear search"
          >
            <Icon name="close" />
          </button>
        )}
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
          role="listbox"
        >
          {suggestions.map((item, i) => (
            <button
              key={`${item.id}-${item.type}`}
              onClick={() => handleSuggestionClick(item)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              role="option"
              aria-selected={i === selectedIndex}
            >
              {item.poster ? (
                <img src={item.poster} alt="" className="w-10 h-14 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-14 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <Icon name="movie" size="sm" className="text-on-surface-variant/40" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-surface truncate">{item.title}</p>
                <p className="text-xs text-on-surface-variant/60">
                  {item.year} &middot; {item.type === 'movie' ? 'Movie' : 'TV'}
                </p>
              </div>
              <Icon name="chevron_right" size="sm" className="text-on-surface-variant/30 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
