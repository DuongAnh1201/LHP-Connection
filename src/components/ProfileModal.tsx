import { useEffect, useState } from 'react'
import type { Post } from '../types'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { getOptimizedImageUrl } from '../lib/cloudinary'

interface ProfileModalProps {
  post: Post
  onClose: () => void
  onDeleted: () => void
  onEdit: (post: Post) => void
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%231a2438"/><text x="300" y="210" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="16">No Image</text></svg>')

export default function ProfileModal({ post, onClose, onDeleted, onEdit }: ProfileModalProps) {
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const isOwner = user && post.user_id === user.id

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xoá bài viết này?')) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id)
      if (error) throw error
      onDeleted()
    } catch {
      alert('Xoá thất bại. Vui lòng thử lại.')
    } finally {
      setDeleting(false)
    }
  }

  const imageUrl = post.image_url ? getOptimizedImageUrl(post.image_url, 800) : PLACEHOLDER
  const location = [post.city, post.country].filter(Boolean).join(', ')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative bg-card rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-base/80 backdrop-blur-sm rounded-full text-text-faint hover:text-text transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="aspect-[3/2] overflow-hidden rounded-t-2xl">
          <img src={imageUrl} alt={post.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-text">{post.name}</h2>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.class && (
              <span className="inline-flex items-center px-2.5 py-1 text-[12px] font-medium bg-pill text-text-dim rounded-lg border border-pill-border">
                {post.class}
              </span>
            )}
            {post.school_year && (
              <span className="inline-flex items-center px-2.5 py-1 text-[12px] font-medium bg-pill text-text-dim rounded-lg border border-pill-border">
                {post.school_year}
              </span>
            )}
          </div>

          {location && (
            <p className="text-[14px] text-text-faint mt-3 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {location}
            </p>
          )}

          {post.email && (
            <p className="text-[14px] text-text-faint mt-2 flex items-center gap-1.5 min-w-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <a href={`mailto:${post.email}`} className="text-red/90 hover:text-red truncate underline-offset-2 hover:underline">
                {post.email}
              </a>
            </p>
          )}

          {(post.linkedin_url || post.facebook_url) && (
            <div className="flex items-center gap-3 mt-3">
              {post.linkedin_url && (
                <a
                  href={post.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-faint hover:text-sky-400 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
              {post.facebook_url && (
                <a
                  href={post.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-faint hover:text-blue-400 transition-colors"
                  aria-label="Facebook"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {post.caption && (
            <p className="text-[15px] text-text-dim mt-4 leading-relaxed">{post.caption}</p>
          )}

          <p className="text-[12px] text-text-faint mt-4">
            {new Date(post.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {isOwner && (
            <div className="flex gap-3 mt-5 pt-5 border-t border-border">
              <button
                onClick={() => onEdit(post)}
                className="flex-1 py-2.5 bg-pill text-text-dim text-[14px] font-medium rounded-xl border border-pill-border hover:text-text hover:border-border-hover transition-all cursor-pointer"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-950/40 text-rose-300 text-[14px] font-medium rounded-xl border border-rose-900/50 hover:bg-rose-950/60 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
