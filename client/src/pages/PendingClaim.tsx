import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import { getApplicationStatus } from '../lib/auth'

export default function PendingClaim() {
  const { user } = useAuth()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApplicationStatus()
      .then(res => {
        if (res.application) setApplication(res.application)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        {loading ? (
          <div className="animate-spin w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full mx-auto" />
        ) : (
          <>
            <span className="material-symbols-outlined text-6xl text-amber-500">
              pending
            </span>
            <h1 className="text-headline-lg mt-4 mb-2">Application Under Review</h1>
            <p className="text-body-lg text-on-surface-variant mb-6">
              Your creator application is being reviewed. This usually takes 1-3 business days.
            </p>

            {application && (
              <div className="p-4 bg-surface-container rounded-xl mb-6 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-sm">Applied</span>
                  <span className="text-on-surface text-sm font-medium">
                    {new Date(application.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-sm">Status</span>
                  <span className="text-sm font-medium capitalize px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                    {application.status}
                  </span>
                </div>
                {application.handle && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant text-sm">Handle</span>
                    <span className="text-on-surface text-sm font-medium">{application.handle}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-body-md text-on-surface-variant">
                While you wait, you can continue enjoying NovaFlix as a viewer.
              </p>
              <Link
                to="/home"
                className="inline-block px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md hover:brightness-110 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
