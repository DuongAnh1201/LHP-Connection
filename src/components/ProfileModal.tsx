import { useEffect, useState } from 'react'
import type { Post } from '../types'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { getOptimizedImageUrl } from '../lib/cloudinary'

interface ProfileModalProps {
  post: Post
  onClose: () => void
  onDeleted: () => void
  onEdit: () => void
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="600" height="420" fill="%23111826"/><text x="300" y="220" text-anchor="middle" fill="%238892a8" font-family="sans-serif" font-size="18">No Image</text></svg>')

export default function ProfileModal({ post, onClose, onDeleted, onEdit }: ProfileModalProps) {
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const isOwner = Boolean(user && post.user_id === user.id)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
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

  const imageUrl = post.image_url ? getOptimizedImageUrl(post.image_url, 960) : PLACEHOLDER
  const location = [post.city, post.country].filter(Boolean).join(', ')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/78 backdrop-blur-md" />

      <div
        className="relative max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-[28px] border border-border bg-panel shadow-[0_26px_90px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-base/80 text-text transition-colors hover:border-border-strong hover:bg-base-raised"
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="overflow-hidden border-b border-border">
          <div className="aspect-[1.8/1] bg-panel-muted">
            <img src={imageUrl} alt={post.name} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-text-faint">Chi tiết bài viết</p>
              <h2 className="mt-3 text-[30px] font-semibold tracking-tight text-white">{post.name}</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {post.class && (
                <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-strong">
                  {post.class}
                </span>
              )}
              {post.school_year && (
                <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-strong">
                  {post.school_year}
                </span>
              )}
            </div>
          </div>

          {post.job_field && <p className="mt-3 text-sm font-medium text-text-dim">{post.job_field}</p>}
          {location && <p className="mt-2 text-sm text-text-faint">{location}</p>}

          {post.email && (
            <a
              href={`mailto:${post.email}`}
              className="mt-3 inline-flex text-sm text-accent-strong transition-colors hover:text-white"
            >
              {post.email}
            </a>
          )}

          {(post.linkedin_url || post.facebook_url) && (
            <div className="mt-5 flex items-center gap-3">
              {post.linkedin_url && (
                <a
                  href={post.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-base-raised text-text-soft transition-all hover:border-border-strong hover:text-white"
                  aria-label="LinkedIn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
              {post.facebook_url && (
                <a
                  href={post.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-base-raised text-text-soft transition-all hover:border-border-strong hover:text-white"
                  aria-label="Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {post.caption && (
            <p className="mt-6 text-[15px] leading-7 text-text-dim">{post.caption}</p>
          )}

          <p className="mt-6 text-[12px] text-text-faint">
            {new Date(post.created_at).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {isOwner && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-6">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl border border-brand bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-rose-900/40 bg-rose-950/25 px-5 py-3 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-50"
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
