import Icon from '../ui/Icon'

export default function AdminPageHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Icon name={icon} className="w-8 h-8 text-primary-container" />
      <div>
        <h1 className="text-headline-md font-bold">{title}</h1>
        {subtitle && <p className="text-on-surface-variant/60 text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}