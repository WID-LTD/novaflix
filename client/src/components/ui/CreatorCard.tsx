import type { FC } from 'react'
import { motion } from 'framer-motion'
import { Film, Users, MapPin } from 'lucide-react'

interface CreatorCardProps {
  name: string
  avatar?: string | null
  bio?: string
  filmCount?: number
  followers?: number
  location?: string
  className?: string
}

const CreatorCard: FC<CreatorCardProps> = ({
  name,
  avatar,
  bio = 'Independent filmmaker',
  filmCount = 0,
  followers = 0,
  location,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-surface-card border border-white/10 rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-secondary-light flex items-center justify-center text-white text-xl font-bold shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{name}</h3>
          <p className="text-xs text-gray-400 truncate">{bio}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Film className="w-3.5 h-3.5" />
          <span>{filmCount} films</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span>{followers}</span>
        </div>
        {location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CreatorCard
