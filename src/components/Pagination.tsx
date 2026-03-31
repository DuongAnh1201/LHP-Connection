interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: Array<number | '...'> = [1]
  if (currentPage > 3) pages.push('...')
  for (let value = Math.max(2, currentPage - 1); value <= Math.min(totalPages - 1, currentPage + 1); value += 1) {
    pages.push(value)
  }
  if (currentPage < totalPages - 2) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)

  const buttonClass =
    'flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-[13px] font-medium transition-all duration-200'

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <p className="text-[12px] uppercase tracking-[0.18em] text-text-faint">
        Trang {currentPage} / {totalPages}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${buttonClass} border-border/80 bg-panel text-text-faint hover:border-border-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-30`}
        aria-label="Trang trước"
      >
        Trước
      </button>

      {pages.map((page, index) =>
        page === '...' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-11 min-w-11 items-center justify-center px-2 text-[12px] text-text-faint"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`${buttonClass} ${
              page === currentPage
                ? 'border-accent bg-accent/10 text-accent-strong shadow-[0_14px_30px_rgba(212,168,74,0.12)]'
                : 'border-border/80 bg-panel text-text-dim hover:border-border-strong hover:text-text'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${buttonClass} border-border/80 bg-panel text-text-faint hover:border-border-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-30`}
        aria-label="Trang sau"
      >
        Sau
      </button>
      </div>
    </div>
  )
}
