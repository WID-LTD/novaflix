import { useRef, useEffect, useState, useCallback } from 'react'
import Hls from 'hls.js'
import Icon from '../ui/Icon'
import AdOverlay, { AdTimelinePips } from './AdOverlay'
import { getNextAd, recordAdImpression, getSkipLimit, incrementSkip } from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import type { Subtitle, AdItem } from '../../types'

interface VideoPlayerProps {
  streamUrl: string
  subtitles?: Subtitle[]
  title?: string
  onProgress?: (progress: number) => void
  onDuration?: (duration: number) => void
  plan?: string
  bingePassActive?: boolean
}

export default function VideoPlayer({
  streamUrl,
  subtitles = [],
  title,
  onProgress,
  onDuration,
  plan: _plan,
  bingePassActive = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>()
  const adTimerRef = useRef<ReturnType<typeof setInterval>>()
  const midRollTriggered = useRef<Set<number>>(new Set())
  const { planRank, planFeatures } = useAuth()

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [activeSubtitle, setActiveSubtitle] = useState<string>('off')

  // Ad state
  const [ads, setAds] = useState<AdItem[]>([])
  const [currentAd, setCurrentAd] = useState<AdItem | null>(null)
  const [showPauseAd, setShowPauseAd] = useState(false)
  const [adCount, setAdCount] = useState(0)
  const [skipLimit, setSkipLimit] = useState({ skips_used: 0, skips_max: 999 })

  // Load ads on mount
  useEffect(() => {
    const needsAds = planRank < 2 && !bingePassActive
    if (!needsAds) return
    getNextAd().then((res) => {
      if (res.success && res.ads) setAds(res.ads)
    })
    getSkipLimit().then((res) => {
      if (res.success) setSkipLimit(res)
    })
  }, [planRank, bingePassActive])

  // Timer for pause ad dismissal
  useEffect(() => {
    if (!showPauseAd) return
    const ad = ads.find((a) => a.position_type === 'pause')
    if (!ad) return
    const dur = (ad.duration_seconds || 15) * 1000
    const timer = setTimeout(() => {
      setShowPauseAd(false)
      recordAdImpression(ad.id, true, ad.duration_seconds)
    }, dur)
    return () => clearTimeout(timer)
  }, [showPauseAd, ads])

  // Mid-roll ad trigger based on currentTime
  useEffect(() => {
    if (!ads.length || planRank >= 2 || bingePassActive) return
    const midRolls = ads.filter((a) => a.position_type === 'mid_roll')
    for (const ad of midRolls) {
      if (
        currentTime >= ad.cue_time_seconds &&
        currentTime < ad.cue_time_seconds + 5 &&
        !midRollTriggered.current.has(ad.cue_time_seconds) &&
        !currentAd &&
        playing
      ) {
        midRollTriggered.current.add(ad.cue_time_seconds)
        const video = videoRef.current
        if (video) {
          video.pause()
          setCurrentAd(ad)
          setAdCount((c) => c + 1)
        }
      }
    }
  }, [currentTime, ads, planRank, currentAd, playing])

  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    if (playing) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [playing])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return

    setLoading(true)
    setError(null)

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy()
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
        video.play().catch(() => setPlaying(false))
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Failed to load video stream')
          setLoading(false)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.addEventListener('loadedmetadata', () => {
        setLoading(false)
        video.play().catch(() => setPlaying(false))
      })
    } else {
      setError('HLS playback is not supported in this browser')
      setLoading(false)
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy()
    }
  }, [streamUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime)
    }
    const onLoadedMeta = () => {
      setDuration(video.duration)
      onDuration?.(video.duration)
    }
    const onProgressEvt = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const onPlay = () => {
      setPlaying(true)
      setShowPauseAd(false)
    }
    const onPause = () => {
      setPlaying(false)
      // Show pause ad for free users
      if (planRank < 2 && !currentAd) {
        const pauseAd = ads.find((a) => a.position_type === 'pause')
        if (pauseAd) {
          setShowPauseAd(true)
          recordAdImpression(pauseAd.id, false, 0)
        }
      }
    }
    const onError = () => {
      setError('Playback error')
      setLoading(false)
    }
    const onWaiting = () => setLoading(true)
    const onCanPlay = () => setLoading(false)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMeta)
    video.addEventListener('progress', onProgressEvt)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('error', onError)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('canplay', onCanPlay)

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMeta)
      video.removeEventListener('progress', onProgressEvt)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('error', onError)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('canplay', onCanPlay)
    }
  }, [onProgress, onDuration, planRank, ads, currentAd])

  const handleAdComplete = () => {
    setCurrentAd(null)
    const video = videoRef.current
    if (video) video.play().catch(() => {})
  }

  const handleAdSkip = () => {
    if (currentAd) {
      midRollTriggered.current.delete(currentAd.cue_time_seconds)
      recordAdImpression(currentAd.id, false, currentAd.duration_seconds / 2)
    }
    handleAdComplete()
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (currentAd) return
    if (playing) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || currentAd) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * duration
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const val = parseFloat(e.target.value)
    video.volume = val
    setVolume(val)
    setMuted(val === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !muted
    setMuted(!muted)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const togglePiP = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch {}
  }

  const handleSpeedChange = (rate: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
    setPlaybackRate(rate)
    setShowSettings(false)
  }

  const handleSkipForward = async () => {
    const video = videoRef.current
    if (!video) return
    if (planRank < 2) {
      const res = await getSkipLimit()
      if (res.success) {
        setSkipLimit(res)
        if (res.skips_used >= res.skips_max) {
          return
        }
      }
      await incrementSkip()
      setSkipLimit((prev) => ({ ...prev, skips_used: prev.skips_used + 1 }))
    }
    video.currentTime = Math.min(duration, video.currentTime + 10)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      if (currentAd) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          toggleMute()
          break
        case 'ArrowLeft':
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          handleSkipForward()
          break
        case 'ArrowUp':
          video.volume = Math.min(1, video.volume + 0.1)
          setVolume(video.volume)
          break
        case 'ArrowDown':
          video.volume = Math.max(0, video.volume - 0.1)
          setVolume(video.volume)
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [togglePlay, toggleFullscreen, toggleMute, duration, currentAd, handleSkipForward])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0
  const canSkipForward = skipLimit.skips_used < skipLimit.skips_max
  const isFreeTier = planRank < 2

  const speeds = [0.5, 1, 1.5, 2]

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden group"
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Pause Ad Overlay (free tier only) */}
      {showPauseAd && (
        <AdOverlay
          ad={ads.find((a) => a.position_type === 'pause') || null}
          onComplete={() => setShowPauseAd(false)}
          onSkip={() => setShowPauseAd(false)}
          visible={showPauseAd}
        />
      )}

      {/* Mid-roll Ad Overlay */}
      {currentAd && (
        <AdOverlay
          ad={currentAd}
          onComplete={handleAdComplete}
          onSkip={handleAdSkip}
          visible={!!currentAd}
        />
      )}

      <video
        ref={videoRef}
        className={`w-full aspect-video object-contain cursor-pointer ${currentAd || showPauseAd ? 'pointer-events-none' : ''}`}
        onClick={togglePlay}
        playsInline
        poster={undefined}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <p className="text-red-400 text-lg font-semibold mb-2">Playback Error</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {isFreeTier && !loading && !error && !currentAd && !showPauseAd && (
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white/60 z-20">
          480p
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {title && (
          <p className="text-sm text-gray-300 mb-2 truncate px-1">{title}</p>
        )}

        <div
          className="relative h-1 bg-white/20 rounded-full mb-4 cursor-pointer group/seek"
          onClick={handleSeek}
        >
          <div
            className="absolute h-full bg-white/30 rounded-full"
            style={{ width: `${bufferProgress}%` }}
          />
          <div
            className="absolute h-full bg-accent rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, marginLeft: -6 }}
          />
          <AdTimelinePips ads={ads} duration={duration} currentTime={currentTime} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Icon name="pause" /> : <Icon name="play_arrow" />}
            </button>

            <button onClick={handleSkipForward} className="text-white hover:text-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Skip forward" disabled={!canSkipForward && isFreeTier}>
              <Icon name="forward_10" />
            </button>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white hover:text-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted || volume === 0 ? <Icon name="volume_off" /> : <Icon name="volume_up" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="w-20 h-1 accent-accent"
              />
            </div>

            <span className="text-xs text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isFreeTier && (
              <span className="text-xs text-white/40 font-mono bg-white/5 px-2 py-1 rounded">
                {skipLimit.skips_used}/{skipLimit.skips_max} skips
              </span>
            )}

            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Settings"
              >
                <Icon name="settings" />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-surface-secondary border border-white/10 rounded-xl p-2 min-w-[140px] shadow-2xl">
                  <p className="text-xs text-gray-400 px-2 pt-1 pb-2 font-medium">Speed</p>
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${
                        playbackRate === s
                          ? 'text-accent bg-accent/10'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={togglePiP} className="text-white hover:text-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Picture in picture">
              <Icon name="picture_in_picture" />
            </button>

            <button onClick={toggleFullscreen} className="text-white hover:text-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? <Icon name="fullscreen_exit" /> : <Icon name="fullscreen" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
