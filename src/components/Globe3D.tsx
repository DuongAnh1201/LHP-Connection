import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type GlobeInstance from 'react-globe.gl'
import type { GlobeMode, Post } from '../types'
import { getOptimizedImageUrl } from '../lib/cloudinary'

const LHP_COORDS = { lat: 10.7769, lng: 106.6951 }
const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="300"><rect width="420" height="300" fill="%23081122"/><text x="210" y="160" text-anchor="middle" fill="%238892a8" font-family="sans-serif" font-size="16">No Image</text></svg>')

interface Globe3DProps {
  posts: Post[]
  featuredPost: Post | null
  onFeaturedClick?: () => void
}

export default function Globe3D({ posts, featuredPost, onFeaturedClick }: Globe3DProps) {
  const globeRef = useRef<React.ComponentRef<typeof GlobeInstance>>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [GlobeComponent, setGlobeComponent] = useState<typeof GlobeInstance | null>(null)
  const [mode, setMode] = useState<GlobeMode>('arcs')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 960, height: 560 })

  useEffect(() => {
    let active = true

    import('react-globe.gl').then((module) => {
      if (active) setGlobeComponent(() => module.default)
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDimensions({ width, height })
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => setReduceMotion(mediaQuery.matches)

    syncMotionPreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMotionPreference)
      return () => mediaQuery.removeEventListener('change', syncMotionPreference)
    }

    mediaQuery.addListener(syncMotionPreference)
    return () => mediaQuery.removeListener(syncMotionPreference)
  }, [])

  useEffect(() => {
    if (!globeRef.current) return

    const globe = globeRef.current
    globe.pointOfView({ lat: LHP_COORDS.lat, lng: LHP_COORDS.lng, altitude: 2.25 }, 0)
    globe.controls().autoRotate = !reduceMotion
    globe.controls().autoRotateSpeed = 0.42
    globe.controls().enableZoom = true
  }, [GlobeComponent, reduceMotion])

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))

    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [])

  const postsWithCoordinates = useMemo(
    () => posts.filter((post) => post.lat != null && post.lng != null),
    [posts]
  )



  const arcsData = useMemo(
    () =>
      postsWithCoordinates.map((post) => ({
        startLat: LHP_COORDS.lat,
        startLng: LHP_COORDS.lng,
        endLat: post.lat!,
        endLng: post.lng!,
        color: ['#f4d189cc', '#ff6f74cc'],
      })),
    [postsWithCoordinates]
  )

  const pointsData = useMemo(
    () =>
      postsWithCoordinates.map((post) => ({
        lat: post.lat!,
        lng: post.lng!,
        size: featuredPost?.id === post.id ? 0.56 : 0.34,
        color: featuredPost?.id === post.id ? '#f4d189' : '#ff6f74',
        label: `${post.name} — ${[post.city, post.country].filter(Boolean).join(', ')}`,
      })),
    [featuredPost?.id, postsWithCoordinates]
  )

  const homeLabel = useMemo(
    () => [
      {
        lat: LHP_COORDS.lat,
        lng: LHP_COORDS.lng,
        text: 'LHP',
        size: 1.08,
        color: '#f7f8fb',
      },
    ],
    []
  )

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => undefined)
      return
    }

    document.exitFullscreen().catch(() => undefined)
  }, [])

  const featuredImageUrl = featuredPost?.image_url
    ? getOptimizedImageUrl(featuredPost.image_url, 720)
    : PLACEHOLDER
  const featuredLocation = featuredPost
    ? [featuredPost.city, featuredPost.country].filter(Boolean).join(', ')
    : ''

  if (!GlobeComponent) {
    return (
      <div className="flex h-[440px] w-full items-center justify-center rounded-[32px] border border-border/70 bg-panel text-sm text-text-faint">
        <span className="animate-pulse">Đang tải bản đồ kết nối...</span>
      </div>
    )
  }

  const Globe = GlobeComponent as React.ComponentType<Record<string, unknown>>

  const previewCard = featuredPost ? (
    <button
      type="button"
      onClick={onFeaturedClick}
      disabled={!onFeaturedClick}
      className="group w-full overflow-hidden rounded-2xl border border-white/5 bg-panel-muted/90 text-left shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_16px_48px_rgba(249,115,22,0.15)] disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:border-white/5"
    >
      <div className="aspect-square overflow-hidden bg-panel">
        <img src={featuredImageUrl} alt={featuredPost.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Hồ sơ nổi bật</p>
          <span className="text-[11px] font-medium text-text-faint">{featuredLocation || 'Đang cập nhật'}</span>
        </div>
        <h3 className="truncate text-xl font-bold tracking-tight text-white">{featuredPost.name}</h3>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {featuredPost.class && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-text-dim">
              {featuredPost.class}
            </span>
          )}
          {featuredPost.school_year && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
              {featuredPost.school_year}
            </span>
          )}
        </div>
      </div>
    </button>
  ) : null

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border border-border/70 bg-[#04070f] shadow-[0_30px_90px_rgba(0,0,0,0.35)] ${
        isFullscreen ? 'h-screen rounded-none' : 'h-[440px] rounded-[32px] sm:h-[560px] xl:h-[620px]'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(44,88,181,0.28),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(231,91,98,0.18),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(212,168,74,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#04070f] to-transparent" />



      <div className="absolute right-4 top-4 z-20 flex flex-wrap justify-end gap-2 sm:right-5 sm:top-5">
        {(['arcs', 'cities'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-full border px-4 py-2 text-[12px] font-medium transition-all ${
              mode === value
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-white/10 bg-panel/80 text-text-dim backdrop-blur-md hover:border-white/20 hover:text-white'
            }`}
          >
            {value === 'arcs' ? 'Liên kết' : 'Thành phố'}
          </button>
        ))}

        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex h-9.5 items-center justify-center rounded-full border border-white/10 bg-panel/80 px-4 text-[12px] font-medium text-text-dim backdrop-blur-md transition-all hover:border-white/20 hover:text-white"
          aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        >
          {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
        </button>
      </div>

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        arcsData={mode === 'arcs' ? arcsData : []}
        arcColor="color"
        arcDashLength={0.36}
        arcDashGap={0.24}
        arcDashAnimateTime={reduceMotion ? 0 : 1500}
        arcStroke={0.45}
        pointsData={pointsData}
        pointAltitude="size"
        pointColor="color"
        pointRadius={0.28}
        pointLabel="label"
        labelsData={homeLabel}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelSize="size"
        labelColor="color"
        labelDotRadius={0.35}
        labelAltitude={0.01}
        animateIn={!reduceMotion}
        width={dimensions.width}
        height={dimensions.height}
      />

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-panel/80 px-4 py-2 text-[12px] font-medium text-text-soft backdrop-blur-md">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Kéo để khám phá</span>
      </div>

      {previewCard && (
        <>
          <div className="absolute inset-x-4 bottom-4 z-20 md:hidden">{previewCard}</div>
          <div className="absolute bottom-5 right-5 z-20 hidden w-[310px] md:block xl:w-[340px]">{previewCard}</div>
        </>
      )}
    </div>
  )
}
