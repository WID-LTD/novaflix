import { type Chip } from './Tabs'

interface FilterChipsProps {
  chips: Chip[]
  activeChip: string
  onChange: (id: string) => void
  className?: string
}

export default function FilterChips({ chips, activeChip, onChange, className }: FilterChipsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto hide-scrollbar pb-1 ${className || ''}`}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChange(chip.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeChip === chip.id
              ? 'bg-white text-black shadow-sm'
              : 'bg-surface-container-high border border-outline/20 text-on-surface-variant hover:bg-surface-container-higher hover:border-primary-container/50'
          }`}
          aria-pressed={activeChip === chip.id}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}