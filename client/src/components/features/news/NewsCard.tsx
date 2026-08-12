import { Link } from 'react-router-dom'
import type { NewsArticle } from '../../../lib/api'
import NewsImage from './NewsImage'
import { formatRelative, formatFullDate } from './formatRelative'
import Icon from '../../ui/Icon'

interface NewsCardProps {
  article: NewsArticle
  variant?: 'feature' | 'standard' | 'row'
  rank?: number
  onDeepDive?: (article: NewsArticle) => void
  busy?: boolean
}

function articleRoute(a: NewsArticle) {
  return { pathname: `/news/deep-dive/${encodeURIComponent(a.url)}`, state: { article: a } }
}

function Meta({ article }: { article: NewsArticle }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/70">
      <span className="font-semibold uppercase tracking-wide text-primary">{article.source}</span>
      <span aria-hidden>·</span>
      <time dateTime={article.publishedAt || undefined} title={formatFullDate(article.publishedAt)}>
        {formatRelative(article.publishedAt)}
      </time>
    </div>
  )
}

export default function NewsCard({ article, variant = 'standard', rank, onDeepDive, busy }: NewsCardProps) {
  const busyCls = busy ? 'pointer-events-none opacity-50 cursor-wait' : onDeepDive ? 'cursor-pointer' : ''
  const clickProps = onDeepDive
    ? {
        'aria-busy': busy || undefined,
        onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          e.stopPropagation()
          onDeepDive(article)
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onDeepDive(article)
          }
        },
      }
    : {}
  if (variant === 'feature') {
    return (
      <Link to={articleRoute(article)} className={`group block ${busyCls}`} {...clickProps}>
        <div className="aspect-[16/9] overflow-hidden bg-surface-container-high rounded-xl mb-4 border border-white/5">
          <NewsImage
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            iconClassName="text-5xl"
          />
        </div>
        <Meta article={article} />
        <h3 className="mt-2 text-xl md:text-2xl font-bold text-on-surface leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="mt-2 text-sm text-on-surface-variant leading-relaxed line-clamp-3">{article.description}</p>
        )}
        <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold uppercase tracking-wide text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Continue Reading <Icon name="arrow_forward" size="sm" className="text-xs" />
        </span>
      </Link>
    )
  }

  if (variant === 'row') {
    return (
      <Link to={articleRoute(article)} className={`flex gap-4 py-4 group border-b border-white/5 last:border-0 ${busyCls}`} {...clickProps}>
        {rank !== undefined && (
          <span className="w-7 shrink-0 text-lg font-extrabold text-on-surface-variant/30 leading-none pt-0.5">
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <Meta article={article} />
          <h3 className="mt-1 text-sm font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>
        <div className="w-24 h-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-high border border-white/5">
          <NewsImage src={article.image} alt={article.title} className="w-full h-full object-cover" iconClassName="text-2xl" />
        </div>
      </Link>
    )
  }

  return (
    <Link to={articleRoute(article)} className={`group block min-w-0 ${busyCls}`} {...clickProps}>
      <div className="aspect-[16/10] overflow-hidden bg-surface-container-high rounded-xl mb-3 border border-white/5">
        <NewsImage
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          iconClassName="text-4xl"
        />
      </div>
      <Meta article={article} />
      <h3 className="mt-1.5 text-sm font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
    </Link>
  )
}
