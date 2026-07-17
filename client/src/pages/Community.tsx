import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import { getCommunities, getCommunity, createCommunity, joinCommunity, leaveCommunity, getMyCommunities, addCommunityPost, deleteCommunityPost } from '../lib/auth'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'

export default function Community() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [communities, setCommunities] = useState<any[]>([])
  const [myCommunities, setMyCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const [community, setCommunity] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)

  const loadData = async () => {
    const [allRes, mineRes] = await Promise.all([
      getCommunities(search),
      getMyCommunities(),
    ])
    if (allRes.success) setCommunities(allRes.communities)
    if (mineRes.success) setMyCommunities(mineRes.communities)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!id) return
    setDetailLoading(true)
    getCommunity(id).then(res => {
      if (res.success) {
        setCommunity(res.community)
        setIsMember(res.isMember)
        setPosts(res.posts || [])
      }
      setDetailLoading(false)
    })
  }, [id])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const res = await createCommunity({ name: newName, description: newDesc })
    if (res.success) {
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      loadData()
      navigate(`/community/${res.community.id}`)
    }
  }

  const handleJoin = async (communityId: string) => {
    await joinCommunity(communityId)
    loadData()
    if (id === communityId) {
      setIsMember(true)
    }
  }

  const handleLeave = async (communityId: string) => {
    await leaveCommunity(communityId)
    loadData()
    if (id === communityId) {
      setIsMember(false)
    }
  }

  const handleAddPost = async () => {
    if (!newPost.trim() || !id) return
    const res = await addCommunityPost(id, newPost)
    if (res.success) {
      setPosts(prev => [res.post, ...prev])
      setNewPost('')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!id) return
    await deleteCommunityPost(id, postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  if (id) {
    if (detailLoading) {
      return (
        <div className="min-h-screen p-8">
          <Skeleton variant="hero" className="w-full h-48 rounded-xl mb-6" />
          <Skeleton variant="text" className="w-64 h-8 mb-4" />
          <Skeleton variant="text" className="w-full h-4 mb-2" />
          <Skeleton variant="text" className="w-full h-4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} variant="text" className="w-full h-20" />)}
          </div>
        </div>
      )
    }
    if (!community) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-on-surface-variant text-lg">Community not found</p>
        </div>
      )
    }
    return (
      <div className="min-h-screen">
        <div className="bg-surface-container border-b border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <button
              onClick={() => navigate('/community')}
              className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-4"
            >
              <Icon name="arrow_back" size="sm" /> Back to Communities
            </button>
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary-container/20 flex items-center justify-center shrink-0 overflow-hidden">
                {community.avatar ? (
                  <img src={community.avatar} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="diversity_3" className="text-primary-container text-3xl" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-headline-md font-bold mb-2">{community.name}</h1>
                <p className="text-on-surface-variant mb-4">{community.description || 'No description'}</p>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-4">
                  <span className="flex items-center gap-1"><Icon name="group" size="sm" /> {community.member_count} members</span>
                  <span>Created by {community.creator_name}</span>
                </div>
                {user?.id === community.creator_id ? (
                  <Button variant="secondary" size="sm" disabled>You're the creator</Button>
                ) : isMember ? (
                  <Button variant="secondary" size="sm" onClick={() => handleLeave(community.id)}>Leave</Button>
                ) : (
                  <Button size="sm" onClick={() => handleJoin(community.id)}>Join</Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {isMember && (
            <div className="bg-surface-container-high rounded-xl p-4 border border-white/5 mb-6">
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Share something with the community..."
                className="w-full bg-transparent text-on-surface placeholder-on-surface-variant/50 resize-none outline-none min-h-[80px]"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleAddPost} disabled={!newPost.trim()}>Post</Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {posts.length === 0 && (
              <p className="text-center text-on-surface-variant py-12">No posts yet. {isMember ? 'Be the first to share!' : 'Join the community to post.'}</p>
            )}
            {posts.map(post => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-container rounded-xl p-4 border border-white/5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center overflow-hidden">
                      {post.user_avatar ? (
                        <img src={post.user_avatar} alt={post.user_name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="person" className="text-primary-container text-sm" />
                      )}
                    </div>
                    <div>
                      <p className="font-label-md text-label-md">{post.user_name}</p>
                      <p className="text-xs text-on-surface-variant/60">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {(user?.id === post.user_id || user?.id === community.creator_id) && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-red-400"
                    >
                      <Icon name="delete" size="sm" />
                    </button>
                  )}
                </div>
                <p className="text-body-md whitespace-pre-wrap">{post.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-surface-container border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-headline-md font-bold mb-1">Community</h1>
              <p className="text-on-surface-variant text-sm">Connect with fellow movie lovers</p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Icon name="add" size="sm" /> New Community
            </Button>
          </div>

          <div className="relative max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="w-full bg-surface-container-high border border-white/10 rounded-xl py-3 pl-10 pr-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50"
            />
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-md w-full border border-white/5" onClick={e => e.stopPropagation()}>
            <h2 className="text-headline-sm font-bold mb-4">Create Community</h2>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Community name"
              className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50 mb-3"
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50 resize-none min-h-[80px] mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {myCommunities.length > 0 && (
          <div className="mb-10">
            <h2 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
              <Icon name="bookmark" className="text-primary-container" /> My Communities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myCommunities.map(c => (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/community/${c.id}`)}
                  className="bg-surface-container-high rounded-xl p-4 border border-white/5 cursor-pointer hover:border-primary-container/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center overflow-hidden shrink-0">
                      {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : <Icon name="diversity_3" className="text-primary-container" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md text-label-md truncate">{c.name}</p>
                      <p className="text-xs text-on-surface-variant/60">{c.member_count} members</p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2">{c.description || 'No description'}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-headline-sm font-bold mb-4">All Communities</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} variant="text" className="w-full h-32 rounded-xl" />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="diversity_3" className="text-5xl text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-on-surface-variant">{search ? 'No communities found' : 'No communities yet. Create the first one!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {communities.filter(c => !myCommunities.some(m => m.id === c.id)).map(c => (
              <motion.div
                key={c.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/community/${c.id}`)}
                className="bg-surface-container rounded-xl p-4 border border-white/5 cursor-pointer hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center overflow-hidden shrink-0">
                    {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : <Icon name="diversity_3" className="text-primary-container" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md truncate">{c.name}</p>
                    <p className="text-xs text-on-surface-variant/60">{c.member_count} members</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">{c.description || 'No description'}</p>
                <p className="text-xs text-on-surface-variant/40">Created by {c.creator_name}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
