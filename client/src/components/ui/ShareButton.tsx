import { useState } from 'react'
import Icon from './Icon'
import { useAuth } from '../../lib/AuthContext'
import { createShareLink, getShareStats } from '../../lib/auth'

interface ShareButtonProps {
  contentId: string | number
  contentType?: string
  creatorId?: string
  className?: string
}

export default function ShareButton({ contentId, contentType = 'movie', creatorId, className = '' }: ShareButtonProps) {
  const { user } = useAuth()
  const [link, setLink] = useState<string>('')
  const [clicks, setClicks] = useState(0)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const handleShare = async () => {
    if (!user) return
    const res = await createShareLink(String(contentId), contentType, creatorId)
    if (res.success) {
      setLink(res.shareLink.webLink || res.shareLink.resolveUrl || '')
      setOpen(true)
      const stats = await getShareStats(String(contentId), contentType)
      if (stats.success) setClicks(stats.stats.totalClicks)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Check this out', url: link })
      } catch {}
    } else {
      copy()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleShare}
        className="w-full py-3 rounded-lg border border-white/10 text-on-surface font-label-md hover:border-white/25 hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2"
      >
        <Icon name="ios_share" className="w-4 h-4" />
        Share
        {clicks > 0 && <span className="text-xs text-on-surface-variant">({clicks})</span>}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 z-30 bg-surface-container-high border border-white/10 rounded-xl p-3 shadow-2xl">
          <p className="text-xs text-on-surface-variant mb-2">Trackable share link</p>
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full bg-surface-container rounded-lg px-2 py-1.5 text-xs text-on-surface mb-2 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={copy} className="flex-1 py-1.5 rounded-lg bg-white/10 text-xs font-semibold hover:bg-white/20 transition-colors">
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button onClick={nativeShare} className="flex-1 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-semibold hover:brightness-110 transition-colors">
              Share
            </button>
          </div>
          <p className="text-[10px] text-on-surface-variant/60 mt-2">{clicks} clicks on this link</p>
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-on-surface-variant/50 hover:text-on-surface">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
