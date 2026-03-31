interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  pages.push(1)
  if (currentPage > 3) pages.push('...')
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
  if (currentPage < totalPages - 2) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)

  const btn = 'w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer'

  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btn} border border-border text-text-faint hover:border-border-hover hover:text-text disabled:opacity-25 disabled:cursor-not-allowed`}
        aria-label="Previous page"
      >‹</button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-text-faint text-[13px]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btn} ${p === currentPage
              ? 'bg-red text-white'
              : 'border border-border text-text-dim hover:border-border-hover hover:text-text'
            }`}
          >{p}</button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btn} border border-border text-text-faint hover:border-border-hover hover:text-text disabled:opacity-25 disabled:cursor-not-allowed`}
        aria-label="Next page"
      >›</button>
    </div>
  )
}
