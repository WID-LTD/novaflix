import { useState, useEffect, useRef, useCallback } from 'react'
import Icon from '../components/ui/Icon'
import { getNews, getIndustryNews, fetchDeepDive } from '../lib/api'
import type { NewsArticle, NewsDeepDive } from '../lib/api'
import NewsCard from '../components/features/news/NewsCard'
import DeepDiveModal from '../components/features/news/DeepDiveModal'

const FT_CATEGORIES = [
  'World', 'Politics', 'Business', 'Opinion', 'Tech', 'Science',
  'Sports', 'Arts', 'Books', 'Style', 'Food', 'Travel', 'Magazine',
]

const APP_CATEGORIES = [
  { id: 'movies', label: 'Movies' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'sports', label: 'Sports' },
  { id: 'general', label: 'Top Stories' },
]

const MOVIE_SUB_NAV = ['Pursuits', 'Trailers', 'Premieres', 'Announced']

const MOVIE_TERMS: Record<string, string> = {
  Pursuits: '',
  Trailers: 'trailer',
  Premieres: 'premiere',
  Announced: 'announced',
}

const FT_MAP: Record<string, { category: string; q: string }> = {
  World: { category: 'world', q: '' },
  Politics: { category: 'politics', q: '' },
  Business: { category: 'business', q: '' },
  Opinion: { category: 'general', q: 'opinion' },
  Tech: { category: 'technology', q: '' },
  Science: { category: 'science', q: '' },
  Sports: { category: 'sports', q: '' },
  Arts: { category: 'entertainment', q: 'arts' },
  Books: { category: 'general', q: 'books' },
  Style: { category: 'entertainment', q: 'style fashion' },
  Food: { category: 'food', q: '' },
  Travel: { category: 'travel', q: '' },
  Magazine: { category: 'general', q: '' },
}

const POLL_INTERVAL_MS = 15 * 1000

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-headline-md text-on-surface leading-none">{title}</h2>
    </div>
  )
}

function EmptyNote({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon name={icon} className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
      <p className="text-sm text-on-surface-variant">{text}</p>
    </div>
  )
}

