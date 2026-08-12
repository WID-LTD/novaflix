import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'
import FullArticle from '../components/features/news/FullArticle'
import { getNewsArticle, fetchDeepDive, getNews } from '../lib/api'
import type { NewsArticle, NewsDeepDive, DeepDiveImage, DeepDiveRelated, DeepDivePublisher, NewsFeed } from '../lib/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

function ImageGrid({ images }: { images: DeepDiveImage[] }) {
  if (images.length === 0) return null
  const [hero, ...rest] = images
  return (
    <div>
      <div className="aspect-[16/9] overflow-hidden rounded-xl bg-surface-container border border-white/5 mb-3">
        <img src={hero.url} alt={hero.alt} className="w-full h-full object-cover" loading="lazy" />
      </div>
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {rest.slice(0, 6).map((img, i) => (
            <div key={i} className="aspect-video overflow-hidden rounded-lg bg-surface-container border border-white/5">
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RelatedList({ related }: { related: DeepDiveRelated[] }) {
  if (related.length === 0) return null
  return (
    <section className="mt-10 pt-8 border-t border-white/10">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        <Icon name="menu_book" size="sm" className="text-sm" /> Alternative Perspectives
      </h2>
      <div className="space-y-4">
        {related.slice(0, 10).map((r, i) => (
          <FullArticle
            key={i}
            url={r.url}
            title={r.title}
            variant="list"
            fallbackBody={r.snippet}
          />
        ))}
      </div>
    </section>
  )
}

function PublisherRow({ publishers }: { publishers: DeepDivePublisher[] }) {
  if (publishers.length === 0) return null
  return (
    <section className="mt-10 pt-8 border-t border-white/10">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        <Icon name="domain" size="sm" className="text-sm" /> Publishers
      </h2>
      <div className="flex flex-wrap gap-2">
        {publishers.slice(0, 8).map((p, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high border border-white/10 text-xs text-on-surface">
            {p.name}
            {p.domain && <span className="text-on-surface-variant/60">· {p.domain}</span>}
          </span>
        ))}
      </div>
    </section>
  )
}

function DeepDiveBody({ data }: { data: NewsDeepDive }) {
  if (!data.headline && data.related.length === 0 && data.images.length === 0) {
    return (
      <div className="text-center py-10">
        <Icon name="search_off" className="text-4xl text-on-surface-variant/40 mx-auto mb-4" />
        <p className="text-on-surface font-semibold mb-1">No matching coverage found</p>
        <p className="text-sm text-on-surface-variant">The sources couldn't find articles matching this headline.</p>
      </div>
    )
  }

  return (
    <>
      {data.headline && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 bg-primary-container/15 border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-wide rounded">
              {data.headline.source}
            </span>
            <span className="text-xs text-on-surface-variant">
              {formatDate(data.headline.publishedAt)} · {data.headline.provider}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface leading-tight mb-6">
            {data.headline.title}
          </h2>

          <ImageGrid images={data.images} />

          {data.headline.body ? (
            <p className="mt-6 text-base leading-relaxed text-on-surface/90 whitespace-pre-line">{data.headline.body}</p>
          ) : (
            <p className="mt-6 text-sm text-on-surface-variant">
              Full text wasn't captured from the sources. Open the original article below.
            </p>
          )}

          {data.headline.url && data.headline.url !== '#' && (
            <FullArticle url={data.headline.url} title={data.headline.title} fallbackBody={data.headline.body} />
          )}
        </>
      )}

      <RelatedList related={data.related} />
      <PublisherRow publishers={data.publishers} />
    </>
  )
}

function RelatedNewsRow({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null
  return (
    <section className="mt-10 pt-8 border-t border-white/10">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-5">
        <Icon name="auto_awesome" size="sm" className="text-sm" /> Related News
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {articles.map((a) => (
          <LinkCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  )
}

function deepDiveRoute(a: NewsArticle) {
  return { pathname: `/news/deep-dive/${encodeURIComponent(a.url)}`, state: { article: a } }
}

function LinkCard({ article }: { article: NewsArticle }) {
  return (
    <Link to={deepDiveRoute(article)} className="group block">
      <div className="aspect-[16/10] overflow-hidden bg-surface-container-high rounded-xl mb-3 border border-white/5">
        {article.image ? (
          <img src={article.image} alt={article.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
            <Icon name="newspaper" className="text-3xl" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/70 mb-1.5">
        <span className="font-semibold uppercase tracking-wide text-primary">{article.source}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
      <h3 className="text-sm font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
    </Link>
  )
}

export default function DeepDivePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeArticle = (location.state as { article?: NewsArticle } | null)?.article
  const id = (location.pathname.split('/').pop() || '')

  const [article, setArticle] = useState<NewsArticle | null>(routeArticle || null)
  const [loading, setLoading] = useState(!routeArticle)
  const [error, setError] = useState(false)
  const [ddLoading, setDdLoading] = useState(!!routeArticle)
  const [ddData, setDdData] = useState<NewsDeepDive | null>(null)
  const [ddError, setDdError] = useState(false)
  const [related, setRelated] = useState<NewsArticle[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)

  const loadDeepDive = useCallback(async (a: NewsArticle) => {
    setDdData(null)
    setDdError(false)
    setDdLoading(true)
    const keywords = [a.source, a.category].filter(Boolean) as string[]
    const res = await fetchDeepDive(a.title, keywords)
    setDdLoading(false)
    if (res.success) setDdData(res)
    else setDdError(true)
  }, [])

  const loadRelated = useCallback(async (a: NewsArticle) => {
    setRelatedLoading(true)
    const q = a.category && a.category !== 'general' ? a.category : a.source
    const res: NewsFeed = await getNews('movies', q, 1)
    setRelatedLoading(false)
    if (res.success) {
      const current = a.url
      const others = (res.articles || []).filter((x) => x.url !== current).slice(0, 8)
      if (others.length) setRelated(others)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  useEffect(() => {
    let active = true
    const initial = (location.state as { article?: NewsArticle } | null)?.article
    if (initial) {
      setArticle(initial)
      setLoading(false)
      setDdLoading(true)
      loadDeepDive(initial)
      loadRelated(initial)
      return () => { active = false }
    }
    const url = decodeURIComponent(id)
    if (!url) { setError(true); setLoading(false); return }
    getNewsArticle(url).then((res) => {
      if (!active) return
      if (res.success && res.article) {
        setArticle(res.article)
        setError(false)
        loadDeepDive(res.article)
        loadRelated(res.article)
      } else {
        setError(true)
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [id, location.state])

  if (loading) {
    return (
      <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
        <div className="max-w-3xl mx-auto">
          <Skeleton variant="poster" className="w-full aspect-[16/9] rounded-xl mb-6" />
          <Skeleton variant="text" className="w-1/3 h-3 mb-4" />
          <Skeleton variant="text" className="w-full h-8 mb-3" />
          <Skeleton variant="text" className="w-5/6 h-8 mb-8" />
          <div className="space-y-3">
            <Skeleton variant="text" className="w-full h-4" />
            <Skeleton variant="text" className="w-full h-4" />
            <Skeleton variant="text" className="w-2/3 h-4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center px-margin-mobile">
        <div className="text-center">
          <Icon name="newspaper" className="text-5xl text-on-surface-variant/40 mx-auto mb-4" />
          <p className="text-xl text-on-surface mb-2">Article unavailable</p>
          <p className="text-sm text-on-surface-variant mb-6">It likely expired from the live news feed. Head back to the news desk.</p>
          <button
            onClick={() => navigate('/news')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-lg text-sm font-bold hover:brightness-110 transition-all"
          >
            <Icon name="news" size="sm" /> Back to News
          </button>
        </div>
      </div>
    )
  }

  const image = article.image || null
  const body = article.content || article.description || ''
  const ddMeta = ddData?.meta

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-6"
        aria-label="Go back"
      >
        <Icon name="arrow_back" size="md" className="text-lg" /> News
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Icon name="auto_awesome" size="sm" className="text-sm" /> Deep Dive
          </span>
        </div>

        <article>
          <div className="flex items-center gap-3 mb-5">
            <span className="px-2.5 py-1 bg-primary-container/15 border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-wide rounded">
              {article.source}
            </span>
            <span className="text-xs text-on-surface-variant">
              {article.publishedAt ? formatDate(article.publishedAt) : 'Latest'}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface leading-tight mb-6">
            {article.title}
          </h1>

          {image && (
            <div className="aspect-[16/9] overflow-hidden rounded-xl bg-surface-container border border-white/5 mb-8">
              <img
                src={image}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget.parentElement as HTMLElement).classList.add('hidden') }}
              />
            </div>
          )}

          <div className="prose-custom">
            <p className="text-base leading-relaxed text-on-surface whitespace-pre-line">
              {body}
            </p>
          </div>

          <p className="text-xs text-on-surface-variant mt-8 pt-6 border-t border-white/10">
            Provided by {article.provider ?? article.source} · Curated for NovaFlix
          </p>
        </article>

        <div className="mt-10">
          {ddLoading ? (
            <div className="p-6 md:p-8 rounded-2xl bg-surface-container border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold text-on-surface-variant">Gathering alternative perspectives…</span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                {['NewsAPI', 'NewsData.io', 'APITube'].map((p) => (
                  <span key={p} className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    {p}
                  </span>
                ))}
              </div>
              <div className="space-y-4">
                <div className="aspect-[16/9] rounded-xl bg-surface-container-high animate-pulse" />
                <div className="h-6 bg-surface-container-high rounded animate-pulse w-5/6" />
                <div className="h-4 bg-surface-container-high rounded animate-pulse w-full" />
              </div>
            </div>
          ) : ddError || !ddData ? (
            <div className="text-center py-10 rounded-2xl bg-surface-container border border-white/5">
              <Icon name="error" className="text-4xl text-on-surface-variant/40 mx-auto mb-4" />
              <p className="text-lg font-semibold text-on-surface mb-1">Couldn't assemble the deep dive</p>
              <p className="text-sm text-on-surface-variant mb-6">None of the news sources returned usable results.</p>
              <button
                onClick={() => loadDeepDive(article)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-lg text-sm font-bold hover:brightness-110 transition-all"
              >
                <Icon name="refresh" size="sm" /> Retry
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-container border border-white/5 p-6 md:p-8">
              <DeepDiveBody data={ddData} />
              <p className="mt-8 text-[11px] text-on-surface-variant/60">
                {ddMeta
                  ? `Synthesized ${ddMeta.providersOk.length}/${ddMeta.providersTried.length} sources${ddMeta.errorCount ? ` · ${ddMeta.errorCount} source${ddMeta.errorCount === 1 ? '' : 's'} unavailable` : ''}`
                  : 'Synthesized from multiple news sources'}
              </p>
            </div>
          )}
        </div>

        <RelatedNewsRow articles={related} />
      </div>
    </div>
  )
}
