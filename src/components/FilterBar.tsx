import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Post } from '../types'

interface FilterBarProps {
  posts: Post[]
  searchValue: string
  selectedClass: string
  selectedYear: string
  selectedCity: string
  resultCount: number
  totalCount: number
  onSearchChange: (value: string) => void
  onClassChange: (value: string) => void
  onYearChange: (value: string) => void
  onCityChange: (value: string) => void
  onClearFilters: () => void
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

function SelectField({ label, value, onChange, children }: SelectFieldProps) {
  const isActive = value !== ''

  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-full border px-4 pr-10 text-[13px] font-medium outline-none transition-all ${
            isActive
              ? 'border-accent/30 bg-accent/10 text-accent shadow-[0_4px_16px_rgba(249,115,22,0.12)] focus:border-accent/50'
              : 'border-white/5 bg-white/5 text-text-soft hover:bg-white/10 hover:text-white focus:border-white/20'
          }`}
          aria-label={label}
        >
          {children}
        </select>
        <svg
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${isActive ? 'text-accent' : 'text-text-faint'}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  )
}

export default function FilterBar({
  posts,
  searchValue,
  selectedClass,
  selectedYear,
  selectedCity,
  resultCount,
  totalCount,
  onSearchChange,
  onClassChange,
  onYearChange,
  onCityChange,
  onClearFilters,
}: FilterBarProps) {
  const classes = useMemo(
    () => [...new Set(posts.map((post) => post.class).filter(Boolean))].sort(),
    [posts]
  )
  const years = useMemo(
    () => [...new Set(posts.map((post) => post.school_year).filter(Boolean))].sort(),
    [posts]
  )
  const cities = useMemo(
    () =>
      [...new Set(posts.map((post) => [post.city, post.country].filter(Boolean).join(', ')).filter(Boolean))].sort(),
    [posts]
  )
  const hasActiveFilters = Boolean(searchValue || selectedClass || selectedYear || selectedCity)

  return (
    <div className="w-full rounded-4xl border border-white/5 bg-base/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.78fr))]">
        <label className="flex min-w-0 flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint">
            Tìm theo tên, lớp hoặc địa điểm
          </span>
          <div className="relative">
            <svg
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchValue ? 'text-accent' : 'text-text-faint'}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              <circle cx="11" cy="11" r="6.5" />
            </svg>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className={`h-11 w-full rounded-full border pl-11 pr-4 text-[13px] outline-none transition-all ${
                searchValue
                  ? 'border-accent/30 bg-accent/5 text-white shadow-[0_4px_16px_rgba(249,115,22,0.08)] focus:border-accent/50'
                  : 'border-white/5 bg-white/5 text-text hover:bg-white/10 focus:border-white/20'
              }`}
              placeholder="Ví dụ: Nguyễn, CA1, Hà Nội..."
              aria-label="Tìm kiếm hồ sơ alumni"
            />
          </div>
        </label>

        <SelectField label="Lớp" value={selectedClass} onChange={onClassChange}>
          <option value="">Tất cả các lớp</option>
          {classes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectField>

        <SelectField label="Niên khoá" value={selectedYear} onChange={onYearChange}>
          <option value="">Tất cả niên khoá</option>
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectField>

        <SelectField label="Thành phố" value={selectedCity} onChange={onCityChange}>
          <option value="">Tất cả thành phố</option>
          {cities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-5 flex flex-col items-center justify-center gap-4 border-t border-white/5 pt-5 text-center md:flex-row md:flex-wrap md:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-text-faint">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-white shadow-sm">
            {resultCount} / {totalCount} hồ sơ
          </span>
          <span>Sử dụng bộ lọc để tìm kiếm chính xác hơn.</span>
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex h-9 items-center justify-center rounded-full px-4 text-[12px] font-semibold text-text-soft transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          Xoá bộ lọc
        </button>
      </div>
    </div>
  )
}
