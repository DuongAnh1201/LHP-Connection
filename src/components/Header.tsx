import { useEffect, useRef, useState } from 'react'
import type { View } from '../types'
import { useAuth } from '../lib/AuthContext'

interface HeaderProps {
  currentView: View
  onViewChange: (view: View) => void
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { user, loading, authMessage, signInWithGoogle, signOut, clearAuthMessage } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const authLabel = user?.user_metadata?.full_name || user?.email || 'Tài khoản'

  useEffect(() => {
    if (!menuOpen) return

    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])



  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-base/80 backdrop-blur-md">
      {authMessage && (
        <div className="border-b border-danger/20 bg-danger/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-2 text-[12px] text-danger-300">
            <span className="min-w-0 font-medium">{authMessage}</span>
            <button
              type="button"
              onClick={clearAuthMessage}
              className="shrink-0 text-danger-400/80 transition-colors hover:text-danger-200"
              aria-label="Đóng thông báo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        {/* Left spacing for balance */}
        <div className="hidden flex-1 md:block"></div>

        {/* Center Logo */}
        <button
          type="button"
          onClick={() => onViewChange('list')}
          className="flex shrink-0 flex-col items-center justify-center"
        >
          <div className="flex items-center gap-2">
            <img src="/logo-lhp.png" alt="LHP logo" className="h-5 w-5 object-contain" />
            <span className="text-[18px] font-bold tracking-tight text-white">
              The LHP Network
            </span>
          </div>
        </button>

        {/* Right Side Controls */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3" ref={menuRef}>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Điều hướng chính">
            <button
              type="button"
              onClick={() => onViewChange('list')}
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-all ${currentView === 'list'
                  ? 'bg-accent text-white shadow-[0_4px_20px_rgba(249,115,22,0.3)]'
                  : 'bg-accent/10 text-accent hover:bg-accent/20'
                }`}
            >
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => onViewChange('join')}
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-medium transition-all ${currentView === 'join'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-text-soft hover:bg-white/5 hover:text-white'
                }`}
            >
              Tham gia mạng lưới
            </button>
          </nav>

          {loading ? (
            <div className="flex h-9 w-9 items-center justify-center text-text-faint">
              <span className="text-[11px] animate-pulse">...</span>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={user ? 'Mở menu tài khoản' : 'Mở menu đăng nhập'}
                className="flex h-9 items-center gap-2 rounded-full border border-border bg-panel px-2 pr-3 text-[13px] font-medium text-text transition-all hover:border-border-strong hover:bg-panel-strong"
              >
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-border bg-base-raised text-[10px] font-semibold text-white">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user ? authLabel.slice(0, 1).toUpperCase() : 'G'}</span>
                  )}
                </span>
                <span className="hidden max-w-30 truncate text-left lg:block">
                  {user ? authLabel : 'Login'}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`${menuOpen ? 'rotate-180' : ''} transition-transform text-text-faint`}
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl border border-border bg-panel-strong p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                >
                  {user ? (
                    <>
                      <div className="mb-1 rounded-xl bg-base-raised px-3 py-3">
                        <p className="truncate text-[13px] font-medium text-white">{authLabel}</p>
                        {user.email && (
                          <p className="mt-0.5 truncate text-[11px] text-text-soft">{user.email}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onViewChange('profile')
                          setMenuOpen(false)
                        }}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-[13px] text-text-soft transition-colors hover:bg-base-raised hover:text-white"
                      >
                        Hồ sơ của tôi
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          signOut()
                          setMenuOpen(false)
                        }}
                        className="mt-0.5 flex w-full items-center rounded-lg px-3 py-2 text-[13px] text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        signInWithGoogle()
                      }}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-medium text-text transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Đăng nhập bằng Google
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
