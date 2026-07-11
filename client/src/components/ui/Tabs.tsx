import type { FC } from 'react'
import { motion } from 'framer-motion'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

const Tabs: FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex gap-1 p-1 bg-surface-secondary rounded-xl border border-white/10 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-accent rounded-lg"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default Tabs
