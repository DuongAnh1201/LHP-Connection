import { useMemo, useState } from 'react'
import type { Post } from '../types'
import Globe3D from './Globe3D'
import FilterBar from './FilterBar'
import AlumniCard from './AlumniCard'
import Pagination from './Pagination'

const PER_PAGE = 20

interface ListViewProps {
  posts: Post[]
  loading: boolean
  onPostClick: (post: Post) => void
}

export default function ListView({ posts, loading, onPostClick }: ListViewProps) {
  const [selClass, setSelClass] = useState('')
  const [selYear, setSelYear] = useState('')
  const [selCity, setSelCity] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => posts.filter((p) => {
    if (selClass && p.class !== selClass) return false
    if (selYear && p.school_year !== selYear) return false
    if (selCity && [p.city, p.country].filter(Boolean).join(', ') !== selCity) return false
    return true
  }), [posts, selClass, selYear, selCity])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const resetPage = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1) }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-text-faint animate-pulse text-sm">Đang tải...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Globe — full screen width */}
      <div className="w-full px-4 pt-5">
        <Globe3D posts={posts} />
      </div>

      {/* Filters — flush right */}
      <div className="max-w-[1360px] mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 pt-5 mb-10 sm:mb-12">
        <FilterBar
          posts={posts}
          selectedClass={selClass} selectedYear={selYear} selectedCity={selCity}
          onClassChange={resetPage(setSelClass)}
          onYearChange={resetPage(setSelYear)}
          onCityChange={resetPage(setSelCity)}
        />
      </div>

      {/* Cards */}
      <div className="max-w-[1360px] mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {paginated.map((post) => (
            <AlumniCard key={post.id} post={post} onClick={onPostClick} />
          ))}
        </div>

        {paginated.length === 0 && (
          <div className="text-center py-20 text-text-faint text-sm">
            Không tìm thấy kết quả phù hợp.
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
