import type { Post } from '../types'
import { getOptimizedImageUrl } from '../lib/cloudinary'

interface AlumniCardProps {
  post: Post
  onClick?: (post: Post) => void
  selected?: boolean
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23111826"/><text x="200" y="210" text-anchor="middle" fill="%238892a8" font-family="sans-serif" font-size="16">No Image</text></svg>')

export default function AlumniCard({ post, onClick, selected = false }: AlumniCardProps) {
  const imageUrl = post.image_url ? getOptimizedImageUrl(post.image_url) : PLACEHOLDER
  const location = [post.city, post.country].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={() => onClick?.(post)}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-panel transition-all duration-300 text-left ${
        selected
          ? 'border-accent shadow-[0_8px_32px_rgba(249,115,22,0.15)] -translate-y-1'
          : 'border-white/5 shadow-sm hover:-translate-y-1 hover:border-white/10 hover:shadow-lg'
      }`}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden bg-panel-muted sm:aspect-square">
        <img
          src={imageUrl}
          alt={post.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-[20px] font-bold tracking-tight text-white">
          {post.name}
        </h3>

        <p className="mt-2 line-clamp-3 min-h-18 text-[14px] leading-6 text-text-soft">
          {post.caption || 'Hồ sơ đang được cập nhật để bổ sung câu chuyện và trải nghiệm.'}
        </p>

        {(post.class || post.school_year) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.class && (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-text-dim">
                {post.class}
              </span>
            )}
            {post.school_year && (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
                {post.school_year}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <div className="min-w-0">
            <p className="truncate text-[12px] text-text-faint">
              {location || 'Đang cập nhật địa điểm'}
            </p>
          </div>

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent"
          >
            <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  )
}
