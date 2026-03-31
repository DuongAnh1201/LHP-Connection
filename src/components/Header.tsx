import { useState, useRef, useEffect } from 'react'
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

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const go = (view: View) => {
    onViewChange(view)
    setMenuOpen(false)
  }

  const navItems: { view: View; label: string }[] = [
    { view: 'list', label: 'Danh sách' },
    { view: 'join', label: 'Tham gia mạng lưới' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-base/95 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)]">
      {authMessage && (
        <div className="bg-rose-950/50 border-b border-rose-900/40 px-4 py-2.5 text-[13px] text-rose-200 flex items-start justify-between gap-3">
          <span className="min-w-0">{authMessage}</span>
          <button type="button" onClick={clearAuthMessage} className="shrink-0 text-rose-300/80 hover:text-rose-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Full viewport width so account sits at the true top-right of the screen */}
      <div className="flex w-full items-center justify-between gap-3 sm:gap-6 px-3 sm:px-5 lg:px-8 xl:px-12 py-3 sm:py-3.5">
          {/* Brand / left */}
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 pr-2">
            <img
              src="/logo-lhp.png"
              alt="Trường THPT chuyên Lê Hồng Phong"
              className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 object-contain rounded-xl bg-white/[0.06] ring-1 ring-white/10 shadow-inner"
            />
            <div className="min-w-0">
              <h1 className="text-[16px] sm:text-lg font-bold text-text leading-tight tracking-tight">
                The LHP Alumni Connection
              </h1>
              <p className="text-[11px] sm:text-[12px] text-text-faint leading-snug mt-0.5">
                Lê Hồng Phong · Nam Định
              </p>
            </div>
          </div>

          {/* Account + menu — viewport top-right */}
          <div className="flex shrink-0 items-center justify-end" ref={menuRef}>
            {loading ? (
              <span className="text-[12px] text-text-faint animate-pulse px-2">…</span>
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 sm:gap-2.5 pl-1 pr-2 py-1.5 rounded-2xl border border-border-light/80 bg-card/60 hover:bg-card hover:border-border-hover transition-all duration-200 cursor-pointer shadow-sm"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-pill border border-border flex items-center justify-center text-[13px] font-medium text-text-dim">
                      {(user.user_metadata?.full_name || user.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[140px] sm:max-w-[180px] truncate text-left text-[13px] font-medium text-text">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-text-faint shrink-0 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-[min(100vw-2rem,260px)] rounded-xl border border-border bg-card py-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/5"
                  >
                    <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-text-faint border-b border-border/50">
                      Điều hướng
                    </p>
                    {navItems.map(({ view, label }) => (
                      <button
                        key={view}
                        type="button"
                        role="menuitem"
                        onClick={() => go(view)}
                        className={`w-full text-left px-3 py-2.5 text-[14px] transition-colors cursor-pointer ${
                          currentView === view
                            ? 'bg-red/15 text-text font-medium'
                            : 'text-text-dim hover:bg-surface hover:text-text'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => go('profile')}
                      className={`w-full text-left px-3 py-2.5 text-[14px] transition-colors cursor-pointer ${
                        currentView === 'profile'
                          ? 'bg-red/15 text-text font-medium'
                          : 'text-text-dim hover:bg-surface hover:text-text'
                      }`}
                    >
                      Hồ sơ của tôi
                    </button>
                    <div className="my-1 border-t border-border/60" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { signOut(); setMenuOpen(false) }}
                      className="w-full text-left px-3 py-2.5 text-[14px] text-rose-300/90 hover:bg-rose-950/40 border-t border-border/40 cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-border-light/80 bg-card/60 hover:bg-card hover:border-border-hover transition-all duration-200 cursor-pointer text-[13px] font-medium text-text-dim hover:text-text"
                >
                  <span className="hidden sm:inline">Menu</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-[min(100vw-2rem,240px)] rounded-xl border border-border bg-card py-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/5"
                  >
                    {navItems.map(({ view, label }) => (
                      <button
                        key={view}
                        type="button"
                        role="menuitem"
                        onClick={() => go(view)}
                        className={`w-full text-left px-3 py-2.5 text-[14px] transition-colors cursor-pointer ${
                          currentView === view
                            ? 'bg-red/15 text-text font-medium'
                            : 'text-text-dim hover:bg-surface hover:text-text'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-border/60" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); signInWithGoogle() }}
                      className="mx-2 mb-2 mt-1 w-[calc(100%-1rem)] rounded-lg px-3 py-2.5 text-left text-[14px] font-medium bg-white text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Đăng nhập
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </header>
  )
}
