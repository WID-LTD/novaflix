import Icon from '../ui/Icon'

export default function StatCard({ label, value, icon, tone = 'default' }: { label: string; value: string | number; icon?: string; tone?: 'default' | 'primary' | 'secondary' | 'error' }) {
  const toneCls = {
    default: 'text-on-surface',
    primary: 'text-primary',
    secondary: 'text-secondary',
    error: 'text-error',
  }[tone]
  return (
    <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-on-surface-variant/60 text-xs">{label}</p>
        {icon && <Icon name={icon} size="sm" className="text-on-surface-variant/50" />}
      </div>
      <p className={`text-2xl font-bold ${toneCls}`}>{value}</p>
    </div>
  )
}