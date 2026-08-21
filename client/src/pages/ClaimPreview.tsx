import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClaimPreview } from '../lib/auth'
import { useToast } from '../components/ui/Toast'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { motion } from 'framer-motion'

export default function ClaimPreview() {
  const { tmdbPersonId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await getClaimPreview(tmdbPersonId)
        if (res.success) {
          setPreview(res.preview)
        } else {
          toast.error(res.error || 'Failed to load preview')
          navigate('/creator/claim/start')
        }
      } catch (err) {
        toast.error('Failed to load preview')
        navigate('/creator/claim/start')
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [tmdbPersonId, navigate])

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/creator/claim/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbPersonId, displayName: preview?.person?.name })
      })
      const data = await res.json()
      if (data.success) {
        navigate(`/creator/claim/verify?claimId=${data.claimId}`)
      } else {
        toast.error(data.error || 'Failed to start claim')
      }
    } catch (err) {
      toast.error('Failed to start claim')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-primary-container" />
        </div>
      </Layout>
    )
  }

  if (!preview) return null

  const { person, filmCount, estimatedMonthlyEarnings } = preview

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="secondary" onClick={() => navigate('/creator/claim/start')}>
                <Icon name="arrow_back" size="sm" />
              </Button>
              <h1 className="text-headline-md font-bold">Claim Profile Preview</h1>
            </div>
          </motion.div>

          <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-5 mb-6">
              {person.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                  alt={person.name}
                  className="w-24 h-24 rounded-xl object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-surface-container flex items-center justify-center">
                  <Icon name="person" className="w-12 h-12 text-on-surface-variant/40" />
                </div>
              )}
              <div>
                <h2 className="text-headline-lg font-bold text-on-surface">{person.name}</h2>
                <p className="text-body-md text-on-surface-variant mt-1">
                  Known for: {person.known_for_department}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface-container rounded-xl p-4 text-center">
                <p className="text-headline-lg font-bold text-primary-container">{filmCount}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">Films / Shows</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4 text-center">
                <p className="text-headline-lg font-bold text-primary-container">
                  ₦{estimatedMonthlyEarnings.toLocaleString()}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">Est. Monthly Earnings</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4 text-center">
                <p className="text-headline-lg font-bold text-primary-container">{person.known_for_department}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">Primary Role</p>
              </div>
            </div>

            {preview.person?.known_for && preview.person.known_for.length > 0 && (
              <div className="mb-6">
                <h3 className="font-label-lg text-on-surface mb-3">Known For</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {preview.person.known_for.slice(0, 6).map((work) => (
                    <div key={work.id} className="w-32 flex-shrink-0">
                      {work.poster_path && (
                        <img 
                          src={`https://image.tmdb.org/t/p/w185${work.poster_path}`}
                          alt={work.title || work.name}
                          className="w-full aspect-video object-cover rounded-lg mb-2"
                        />
                      )}
                      <p className="text-xs text-on-surface truncate">{work.title || work.name}</p>
                      <p className="text-[10px] text-on-surface-variant/60">{work.release_date || work.first_air_date || ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="verified_user" className="w-6 h-6 text-primary-container" />
                <div>
                  <h3 className="font-label-lg text-on-surface">Ready to Claim?</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    We'll verify your identity with Persona (government ID + selfie). 
                    Once approved, you'll get instant access to your wallet and earnings.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

            <Button onClick={handleClaim} size="lg" className="w-full" loading={claiming}>
              <Icon name="verified_user" size="sm" className="mr-2" />
              Start Verification & Claim Profile
            </Button>
          </div>
        </div>
      </Layout>
    )
  }