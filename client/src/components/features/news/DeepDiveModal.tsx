import { useEffect } from 'react'
import Icon from '../../ui/Icon'
import FullArticle from './FullArticle'
import type { NewsDeepDive, DeepDiveImage, DeepDiveRelated, DeepDivePublisher } from '../../../lib/api'

interface DeepDiveModalProps {
  open: boolean
  loading: boolean
  data: NewsDeepDive | null
  error: boolean
  onClose: () => void
  onRetry: () => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string | null) {
  if (!iso) return 'Recent'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Recent'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

function LoadingState() {
  return (
    <div className="p-6 md:p-8">
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
        <div className="h-4 bg-surface-container-high rounded animate-pulse w-2/3" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-video bg-surface-container-high rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  return (
    <div className="p-8 text-center">
      <Icon name="error" className="text-4xl text-on-surface-variant/40 mx-auto mb-4" />
      <p className="text-lg font-semibold text-on-surface mb-1">Couldn't assemble the deep dive</p>
      <p className="text-sm text-on-surface-variant mb-6">None of the news sources returned usable results. Try again or head to the original article.</p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-lg text-sm font-bold hover:brightness-110 transition-all"
        >
          <Icon name="refresh" size="sm" /> Retry
        </button>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 text-on-surface rounded-lg text-sm font-bold hover:bg-white/5 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  )
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
    <div className="mt-8 pt-6 border-t border-white/10">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        <Icon name="menu_book" size="sm" className="text-sm" /> Alternative Perspectives
      </h3>
      <div className="space-y-4">
        {related.slice(0, 8).map((r, i) => (
          <FullArticle
            key={i}
            url={r.url}
            title={r.title}
            variant="list"
            fallbackBody={r.snippet}
          />
        ))}
      </div>
    </div>
  )
}

function PublisherRow({ publishers }: { publishers: DeepDivePublisher[] }) {
  if (publishers.length === 0) return null
  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        <Icon name="domain" size="sm" className="text-sm" /> Publishers
      </h3>
      <div className="flex flex-wrap gap-2">
        {publishers.slice(0, 8).map((p, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high border border-white/10 text-xs text-on-surface">
            {p.name}
            {p.domain && <span className="text-on-surface-variant/60">· {p.domain}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DeepDiveModal({ open, loading, data, error, onClose, onRetry }: DeepDiveModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const meta = data?.meta

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="News deep dive"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-surface-container border-t sm:border border-white/10 sm:rounded-2xl shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-surface-container/95 backdrop-blur-sm">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Icon name="auto_awesome" size="sm" className="text-sm" /> Deep Dive
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close deep dive"
          >
            <Icon name="close" size="md" className="text-lg" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <LoadingState />
          ) : error || !data ? (
            <ErrorState onRetry={onRetry} onClose={onClose} />
          ) : (
            <div className="p-6 md:p-8">
              {data.headline ? (
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
              ) : (
                <div className="text-center py-10">
                  <Icon name="search_off" className="text-4xl text-on-surface-variant/40 mx-auto mb-4" />
                  <p className="text-on-surface font-semibold mb-1">No matching coverage found</p>
                  <p className="text-sm text-on-surface-variant mb-6">
                    The sources couldn't find articles matching this headline. Try again or open the original article.
                  </p>
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-lg text-sm font-bold hover:brightness-110 transition-all"
                  >
                    <Icon name="refresh" size="sm" /> Retry
                  </button>
                </div>
              )}

              {data.related.length > 0 && <RelatedList related={data.related} />}
              {data.publishers.length > 0 && <PublisherRow publishers={data.publishers} />}

              <p className="mt-8 text-[11px] text-on-surface-variant/60">
                {meta
                  ? `Synthesized ${meta.providersOk.length}/${meta.providersTried.length} sources${meta.errorCount ? ` · ${meta.errorCount} source${meta.errorCount === 1 ? '' : 's'} unavailable` : ''}`
                  : 'Synthesized from multiple news sources'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
