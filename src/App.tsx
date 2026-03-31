import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import { AuthProvider } from './lib/AuthContext'
import type { Post, View } from './types'
import Header from './components/Header'
import ListView from './components/ListView'
import JoinForm from './components/JoinForm'
import MyProfile from './components/MyProfile'
import ProfileModal from './components/ProfileModal'
import Footer from './components/Footer'

function AppInner() {
  const [view, setView] = useState<View>('list')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [modalPost, setModalPost] = useState<Post | null>(null)

  const fetchPosts = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id,name,class,school_year,city,country,caption,linkedin_url,facebook_url,email,image_url,lat,lng,user_id,is_active,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (!error && data) setPosts(data as Post[])
    } catch {
      // network error
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handlePostClick = (post: Post) => setModalPost(post)

  const handleModalEdit = (post: Post) => {
    setModalPost(null)
    setView('profile')
    void post
  }

  const handleModalDeleted = () => {
    setModalPost(null)
    fetchPosts()
  }

  return (
    <div className="min-h-screen flex flex-col bg-base">
      <Header currentView={view} onViewChange={setView} />

      {!isConfigured && (
        <div className="max-w-[760px] mx-auto mt-4 px-5 w-full">
          <div className="bg-amber-950/30 border border-amber-800/30 text-amber-200/80 px-4 py-3 rounded-xl text-[13px] leading-relaxed">
            <strong>Chưa cấu hình Supabase.</strong>{' '}
            Thêm <code className="bg-amber-900/30 px-1.5 py-0.5 rounded text-[12px]">VITE_SUPABASE_ANON_KEY</code> vào file{' '}
            <code className="bg-amber-900/30 px-1.5 py-0.5 rounded text-[12px]">.env</code>
          </div>
        </div>
      )}

      <main className="flex-1 w-full min-w-0">
        {view === 'list' ? (
          <ListView posts={posts} loading={loading} onPostClick={handlePostClick} />
        ) : view === 'join' ? (
          <JoinForm onSubmitted={() => { fetchPosts(); setView('list') }} />
        ) : (
          <MyProfile onUpdated={fetchPosts} onNavigateJoin={() => setView('join')} />
        )}
      </main>

      {modalPost && (
        <ProfileModal
          post={modalPost}
          onClose={() => setModalPost(null)}
          onDeleted={handleModalDeleted}
          onEdit={handleModalEdit}
        />
      )}

      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
