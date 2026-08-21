import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchPersonList } from '../lib/api'
import { useToast } from '../components/ui/Toast'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { motion, AnimatePresence } from 'framer-motion'

export default function ClaimStart() {
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchPersonList(query)
      setResults(res.data || [])
    } catch (err) {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSelect = (person) => {
    setSelected(person)
  }

  const handleContinue = () => {
    if (selected) {
      navigate(`/creator/claim/preview/${selected.id}`)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="w-20 h-20 rounded-2xl bg-primary-container/20 flex items-center justify-center mx-auto mb-6">
              <Icon name="verified_user" className="w-10 h-10 text-primary-container" />
            </div>
            <h1 className="text-headline-lg font-bold text-on-surface mb-3">Claim Your Creator Profile</h1>
            <p className="text-body-lg text-on-surface-variant">
              Are you a filmmaker, actor, or creator? Search TMDB to find your profile and claim it to start earning from your content.
            </p>
          </motion.div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <Input
                placeholder="Search your name (e.g. 'Christopher Nolan')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" loading={searching} className="whitespace-nowrap">
                <Icon name="search" size="sm" className="mr-2" /> Search
              </Button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <h3 className="text-label-lg text-on-surface-variant mb-3">Search Results</h3>
                {results.map((person) => (
                  <motion.button
                    key={person.id}
                    onClick={() => handleSelect(person)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected?.id === person.id
                        ? 'border-primary-container bg-primary-container/10'
                        : 'border-outline/20 hover:border-primary/50 hover:bg-white/5'
                    }`}
                    style={{ minHeight: '100px' }}
                  >
                    <div className="flex items-center gap-4">
                      {person.profile_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/10"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center">
                          <Icon name="person" className="w-8 h-8 text-on-surface-variant/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-label-lg text-on-surface truncate">{person.name}</h4>
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          Known for: {person.known_for_department}
                        </p>
                        {person.known_for && person.known_for.length > 0 && (
                          <p className="text-xs text-on-surface-variant/60 mt-1 truncate">
                            Known for: {person.known_for.slice(0, 3).map(k => k.title || k.name).join(', ')}
                          </p>
                        )}
                      </div>
                      {selected?.id === person.id && (
                        <Icon name="check_circle" className="w-6 h-6 text-primary-container flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {selected && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
              <Button onClick={handleContinue} size="lg" className="w-full">
                <Icon name="arrow_forward" size="sm" className="mr-2" />
                Continue to Claim {selected.name}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  )
}