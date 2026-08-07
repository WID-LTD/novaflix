import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import { getCommunities, getCommunity, createCommunity, joinCommunity, leaveCommunity, getMyCommunities, addCommunityPost, deleteCommunityPost, likeCommunityPost, getCommunityMembers, getForumTopics, getMyEggs } from '../lib/auth'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'

export default function Community() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isCreator } = useAuth()
  const [communities, setCommunities] = useState<any[]>([])
  const [myCommunities, setMyCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [activeTab, setActiveTab] = useState('communities')
  const [trendingTopics, setTrendingTopics] = useState<any[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [myKeys, setMyKeys] = useState<any[]>([])
  const [myKeysLoading, setMyKeysLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== 'keys') return
    const token = localStorage.getItem('novaflix-token') || ''
    if (!token) {
      navigate('/login?redirect=/community')
      return
    }
    setMyKeysLoading(true)
    getMyEggs(token).then((res) => {
      if (res.success) setMyKeys(res.keys || [])
      setMyKeysLoading(false)
    }).catch(() => setMyKeysLoading(false))
  }, [activeTab, navigate])

  const [community, setCommunity] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

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
    getForumTopics('all', 20).then(r => {
      if (r.success) {
        const sorted = [...(r.topics || [])]
          .sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)))
          .slice(0, 3)
        setTrendingTopics(sorted)
      }
      setTrendingLoading(false)
    })
  }, [])

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

  const handleLikePost = async (postId: string) => {
    if (!id) return
    const res = await likeCommunityPost(id, postId)
    if (res.success) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: res.liked, like_count: res.likeCount } : p))
    }
  }

  const openMembers = async () => {
    if (!id) return
    setShowMembers(true)
    setMembersLoading(true)
    const res = await getCommunityMembers(id)
    if (res.success) setMembers(res.members)
    setMembersLoading(false)
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
                  <button onClick={openMembers} className="flex items-center gap-1 hover:text-on-surface transition-colors">
                    <Icon name="group" size="sm" /> {community.member_count} members
                  </button>
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
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? 'text-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    <Icon name={post.liked ? 'favorite' : 'favorite_border'} size="sm" fill={post.liked} />
                    {post.like_count || 0} Likes
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {showMembers && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowMembers(false)}>
              <div className="bg-surface-container-high rounded-2xl p-6 max-w-md w-full border border-white/5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-headline-sm font-bold">Members ({community.member_count})</h2>
                  <button onClick={() => setShowMembers(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close members">
                    <Icon name="close" size="sm" />
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto space-y-2">
                  {membersLoading ? (
                    <p className="text-on-surface-variant text-sm py-4 text-center">Loading members...</p>
                  ) : members.length === 0 ? (
                    <p className="text-on-surface-variant text-sm py-4 text-center">No members yet.</p>
                  ) : (
                    members.map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center overflow-hidden shrink-0">
                          {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : <Icon name="person" className="text-primary-container text-sm" />}
                        </div>
                        <p className="font-label-md text-label-md truncate">{m.name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-surface-container border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-headline-md font-bold mb-1">Community &amp; Engagement</h1>
              <p className="text-on-surface-variant text-sm">Communities · Hot Takes · Debate</p>
            </div>
            {isCreator && (
              <Button onClick={() => setShowCreate(true)}>
                <Icon name="add" size="sm" /> New Community
              </Button>
            )}
          </div>

          <div className="flex gap-1 mb-6 max-w-md bg-surface-container-high rounded-xl p-1 border border-white/5">
            <button
              onClick={() => { setActiveTab('communities'); setSearch('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'communities' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <Icon name="diversity_3" className="w-4 h-4" /> Communities
            </button>
            <button
              onClick={() => navigate('/forum')}
              className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <Icon name="forum" className="w-4 h-4" /> Hot Takes
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'keys' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <Icon name="key" className="w-4 h-4" /> My Keys
            </button>
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
        {activeTab === 'keys' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm font-bold flex items-center gap-2">
                <Icon name="vpn_key" className="text-primary-container" /> My Digital Keys
              </h2>
              <span className="text-sm text-on-surface-variant">{myKeys.length} collected</span>
            </div>

            {myKeysLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} variant="text" className="w-full h-32 rounded-xl" />)}
              </div>
            ) : myKeys.length === 0 ? (
              <div className="bg-surface-container rounded-xl border border-white/5 p-10 text-center">
                <Icon name="key_off" className="text-5xl text-on-surface-variant/30 mx-auto mb-4" />
                <p className="text-on-surface font-label-md mb-1">No keys yet</p>
                <p className="text-on-surface-variant/70 text-sm mb-4 max-w-md mx-auto">
                  Hidden keys are tucked into movies at exact moments. Pause when a glowing key appears on screen to collect it and unlock badges & secret rooms.
                </p>
                <Button variant="secondary" onClick={() => navigate('/')}>
                  Start Hunting <Icon name="arrow_forward" size="sm" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myKeys.map(k => (
                  <motion.div
                    key={k.keyId}
                    whileHover={{ y: -2 }}
                    className="bg-surface-container-high rounded-xl p-4 border border-white/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center shrink-0">
                        <Icon name="vpn_key" className="text-primary-container" />
                      </div>
                      {k.rewardType === 'secret_room' && k.room ? (
                        <button
                          onClick={() => navigate(`/community/room/${k.room.id}`)}
                          className="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold uppercase hover:bg-primary/25 transition-colors"
                        >
                          Enter Room →
                        </button>
                      ) : k.badge ? (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold uppercase flex items-center gap-1">
                          <span>{k.badge.icon}</span> {k.badge.name}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-label-md text-on-surface truncate">
                      {k.contentId}
                    </p>
                    {k.hint && (
                      <p className="text-xs text-on-surface-variant/70 italic mt-1 line-clamp-2">
                        “{k.hint}”
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant/50 mt-2">
                      Found at {Math.floor(k.ts_seconds / 60)}:{Math.floor(k.ts_seconds % 60).toString().padStart(2, '0')}
                      {k.room ? ' • Secret Room unlocked' : ''}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab !== 'keys' && (
        <>
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

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-headline-sm font-bold flex items-center gap-2">
              <Icon name="local_fire_department" className="text-primary-container" /> Trending Hot Takes
            </h2>
            <Button variant="secondary" size="sm" onClick={() => navigate('/forum')}>
              Start a Debate <Icon name="arrow_forward" size="sm" />
            </Button>
          </div>
          {trendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} variant="text" className="w-full h-32 rounded-xl" />)}
            </div>
          ) : trendingTopics.length === 0 ? (
            <div className="bg-surface-container rounded-xl border border-white/5 p-6 text-center">
              <p className="text-on-surface-variant text-sm">No hot takes yet. Start the debate!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingTopics.map(t => (
                <motion.div
                  key={t.id}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/forum/${t.id}`)}
                  className="bg-surface-container-high rounded-xl p-4 border border-white/5 cursor-pointer hover:border-primary-container/20 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase">{t.category}</span>
                    <span className="text-xs text-on-surface-variant/60 ml-auto flex items-center gap-1">
                      <Icon name="thumb_up" className="w-3.5 h-3.5" /> {t.upvotes - t.downvotes}
                    </span>
                  </div>
                  <p className="font-label-md text-label-md text-on-surface line-clamp-2 mb-2">{t.title}</p>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant/70">
                    {t.author_avatar ? <img src={t.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover" /> : <Icon name="person" className="w-4 h-4 text-on-surface-variant/50" />}
                    <span className="truncate">{t.author_name}</span>
                    <span className="ml-auto flex items-center gap-1">💬 {t.reply_count || 0}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

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
        </>
        )}
      </div>
    </div>
  )
}
