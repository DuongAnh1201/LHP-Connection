import { useMemo } from 'react'
import type { Post } from '../types'

interface FilterBarProps {
  posts: Post[]
  selectedClass: string
  selectedYear: string
  selectedCity: string
  onClassChange: (v: string) => void
  onYearChange: (v: string) => void
  onCityChange: (v: string) => void
}

export default function FilterBar({
  posts, selectedClass, selectedYear, selectedCity,
  onClassChange, onYearChange, onCityChange,
}: FilterBarProps) {
  const classes = useMemo(() => [...new Set(posts.map((p) => p.class).filter(Boolean))].sort(), [posts])
  const years = useMemo(() => [...new Set(posts.map((p) => p.school_year).filter(Boolean))].sort(), [posts])
  const cities = useMemo(() =>
    [...new Set(posts.map((p) => [p.city, p.country].filter(Boolean).join(', ')).filter(Boolean))].sort(),
    [posts]
  )

  const base =
    'filter-pill rounded-full px-5 py-2.5 text-[15px] leading-snug cursor-pointer ' +
    'focus:outline-none focus:ring-2 focus:ring-red/25 transition-all duration-200 border'

  const idle = 'bg-surface border-border text-text-dim hover:border-border-hover hover:text-text'
  const chosen = 'bg-red/15 border-red/45 text-text font-medium shadow-[inset_0_0_0_1px_rgba(248,113,113,0.12)]'

  return (
    <div className="flex flex-wrap justify-end gap-2.5 sm:gap-3">
      <select
        value={selectedClass}
        onChange={(e) => onClassChange(e.target.value)}
        className={`${base} ${selectedClass ? chosen : idle}`}
        aria-label="Lọc theo lớp"
      >
        <option value="">Tất cả các lớp</option>
        {classes.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className={`${base} ${selectedYear ? chosen : idle}`}
        aria-label="Lọc theo niên khoá"
      >
        <option value="">Tất cả niên khoá</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <select
        value={selectedCity}
        onChange={(e) => onCityChange(e.target.value)}
        className={`${base} ${selectedCity ? chosen : idle}`}
        aria-label="Lọc theo thành phố"
      >
        <option value="">Tất cả thành phố</option>
        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  )
}
