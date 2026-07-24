import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { useStore } from '../store/useStore'
import type { UserProfile } from '../types'

const defaultProfiles: UserProfile[] = [
  { id: '1', name: 'Alex', avatar: null, age: 28, preferences: ['Action', 'Sci-Fi'] },
  { id: '2', name: 'Sarah', avatar: null, age: 25, preferences: ['Drama', 'Romance'] },
  { id: '3', name: 'Kids', avatar: null, age: 10, preferences: ['Animation', 'Comedy'] },
]

export default function ProfileGateway() {
  const navigate = useNavigate()
  const { setCurrentProfile, setProfiles, profiles } = useStore()
  const [localProfiles] = useState(profiles.length > 0 ? profiles : defaultProfiles)

  const selectProfile = (profile: UserProfile) => {
    setCurrentProfile(profile.id)
    setProfiles(localProfiles)
    navigate('/home')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 w-full z-50 flex justify-center items-center px-6 h-20 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-headline-lg-mobile md:text-headline-lg font-extrabold text-primary-container tracking-tighter">
          <img src="/leter-mark-logo.png" alt="" className="h-10 md:h-12 w-auto mx-auto" />
        </h1>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile py-20">
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-headline-lg md:text-[48px] md:leading-[56px] mb-4">Who is watching?</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-4xl px-4">
            {localProfiles.map((profile) => (
              <motion.button
                key={profile.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectProfile(profile)}
                className="flex flex-col items-center group focus:outline-none focus:ring-2 focus:ring-primary-container rounded-xl p-2 transition-all"
              >
                <div className="w-24 h-24 md:w-40 md:h-40 rounded-xl overflow-hidden border-4 border-transparent group-hover:border-on-surface transition-all duration-300 shadow-xl mb-4 bg-surface-container-high flex items-center justify-center">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="person" size="xl" className="text-on-surface-variant/60" />
                  )}
                </div>
                <span className="text-body-lg text-on-surface-variant group-hover:text-on-surface transition-colors">
                  {profile.name}
                </span>
              </motion.button>
            ))}

            {/* Add Profile */}
            <button className="flex flex-col items-center group focus:outline-none focus:ring-2 focus:ring-primary-container rounded-xl p-2 transition-all">
              <div className="w-24 h-24 md:w-40 md:h-40 rounded-xl border-4 border-transparent bg-surface-container group-hover:bg-surface-container-highest transition-all duration-300 shadow-xl mb-4 flex items-center justify-center">
                <Icon name="add_circle" className="text-5xl md:text-7xl text-on-surface-variant group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-body-lg text-on-surface-variant group-hover:text-on-surface transition-colors">Add Profile</span>
            </button>
          </div>

          <div className="mt-20 flex flex-col items-center">
            <button className="px-8 py-3 border-2 border-on-surface-variant text-on-surface-variant font-label-md text-label-md rounded-lg uppercase tracking-widest hover:bg-on-surface hover:text-background hover:border-on-surface transition-all active:scale-95">
              Edit Profiles
            </button>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center opacity-40">
        <p className="font-label-sm text-label-sm"><img src="/leter-mark-logo.png" alt="" className="h-3 w-auto inline align-middle" /> Original Entertainment</p>
      </footer>
    </div>
  )
}
