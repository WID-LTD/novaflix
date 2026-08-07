import { useEffect, useState } from 'react'
import { getToken, adminCommunity } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatCard from '../components/admin/StatCard'

export default function AdminCommunity() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    adminCommunity(token).then((r) => r.success && setData(r))
  }, [])

  if (!data) return <div className="text-on-surface-variant text-sm">Loading community…</div>

  const communities = data.communities || []
  const forums = data.forums || []
  const followerCount = Number(data.followerCount || 0)
  const totalComments = data.comments || 0
  const totalVideos = data.videos || 0

  return (
    <div>
      <PageHeader icon="forum" title="Community" subtitle="Communities, forums and user-generated content" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-6">
        <StatCard label="Communities" value={communities.length} icon="groups" />
        <StatCard label="Forum Topics" value={forums.length} icon="forum" />
        <StatCard label="Followers" value={followerCount} icon="favorite" />
        <StatCard label="UGC Videos" value={totalVideos} icon="video_library" />
      </div>

      <div className="grid lg:grid-cols-2 gap-gutter mb-6">
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Communities</h3>
          <div className="space-y-3">
            {communities.map((c: any) => (
              <div key={c.id} className="bg-surface-container rounded-xl p-3">
                <p className="text-sm text-on-surface font-medium">{c.name}</p>
                <p className="text-xs text-on-surface-variant mt-1">{c.description ? String(c.description).slice(0, 80) : ''} · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {communities.length === 0 && <p className="text-sm text-on-surface-variant">No communities yet.</p>}
          </div>
        </div>

        <div>
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Forum topics</h3>
          <div className="space-y-3">
            {forums.map((c: any) => (
              <div key={c.id} className="bg-surface-container-high border border-white/5 rounded-xl p-3">
                <p className="text-sm text-on-surface">{c.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">{c.author_name || '—'} · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {forums.length === 0 && <p className="text-sm text-on-surface-variant">No forum topics.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}