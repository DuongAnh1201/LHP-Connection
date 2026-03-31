import type { Post } from '../types'
import { getOptimizedImageUrl } from '../lib/cloudinary'

interface AlumniCardProps {
  post: Post
  onClick?: (post: Post) => void
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%231a2438"/><text x="200" y="160" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="14">No Image</text></svg>')

export default function AlumniCard({ post, onClick }: AlumniCardProps) {
  const imageUrl = post.image_url ? getOptimizedImageUrl(post.image_url) : PLACEHOLDER
  const location = [post.city, post.country].filter(Boolean).join(', ')

  return (
    <div
      className="bg-card rounded-2xl border border-border hover:border-border-hover transition-all duration-300 group cursor-pointer overflow-hidden"
      onClick={() => onClick?.(post)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={post.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-4">
        {post.caption && (
          <p className="text-text-faint text-[12px] sm:text-[13px] line-clamp-1 mb-1">
            {post.caption}
          </p>
        )}
        <h3 className="font-bold text-text leading-tight text-[15px] sm:text-[16px]">
          {post.name}
        </h3>
        {(post.class || post.school_year) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.class && (
              <span className="inline-flex items-center font-semibold bg-white/10 text-text-dim rounded px-2 py-0.5 text-[11px]">
                {post.class}
              </span>
            )}
            {post.school_year && (
              <span className="inline-flex items-center font-semibold bg-white/10 text-text-dim rounded px-2 py-0.5 text-[11px]">
                {post.school_year}
              </span>
            )}
          </div>
        )}
        {location && (
          <p className="text-text-faint flex items-center gap-1 text-[12px] sm:text-[13px] mt-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {location}
          </p>
        )}
        {(post.linkedin_url || post.facebook_url) && (
          <div className="flex items-center gap-2.5 mt-2">
            {post.linkedin_url && (
              <a
                href={post.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-text-faint hover:text-sky-400 transition-colors"
                aria-label="LinkedIn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {post.facebook_url && (
              <a
                href={post.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-text-faint hover:text-blue-400 transition-colors"
                aria-label="Facebook"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
