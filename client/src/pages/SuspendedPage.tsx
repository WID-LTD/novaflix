import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getToken, myAppeals } from '../lib/auth'
import { submitAppeal } from '../lib/auth'
import Icon from '../components/ui/Icon'

export default function SuspendedPage() {
  const { user, accountStatus, logout, loading } = useAuth()
  const [message, setMessage] = useState('')
  const [appeals, setAppeals] = useState<any[]>([])
  const [hasPending, setHasPending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    myAppeals(token).then((r) => {
      if (r.success) {
        setAppeals(r.appeals || [])
        setHasPending((r.appeals || []).some((a: any) => a.status === 'pending'))
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSubmitting(true)
    setFeedback(null)
    const token = getToken()
    if (!token) return
    const res = await submitAppeal(token, message, accountStatus === 'banned' ? 'ban' : 'suspension')
    if (res.success) {
      setFeedback({ type: 'ok', text: 'Appeal submitted. Our team will review it shortly.' })
      setMessage('')
      setHasPending(true)
      const m = await myAppeals(token)
      if (m.success) setAppeals(m.appeals || [])
    } else {
      setFeedback({ type: 'err', text: res.error || 'Failed to submit appeal' })
    }
    setSubmitting(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant">
        Loading…
      </div>
    )
  }

  const isBanned = accountStatus === 'banned'
  const reason = (user as any).accountReason || 'Policy violation'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/combination-mark-logo.png" alt="NovaFlix" className="w-8 h-8 object-contain" />
          <span className="font-headline-md text-headline-md text-on-surface">NovaFlix</span>
        </div>
        <button onClick={logout} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
          Sign out
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg glass-panel rounded-xl p-6 md:p-8 border border-outline-variant/20">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isBanned ? 'bg-error/15 text-error' : 'bg-amber-500/15 text-amber-400'}`}>
            <Icon name={isBanned ? 'gpp_bad' : 'hourglass_bottom'} weight={600} />
          </div>

          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            {isBanned ? 'Account banned' : 'Account suspended'}
          </h1>

          <p className="text-body-md text-on-surface-variant mb-4">
            {isBanned
              ? 'Your account has been banned. If you believe this is a mistake, you can submit an appeal below.'
              : 'Your account has been temporarily suspended. You can submit an appeal below for review, or wait for the suspension to end.'}
          </p>

          {reason && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-surface-container-low border border-white/5 text-sm">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant/60 mb-1">Reason on record</p>
              <p className="text-on-surface">{reason}</p>
            </div>
          )}

          {hasPending ? (
            <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl text-sm mb-4">
              You already have a pending appeal. Our team will review it and get back to you.
            </div>
          ) : (
            <>
              <label className="block text-xs text-on-surface-variant mb-1">Submit an appeal</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Explain why you believe your account should be restored…"
                className="w-full rounded-xl bg-surface-container-low border border-white/10 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none resize-none mb-3"
              />
              {feedback && (
                <div className={`mb-3 px-4 py-2 rounded-xl text-sm ${feedback.type === 'ok' ? 'bg-success/10 text-success border border-success/30' : 'bg-error/10 text-error border border-error/30'}`}>
                  {feedback.text}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
                className="w-full py-3 bg-primary-container text-on-primary-container font-label-md text-label-md rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit appeal'}
              </button>
            </>
          )}

          {appeals.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant/60 mb-2">Appeal history</p>
              <div className="space-y-2">
                {appeals.map((a: any) => (
                  <div key={a.id} className="px-4 py-3 rounded-xl bg-surface-container-low border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold capitalize ${
                        a.status === 'approved' ? 'text-success' : a.status === 'denied' ? 'text-error' : 'text-amber-400'
                      }`}>
                        {a.status}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">{a.appeal_type}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant line-clamp-2">{a.message}</p>
                    {a.resolution_note && <p className="text-xs text-on-surface-variant/70 mt-1">Response: {a.resolution_note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-on-surface-variant/60 mt-6">Questions? Contact <span className="text-primary">support@novaflix.com</span></p>
        </div>
      </main>
    </div>
  )
}