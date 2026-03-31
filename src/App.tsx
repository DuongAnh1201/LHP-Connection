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
      // Network errors surface through loading state only for now.
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPosts()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchPosts])

  const handlePostClick = (post: Post) => setModalPost(post)

  const handleModalEdit = () => {
    setModalPost(null)
    setView('profile')
  }

  const handleModalDeleted = () => {
    setModalPost(null)
    fetchPosts()
  }

  return (
    <div className="min-h-screen bg-base text-text">
      <Header currentView={view} onViewChange={setView} />

      {!isConfigured && (
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <div className="rounded-2xl border border-amber-700/25 bg-amber-950/20 px-4 py-3 text-[13px] leading-6 text-amber-100/85">
            <strong>Chưa cấu hình Supabase.</strong>{' '}
            Thêm <code className="rounded bg-amber-900/25 px-1.5 py-0.5 text-[12px]">VITE_SUPABASE_ANON_KEY</code> vào{' '}
            <code className="rounded bg-amber-900/25 px-1.5 py-0.5 text-[12px]">.env</code> để tải dữ liệu thật.
          </div>
        </div>
      )}

      <main className="pb-10 sm:pb-14">
        {view === 'list' ? (
          <ListView posts={posts} loading={loading} onPostClick={handlePostClick} />
        ) : view === 'join' ? (
          <JoinForm
            onSubmitted={() => {
              fetchPosts()
              setView('list')
            }}
            onNavigateProfile={() => setView('profile')}
          />
        ) : (
          <MyProfile onUpdated={fetchPosts} onNavigateJoin={() => setView('join')} />
        )}
      </main>

      <Footer />

      {modalPost && (
        <ProfileModal
          post={modalPost}
          onClose={() => setModalPost(null)}
          onDeleted={handleModalDeleted}
          onEdit={handleModalEdit}
        />
      )}
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
