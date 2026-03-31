import { useDeferredValue, useMemo, useState } from 'react'
import type { Post } from '../types'
import AlumniCard from './AlumniCard'
import FilterBar from './FilterBar'
import Globe3D from './Globe3D'
import Pagination from './Pagination'

const PER_PAGE = 16
const numberFormatter = new Intl.NumberFormat('vi-VN')

interface ListViewProps {
  posts: Post[]
  loading: boolean
  onPostClick: (post: Post) => void
}

export default function ListView({ posts, loading, onPostClick }: ListViewProps) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase())

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        if (selectedClass && post.class !== selectedClass) return false
        if (selectedYear && post.school_year !== selectedYear) return false
        if (selectedCity && [post.city, post.country].filter(Boolean).join(', ') !== selectedCity) return false

        if (!deferredSearch) return true

        const searchableText = [
          post.name,
          post.caption,
          post.class,
          post.school_year,
          post.city,
          post.country,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(deferredSearch)
      }),
    [deferredSearch, posts, selectedClass, selectedCity, selectedYear]
  )

  const totalPages = Math.ceil(filteredPosts.length / PER_PAGE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1

  const paginatedPosts = useMemo(
    () => filteredPosts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [currentPage, filteredPosts]
  )

  const featuredPost = paginatedPosts.find((post) => post.id === selectedId) ?? paginatedPosts[0] ?? null



  const popularCities = useMemo(() => {
    const cityCounts = new Map<string, number>()

    posts.forEach((post) => {
      const location = [post.city, post.country].filter(Boolean).join(', ')
      if (!location) return

      cityCounts.set(location, (cityCounts.get(location) ?? 0) + 1)
    })

    return [...cityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }))
  }, [posts])

  const activeFilters = [
    searchValue.trim() ? `Tìm: ${searchValue.trim()}` : '',
    selectedClass ? `Lớp ${selectedClass}` : '',
    selectedYear ? `Niên khoá ${selectedYear}` : '',
    selectedCity ? selectedCity : '',
  ].filter(Boolean)

  const resetPage = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setPage(1)
  }

  const handleCardClick = (post: Post) => {
    setSelectedId(post.id)
    onPostClick(post)
  }

  const clearFilters = () => {
    setSearchValue('')
    setSelectedClass('')
    setSelectedYear('')
    setSelectedCity('')
    setPage(1)
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-6 py-32">
        <div className="h-14 w-14 rounded-full border border-border/70 border-t-accent animate-spin" />
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent-strong/75">Loading Network</p>
          <p className="mt-2 text-sm text-text-faint">Đang tải dữ liệu alumni và bản đồ kết nối...</p>
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-12 pt-8 lg:pt-10">
      {/* Hero Section */}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Alumni Directory
          </div>

          <div className="space-y-4">
            <h1 className="text-[38px] font-black leading-tight tracking-tight text-white sm:text-[50px] lg:text-[64px]">
              A living map of LHP stories, cities, and relationships.
            </h1>
            <p className="mx-auto max-w-2xl text-[15px] leading-8 text-text-soft sm:text-[16px]">
              Khám phá mạng lưới cựu học sinh Lê Hồng Phong trên toàn cầu. Một không gian để tra cứu, kết nối và theo dõi hành trình của cộng đồng LHP.
            </p>
          </div>
        </div>
      </div>

      {/* Globe Section */}
      <div className="mx-auto mt-8 w-full">
        <Globe3D
          posts={filteredPosts}
          featuredPost={featuredPost}
          onFeaturedClick={featuredPost ? () => handleCardClick(featuredPost) : undefined}
        />
      </div>

      {/* Filter Section */}
      <div className="mx-auto mt-6 w-full">
        <FilterBar
          posts={posts}
          searchValue={searchValue}
          selectedClass={selectedClass}
          selectedYear={selectedYear}
          selectedCity={selectedCity}
          resultCount={filteredPosts.length}
          totalCount={posts.length}
          onSearchChange={handleSearchChange}
          onClassChange={resetPage(setSelectedClass)}
          onYearChange={resetPage(setSelectedYear)}
          onCityChange={resetPage(setSelectedCity)}
          onClearFilters={clearFilters}
        />
      </div>

      {popularCities.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center">
          <span className="text-[11px] uppercase tracking-[0.24em] text-text-faint">Điểm nóng</span>
          {popularCities.map(({ label, count }) => (
            <button
              key={label}
              type="button"
              onClick={() => resetPage(setSelectedCity)(label)}
              className={`rounded-full border px-3 py-2 text-[12px] transition-all ${selectedCity === label
                  ? 'border-accent/35 bg-accent/12 text-accent-strong'
                  : 'border-border/70 bg-panel/70 text-text-soft hover:border-border-strong hover:text-text'
                }`}
            >
              {label} <span className="text-text-faint">({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div
        id="directory-results"
        className="mx-auto mt-8 flex flex-col items-center gap-4 text-center"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-text-faint">
            {activeFilters.length > 0 ? 'Kết quả đã được tinh chỉnh' : 'Toàn bộ mạng lưới'}
          </p>
          <h2 className="mt-2 font-serif text-[32px] leading-none text-white sm:text-[40px]">
            {filteredPosts.length > 0 ? `${numberFormatter.format(filteredPosts.length)} alumni` : 'Không có kết quả phù hợp'}
          </h2>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {activeFilters.map((label) => (
              <span
                key={label}
                className="rounded-full border border-accent/22 bg-accent/10 px-3 py-2 text-[12px] text-accent-strong"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {paginatedPosts.length > 0 ? (
        <>
          <div className="mx-auto mt-6 grid w-full gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {paginatedPosts.map((post) => (
              <AlumniCard
                key={post.id}
                post={post}
                selected={post.id === featuredPost?.id}
                onClick={handleCardClick}
              />
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div className="mx-auto mt-6 w-full max-w-3xl rounded-[30px] border border-border/70 bg-panel/72 px-6 py-14 text-center shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent-strong/75">No Results</p>
          <h3 className="mt-3 font-serif text-[34px] text-white">Không tìm thấy hồ sơ phù hợp.</h3>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-7 text-text-soft">
            Hãy thử tên alumni, một niên khoá khác hoặc xoá bộ lọc để quay lại toàn bộ mạng lưới.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-accent/28 bg-accent/10 px-5 text-[13px] font-medium text-accent-strong transition-all hover:border-accent/45 hover:bg-accent/14"
          >
            Xoá bộ lọc và xem lại tất cả
          </button>
        </div>
      )}
    </section>
  )
}
