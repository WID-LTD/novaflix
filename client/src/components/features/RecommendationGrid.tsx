import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface RecommendationGridProps {
  title: string
  viewAllLink?: string
  subtitle?: string
  children: ReactNode
}

export default function RecommendationGrid({ title, viewAllLink, subtitle, children }: RecommendationGridProps) {
  return (
    <section className="relative">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-headline-md text-on-surface truncate">{title}</h2>
          {subtitle && <p className="text-on-surface-variant/60 text-sm mt-1">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="font-label-md text-label-md text-primary hover:underline transition-colors shrink-0"
          >
            View All
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {children}
      </div>
    </section>
  )
}
