import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'
import { getNewsArticle } from '../lib/api'
import type { NewsArticle } from '../lib/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

export default function ArticleNews() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeArticle = (location.state as { article?: NewsArticle } | null)?.article
  const id = (location.pathname.split('/').pop() || '')

  const [article, setArticle] = useState<NewsArticle | null>(routeArticle || null)
  const [loading, setLoading] = useState(!routeArticle)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const initial = (location.state as { article?: NewsArticle } | null)?.article
    if (initial) {
      setArticle(initial)
      setLoading(false)
      return
    }
    const url = decodeURIComponent(id)
    if (!url) { setError(true); setLoading(false); return }
    getNewsArticle(url).then((res) => {
      if (!active) return
      if (res.success && res.article) {
        setArticle(res.article)
        setError(false)
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

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-6"
        aria-label="Go back"
      >
        <Icon name="arrow_back" size="md" className="text-lg" /> News
      </button>

      <article className="max-w-3xl mx-auto">
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
    </div>
  )
}