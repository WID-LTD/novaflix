import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Info } from 'lucide-react'
import { getStreamSource, getManifestInfo, getTVSeason, getDetails } from '../lib/api'
import { useStore } from '../store/useStore'
import { useAuth } from '../lib/AuthContext'
import { recordWatch } from '../lib/auth'
import VideoPlayer from '../components/features/VideoPlayer'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import type { Variant, Episode } from '../types'

export default function Watch() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const id = searchParams.get('id') || ''
  const type = searchParams.get('type') || 'movie'
  const seasonParam = searchParams.get('season')
  const episodeParam = searchParams.get('episode')
  const season = seasonParam || undefined
  const episode = episodeParam || undefined

  const [showEpisodes, setShowEpisodes] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>('')
  const [manifestVariants, setManifestVariants] = useState<Variant[]>([])
  const addToContinueWatching = useStore((s) => s.addToContinueWatching)
  const { user } = useAuth()
  const lastRecordRef = useRef(0)

  const { data: detailsData } = useQuery({
    queryKey: ['details', id, type],
    queryFn: () => getDetails(id, type as 'movie' | 'tv'),
    enabled: !!id,
  })

  const details = detailsData?.success ? detailsData.data : null

  const { data: episodesData } = useQuery({
    queryKey: ['tv-season', id, season],
    queryFn: () => getTVSeason(id, season!),
    enabled: type === 'tv' && !!season && !!id,
  })

  const episodes: Episode[] = episodesData?.episodes || []

  const { data: sourceData, isLoading: sourceLoading, error: sourceError } = useQuery({
    queryKey: ['source', id, type, season, episode],
    queryFn: () => getStreamSource(id, type, season, episode),
    enabled: !!id,
    retry: 2,
  })

  useEffect(() => {
    if (sourceData?.success && sourceData.streamUrl) {
      setCurrentStreamUrl(sourceData.streamUrl)

      getManifestInfo(sourceData.directUrl || sourceData.streamUrl, id, type, season, episode)
        .then((manifest) => {
          if (manifest.success && manifest.variants.length > 0) {
            setManifestVariants(manifest.variants)
            setSelectedVariant(manifest.variants[manifest.variants.length - 1])
          }
        })
        .catch(() => {})
    }
  }, [sourceData, id, type, season, episode])

  useEffect(() => {
    if (details && currentStreamUrl) {
      addToContinueWatching({
        id: details.id,
        title: details.title,
        poster: details.poster,
        type: details.type,
        season: season ? Number(season) : undefined,
        episode: episode ? Number(episode) : undefined,
        progress: 0,
        duration: 0,
      })
    }
  }, [details, currentStreamUrl, addToContinueWatching, season, episode])

  const handleQualitySelect = (v: Variant) => {
    setSelectedVariant(v)
    setCurrentStreamUrl(v.url)
    setShowQuality(false)
  }

  const handleEpisodeSelect = (ep: number) => {
    navigate(`/watch?id=${id}&type=${type}&season=${season}&episode=${ep}`)
    setShowEpisodes(false)
  }

  const handleProgress = (time: number) => {
    if (details) {
      addToContinueWatching({
        id: details.id,
        title: details.title,
        poster: details.poster,
        type: details.type,
        season: season ? Number(season) : undefined,
        episode: episode ? Number(episode) : undefined,
        progress: time,
        duration: 0,
      })

      if (user && time - lastRecordRef.current > 60) {
        lastRecordRef.current = time
        const token = localStorage.getItem('novaflix-token') || ''
        recordWatch(token, {
          contentId: id,
          title: details.title,
          type,
          minutes: 1,
          season: season || null,
          episode: episode || null,
        }).catch(() => {})
      }
    }
  }

  const title = details?.title || 'Loading...'
  const episodeInfo = episode ? `S${season} E${episode}` : null

  return (
    <div className="min-h-screen bg-black">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-secondary/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold">{title}</h1>
            {episodeInfo && (
              <p className="text-xs text-gray-400">{episodeInfo}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {manifestVariants.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuality(true)}
            >
              <Info className="w-4 h-4" />
              {selectedVariant?.label || 'Auto'}
            </Button>
          )}

          {type === 'tv' && episodes.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEpisodes(true)}
            >
              Episodes
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {sourceLoading ? (
          <Skeleton variant="hero" className="w-full aspect-video rounded-2xl" />
        ) : sourceError || (sourceData && !sourceData.success) ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-400 text-lg font-semibold mb-2">
              Stream unavailable
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {sourceData?.error || 'Could not load video source'}
            </p>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        ) : currentStreamUrl ? (
          <VideoPlayer
            streamUrl={currentStreamUrl}
            subtitles={sourceData?.subtitles || []}
            title={episodeInfo ? `${title} - ${episodeInfo}` : title}
            onProgress={handleProgress}
          />
        ) : null}
      </div>

      <Modal
        isOpen={showQuality}
        onClose={() => setShowQuality(false)}
        title="Select Quality"
      >
        <div className="space-y-2">
          {manifestVariants.map((v, i) => (
            <button
              key={i}
              onClick={() => handleQualitySelect(v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                selectedVariant?.url === v.url
                  ? 'bg-accent/10 border border-accent/30'
                  : 'bg-surface-card border border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-medium">{v.label}</p>
                <p className="text-xs text-gray-500">{v.sizeLabel}</p>
              </div>
              {v.compressedLabel !== 'Unknown' && (
                <span className="text-xs text-gray-500">
                  Est. {v.compressedLabel}
                </span>
              )}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showEpisodes}
        onClose={() => setShowEpisodes(false)}
        title="Episodes"
      >
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {episodes.map((ep) => (
            <button
              key={ep.episode}
              onClick={() => handleEpisodeSelect(ep.episode)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                Number(episodeParam) === ep.episode
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
            >
              <span className="text-xs text-gray-500 font-mono mr-3">
                {ep.episode.toString().padStart(2, '0')}
              </span>
              {ep.name}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
