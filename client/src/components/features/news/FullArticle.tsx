import { useState } from 'react'
import Icon from '../../ui/Icon'
import { fetchArticleContent } from '../../../lib/api'
import type { ArticleContent } from '../../../lib/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

interface FullArticleProps {
  url: string
  title: string
  variant?: 'button' | 'list'
  label?: string
  fallbackBody?: string
}

export default function FullArticle({ url, title, variant = 'button', label = 'Read Full Article', fallbackBody }: FullArticleProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ArticleContent | null>(null)

  const fallbackParagraphs = (fallbackBody || '')
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 40)

  const toggle = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    if (data) {
      setExpanded(true)
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetchArticleContent(url)
    setLoading(false)
    if (res.success && res.article && res.article.paragraphs.length > 0) {
      setData(res.article)
      setExpanded(true)
    } else {
      setData(null)
      setError(res.success ? null : res.error || null)
      setExpanded(true)
    }
  }

  const showFallback = expanded && !loading && !data && fallbackParagraphs.length > 0

  const hero = data?.image || (data?.images && data.images[0])

  if (variant === 'list') {
    return (
      <div>
        <button
          onClick={toggle}
          className="block w-full text-left group"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/70 mb-0.5">
            <span className="font-semibold uppercase tracking-wide text-primary">
              {data?.source ?? 'Source'}
            </span>
            {data?.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={data.publishedAt || undefined}>{formatDate(data.publishedAt)}</time>
              </>
            )}
          </div>
          <p className="text-sm font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </p>
          {expanded && loading && (
            <p className="flex items-center gap-2 text-xs text-on-surface-variant mt-2">
              <span className="w-3.5 h-3.5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
              Fetching the full article…
            </p>
          )}
        </button>

        {expanded && !loading && !data && (
          <div className="mt-3 p-3 rounded-lg bg-surface-container-high border border-white/10">
            {showFallback ? (
              <>
                <p className="text-xs text-on-surface-variant mb-2">
                  Showing the version captured from the news source — open the original for the full text.
                </p>
                <div className="space-y-2">
                  {fallbackParagraphs.map((p, i) => (
                    <p key={i} className="text-xs leading-relaxed text-on-surface/90">
                      {p}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-on-surface-variant mb-2">{error || "Full text wasn't captured from the source."}</p>
            )}
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-2"
            >
              <Icon name="open_in_new" size="sm" /> Open on source site
            </a>
          </div>
        )}

        {expanded && !loading && data && (
          <div className="mt-3 space-y-3">
            {hero && (
              <div className="aspect-[16/9] overflow-hidden rounded-lg bg-surface-container border border-white/5">
                <img src={hero} alt={data.title || title} loading="lazy" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-2">
              {data.paragraphs.length > 0 ? (
                data.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-on-surface/90">
                    {p}
                  </p>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">Full text wasn't captured from the source.</p>
              )}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Icon name="open_in_new" size="sm" /> Open on source site
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6">
      {!expanded ? (
        <button
          onClick={toggle}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-lg text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
              Fetching…
            </>
          ) : (
            <>
              <Icon name="open_in_new" size="sm" /> {label}
            </>
          )}
        </button>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
          Fetching the full article…
        </div>
      ) : data ? (
        <div>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-4"
          >
            <Icon name="unfold_less" size="sm" /> Collapse full article
          </button>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            {hero && (
              <div className="aspect-[16/9] overflow-hidden bg-surface-container border-b border-white/5">
                <img src={hero} alt={data.title || title} loading="lazy" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {data.source && (
                  <span className="px-2 py-0.5 bg-primary-container/15 border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-wide rounded">
                    {data.source}
                  </span>
                )}
                {data.publishedAt && (
                  <span className="text-xs text-on-surface-variant">{formatDate(data.publishedAt)}</span>
                )}
              </div>

              {data.title && data.title !== title && (
                <h3 className="text-lg md:text-xl font-bold text-on-surface leading-tight mb-3">{data.title}</h3>
              )}

              <div className="space-y-3">
                {data.paragraphs.length > 0 ? (
                  data.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm md:text-base leading-relaxed text-on-surface/90">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">Full text wasn't captured from the source.</p>
                )}
              </div>

              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary hover:underline"
              >
                <Icon name="open_in_new" size="sm" /> Open on source site
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-4"
          >
            <Icon name="unfold_less" size="sm" /> Collapse full article
          </button>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="p-5 md:p-6">
              {showFallback ? (
                <>
                  <p className="text-xs text-on-surface-variant mb-3">
                    Showing the version captured from the news source — open the original for the full text.
                  </p>
                  <div className="space-y-3">
                    {fallbackParagraphs.map((p, i) => (
                      <p key={i} className="text-sm md:text-base leading-relaxed text-on-surface/90">{p}</p>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  {error || "Full text wasn't captured from this source."}
                </p>
              )}
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary hover:underline"
              >
                <Icon name="open_in_new" size="sm" /> Open on source site
              </a>
            </div>
          </div>
        </div>
      )
    }
    </div>
  )
}