function MoviesColumn({ articles, loading, subNav, onSubNav, onDeepDive, busy }: { articles: NewsArticle[]; loading: boolean; subNav: string; onSubNav: (item: string) => void; onDeepDive: (a: NewsArticle) => void; busy: boolean }) {
  const feature = articles[0]
  const thumbs = articles.slice(1, 5)

  return (
    <section className="min-w-0">
      <SectionTitle title="Movies" />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {MOVIE_SUB_NAV.map((item) => (
          <button
            key={item}
            onClick={() => onSubNav(item)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              subNav === item
                ? 'border-primary text-primary bg-primary-container/10'
                : 'border-white/10 text-on-surface-variant hover:text-on-surface hover:border-white/25'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="aspect-[16/9] bg-surface-container rounded-xl animate-pulse" />
          <div className="h-3 w-28 bg-surface-container rounded animate-pulse" />
          <div className="h-6 bg-surface-container rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-surface-container rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[16/10] bg-surface-container rounded-lg animate-pulse" />
                <div className="h-3 w-4/5 bg-surface-container rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : feature ? (
        <>
          <NewsCard article={feature} variant="feature" onDeepDive={onDeepDive} busy={busy} />
          {thumbs.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              {thumbs.map((a) => (
                <NewsCard key={a.id} article={a} variant="standard" onDeepDive={onDeepDive} busy={busy} />
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyNote icon="movie" text="No movie articles right now." />
      )}
    </section>
  )
}

function LatestNewsColumn({ articles, loading, onDeepDive, busy }: { articles: NewsArticle[]; loading: boolean; onDeepDive: (a: NewsArticle) => void; busy: boolean }) {
  return (
    <section className="min-w-0">
      <SectionTitle title="Latest News" />

      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-surface-container rounded" />
                <div className="h-4 w-full bg-surface-container rounded" />
                <div className="h-3 w-2/3 bg-surface-container rounded" />
              </div>
              <div className="w-24 h-16 bg-surface-container rounded-lg" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyNote icon="feed" text="No articles found. Try a different category." />
      ) : (
        <div className="divide-y divide-white/5">
          {articles.map((a) => (
            <NewsCard key={a.id} article={a} variant="row" onDeepDive={onDeepDive} busy={busy} />
          ))}
        </div>
      )}
    </section>
  )
}

function MostReadColumn({ articles, loading, onDeepDive, busy }: { articles: NewsArticle[]; loading: boolean; onDeepDive: (a: NewsArticle) => void; busy: boolean }) {
  const list = articles.slice(0, 5)

  return (
    <section className="min-w-0">
      <SectionTitle title="Most Read" />

      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center animate-pulse">
              <div className="w-6 h-6 rounded bg-surface-container" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full bg-surface-container rounded" />
                <div className="h-3 w-3/4 bg-surface-container rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyNote icon="trending_up" text="No popular articles yet." />
      ) : (
        <div className="divide-y divide-white/5">
          {list.map((a, i) => (
            <NewsCard key={a.id} article={a} variant="row" rank={i + 1} onDeepDive={onDeepDive} busy={busy} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function News() {
  const [category, setCategory] = useState('entertainment')
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [ft, setFt] = useState<string | null>(null)
  const [subNav, setSubNav] = useState(MOVIE_SUB_NAV[0])

  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [movies, setMovies] = useState<NewsArticle[]>([])
  const [industry, setIndustry] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [moviesLoading, setMoviesLoading] = useState(true)
  const [industryLoading, setIndustryLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [pendingNew, setPendingNew] = useState<NewsArticle[]>([])
  const [deepDive, setDeepDive] = useState<NewsArticle | null>(null)
  const [ddLoading, setDdLoading] = useState(false)
  const [ddData, setDdData] = useState<NewsDeepDive | null>(null)
  const [ddError, setDdError] = useState(false)

  const pollRef = useRef({ category, query, subNav })
  pollRef.current = { category, query, subNav }
  const feedKeyRef = useRef<string>(`${category}|${query}`)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const articlesRef = useRef<NewsArticle[]>([])

  const commitArticles = (next: NewsArticle[]) => {
    articlesRef.current = next
    setArticles(next)
  }

  const applyFeed = (res: { success: boolean; articles?: NewsArticle[]; nextPage?: number | null; errors?: string[] }) => {
    if (!res.success) {
      setErrors(['Failed to load news from the server.'])
      return
    }
    feedKeyRef.current = `${category}|${query}`
    commitArticles(res.articles || [])
    setNextPage(res.nextPage ?? null)
    setErrors(res.errors?.length ? res.errors : [])
    setLastRefreshed(new Date())
  }

  const applyNewStories = () => {
    commitArticles([...pendingNew, ...articlesRef.current])
    setPendingNew([])
  }

  // Debounced search so typing doesn't refetch on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let active = true
    setLoading(true)
    setPendingNew([])
    getNews(category, query, 1).then((res) => {
      if (!active) return
      applyFeed(res)
      setLoading(false)
    })
    return () => { active = false }
  }, [category, query])

  useEffect(() => {
    let active = true
    setMoviesLoading(true)
    getNews('movies', MOVIE_TERMS[subNav] || '').then((res) => {
      if (!active) return
      if (res.success) setMovies(res.articles || [])
      setMoviesLoading(false)
    })
    return () => { active = false }
  }, [subNav])

  useEffect(() => {
    let active = true
    setIndustryLoading(true)
    getIndustryNews().then((res) => {
      if (!active) return
      if (res.success) setIndustry(res.articles || [])
      setIndustryLoading(false)
    })
    return () => { active = false }
  }, [])

  // Realtime background refresh
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return
      const { category: c, query: q, subNav: s } = pollRef.current
      const key = `${c}|${q}`
      getNews(c, q, 1).then((res) => {
        if (!res.success || key !== feedKeyRef.current) return
        const seen = new Set(articlesRef.current.map((a) => a.id))
        const fresh = (res.articles || []).filter((a) => !seen.has(a.id))
        if (fresh.length) {
          commitArticles([...fresh, ...articlesRef.current])
          setPendingNew((prev) => [...prev, ...fresh])
        }
        setNextPage(res.nextPage ?? null)
        setLastRefreshed(new Date())
      })
      getNews('movies', MOVIE_TERMS[s] || '').then((res) => {
        if (res.success) setMovies(res.articles || [])
      })
      getIndustryNews().then((res) => {
        if (res.success) setIndustry(res.articles || [])
      })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Infinite scroll pagination
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || nextPage == null || loading || loadingMore) return
        setLoadingMore(true)
        getNews(category, query, nextPage).then((res) => {
          if (res.success && res.articles) {
            const seen = new Set(articlesRef.current.map((a) => a.id))
            const additions = res.articles!.filter((a) => !seen.has(a.id))
            commitArticles([...articlesRef.current, ...additions])
            setNextPage(res.nextPage ?? null)
          }
          setLoadingMore(false)
        })
      },
      { rootMargin: '300px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [nextPage, loading, loadingMore, category, query])

  const handleRefresh = async () => {
    setRefreshing(true)
    setPendingNew([])
    const [feed, mv] = await Promise.all([
      getNews(category, query, 1, true),
      getNews('movies', MOVIE_TERMS[subNav] || '', 1, true),
    ])
    if (feed.success) applyFeed(feed)
    if (mv.success) setMovies(mv.articles || [])
    getIndustryNews().then((res) => {
      if (res.success) setIndustry(res.articles || [])
    })
    setRefreshing(false)
  }

  const handleFt = (name: string) => {
    setFt(name)
    setPendingNew([])
    const mapped = FT_MAP[name] || { category: 'general', q: '' }
    setCategory(mapped.category)
    setQuery(mapped.q)
    setSearchInput(mapped.q)
  }

  const handleCategory = (id: string) => {
    setCategory(id)
    setQuery('')
    setSearchInput('')
    setFt(null)
    setPendingNew([])
  }

  const openDeepDive = useCallback(async (article: NewsArticle) => {
    if (ddLoading) return
    setDeepDive(article)
    setDdData(null)
    setDdError(false)
    setDdLoading(true)
    const keywords = [article.source, article.category].filter(Boolean) as string[]
    const res = await fetchDeepDive(article.title, keywords)
    setDdLoading(false)
    if (res.success) setDdData(res)
    else setDdError(true)
  }, [ddLoading])

  const closeDeepDive = useCallback(() => {
    setDeepDive(null)
    setDdData(null)
    setDdError(false)
    setDdLoading(false)
  }, [])

  const retryDeepDive = useCallback(async () => {
    if (!deepDive) return
    setDdData(null)
    setDdError(false)
    setDdLoading(true)
    const res = await fetchDeepDive(deepDive.title, [deepDive.source, deepDive.category].filter(Boolean) as string[])
    setDdLoading(false)
    if (res.success) setDdData(res)
    else setDdError(true)
  }, [deepDive])

  const now = new Date()
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' })
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]}, ${now.getFullYear()}`
  const mostReadPool = industry.length > 0 ? industry : articlesRef.current
  const dedupe = (list: NewsArticle[], used: Set<string>) => {
    const filtered = list.filter((a) => !used.has(a.url))
    return filtered.length > 0 ? filtered : list
  }
  const moviesUrlSet = new Set(movies.map((m) => m.url))
  const latestItems = dedupe(articlesRef.current, moviesUrlSet)
  const latestUrlSet = new Set([...movies, ...latestItems].map((x) => x.url))
  const mostReadItems = dedupe(mostReadPool, latestUrlSet)
  const refreshedStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-white/10 pb-5 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            <div className="flex flex-col leading-tight shrink-0">
              <span className="text-on-surface text-sm font-semibold">{weekday}</span>
              <span className="text-on-surface-variant text-xs">{dateStr}</span>
            </div>

            <nav className="flex-1 flex items-center gap-5 overflow-x-auto hide-scrollbar pb-1 -mb-1" aria-label="News sections">
              {FT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleFt(c)}
                  className={`shrink-0 text-sm font-medium whitespace-nowrap transition-colors ${
                    ft === c ? 'text-primary underline underline-offset-4 decoration-2' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none lg:w-72">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant/60" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search movie news..."
                  aria-label="Search movie news"
                  className="w-full bg-surface-container-high border border-white/10 text-on-surface rounded-xl pl-10 pr-9 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); setQuery('') }}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <Icon name="close" size="sm" />
                  </button>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50 shrink-0"
              >
                <Icon name="refresh" size="sm" className="text-sm" />
                {refreshing ? 'Refreshing' : 'Refresh'}
              </button>

              <span className="hidden xl:flex items-center gap-1.5 text-[11px] text-on-surface-variant whitespace-nowrap shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                </span>
                Live · Updated {refreshedStr}
              </span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 mt-5 hide-scrollbar" role="tablist" aria-label="News categories">
            {APP_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCategory(c.id)}
                role="tab"
                aria-selected={category === c.id}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  category === c.id
                    ? 'border-primary text-primary bg-primary-container/10'
                    : 'border-white/10 text-on-surface-variant hover:text-on-surface hover:border-white/25'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            {pendingNew.length > 0 && (
              <button
                onClick={applyNewStories}
                className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl bg-primary-container text-on-primary-container hover:brightness-110 transition-all"
              >
                {pendingNew.length} new stor{pendingNew.length === 1 ? 'y' : 'ies'} available
                <Icon name="arrow_downward" size="sm" />
              </button>
            )}
          </div>

          {errors.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-primary bg-primary-container/10 border border-primary/30 rounded-xl px-3 py-2.5">
              <Icon name="error" size="sm" className="text-sm" />
              <span className="flex-1 min-w-0">
                One or more news sources are unavailable — {errors[0]}
              </span>
              <button onClick={handleRefresh} className="font-semibold text-primary hover:underline shrink-0">
                Retry
              </button>
            </div>
          )}
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr] gap-6 lg:gap-8">
          <MoviesColumn articles={movies} loading={moviesLoading} subNav={subNav} onSubNav={setSubNav} onDeepDive={openDeepDive} busy={ddLoading} />
          <LatestNewsColumn articles={latestItems} loading={loading} onDeepDive={openDeepDive} busy={ddLoading} />
          <MostReadColumn articles={mostReadItems} loading={industryLoading} onDeepDive={openDeepDive} busy={ddLoading} />
        </main>

        <div ref={sentinelRef} className="py-8 text-center">
          {loadingMore ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              <span className="inline-block w-3 h-3 border border-on-surface-variant border-t-transparent rounded-full animate-spin" />
              Loading more
            </div>
          ) : nextPage == null && articlesRef.current.length > 0 && !loading ? (
            <span className="text-xs text-on-surface-variant">You're all caught up</span>
          ) : null}
        </div>
      </div>

      <DeepDiveModal
        open={!!deepDive}
        loading={ddLoading}
        data={ddData}
        error={ddError}
        onClose={closeDeepDive}
        onRetry={retryDeepDive}
      />
    </div>
  )
}
