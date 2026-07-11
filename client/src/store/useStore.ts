import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistItem {
  id: number
  title: string
  poster: string | null
  type: 'movie' | 'tv'
  year: string
}

interface ContinueWatchingItem {
  id: number
  title: string
  poster: string | null
  type: 'movie' | 'tv'
  season?: number
  episode?: number
  progress: number
  duration: number
}

interface Store {
  watchlist: WatchlistItem[]
  continueWatching: ContinueWatchingItem[]
  recentlySearched: string[]
  sidebarCollapsed: boolean
  addToWatchlist: (item: WatchlistItem) => void
  removeFromWatchlist: (id: number) => void
  isInWatchlist: (id: number) => boolean
  addToContinueWatching: (item: ContinueWatchingItem) => void
  updateProgress: (id: number, progress: number, duration: number) => void
  addRecentSearch: (query: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      watchlist: [],
      continueWatching: [],
      recentlySearched: [],
      sidebarCollapsed: false,

      addToWatchlist: (item) =>
        set((state) => {
          if (state.watchlist.some((w) => w.id === item.id)) return state
          return { watchlist: [item, ...state.watchlist] }
        }),

      removeFromWatchlist: (id) =>
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.id !== id),
        })),

      isInWatchlist: (id) => get().watchlist.some((w) => w.id === id),

      addToContinueWatching: (item) =>
        set((state) => {
          const existing = state.continueWatching.findIndex((c) => c.id === item.id && c.type === item.type)
          if (existing >= 0) {
            const updated = [...state.continueWatching]
            updated[existing] = item
            return { continueWatching: updated }
          }
          return { continueWatching: [item, ...state.continueWatching].slice(0, 20) }
        }),

      updateProgress: (id, progress, duration) =>
        set((state) => ({
          continueWatching: state.continueWatching.map((c) =>
            c.id === id ? { ...c, progress, duration } : c
          ),
        })),

      addRecentSearch: (query) =>
        set((state) => {
          const filtered = state.recentlySearched.filter((s) => s !== query)
          return { recentlySearched: [query, ...filtered].slice(0, 10) }
        }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'novaflix-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        continueWatching: state.continueWatching,
        recentlySearched: state.recentlySearched,
      }),
    }
  )
)
