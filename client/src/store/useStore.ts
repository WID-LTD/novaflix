import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '../types'

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

interface PlaybackSettings {
  defaultQuality: 'auto' | '720p' | '1080p' | '4k'
  subtitleSize: 'small' | 'medium' | 'large'
  autoplay: boolean
  subtitleLanguage: string
}

interface NotificationSettings {
  newReleases: boolean
  watchlistUpdates: boolean
  creatorActivity: boolean
  marketing: boolean
}

interface Store {
  watchlist: WatchlistItem[]
  continueWatching: ContinueWatchingItem[]
  recentlySearched: string[]
  sidebarCollapsed: boolean
  mobileDrawerOpen: boolean
  currentProfile: string | null
  profiles: UserProfile[]
  playbackSettings: PlaybackSettings
  notificationSettings: NotificationSettings

  addToWatchlist: (item: WatchlistItem) => void
  removeFromWatchlist: (id: number) => void
  isInWatchlist: (id: number) => boolean
  addToContinueWatching: (item: ContinueWatchingItem) => void
  updateProgress: (id: number, progress: number, duration: number) => void
  addRecentSearch: (query: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileDrawerOpen: (open: boolean) => void
  toggleMobileDrawer: () => void
  setCurrentProfile: (id: string | null) => void
  setProfiles: (profiles: UserProfile[]) => void
  updatePlaybackSettings: (settings: Partial<PlaybackSettings>) => void
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      watchlist: [],
      continueWatching: [],
      recentlySearched: [],
      sidebarCollapsed: true,
      mobileDrawerOpen: false,
      currentProfile: null,
      profiles: [],
      playbackSettings: {
        defaultQuality: 'auto',
        subtitleSize: 'medium',
        autoplay: true,
        subtitleLanguage: 'en',
      },
      notificationSettings: {
        newReleases: true,
        watchlistUpdates: true,
        creatorActivity: false,
        marketing: false,
      },

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
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
      toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),

      setCurrentProfile: (id) => set({ currentProfile: id }),

      setProfiles: (profiles) => set({ profiles }),

      updatePlaybackSettings: (settings) =>
        set((state) => ({
          playbackSettings: { ...state.playbackSettings, ...settings },
        })),

      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
        })),
    }),
    {
      name: 'novaflix-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        continueWatching: state.continueWatching,
        recentlySearched: state.recentlySearched,
        currentProfile: state.currentProfile,
        profiles: state.profiles,
        playbackSettings: state.playbackSettings,
        notificationSettings: state.notificationSettings,
        // Persist sidebar collapse so the choice survives reloads.
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
