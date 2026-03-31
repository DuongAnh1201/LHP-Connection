import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import type GlobeInstance from 'react-globe.gl'
import type { Post, GlobeMode } from '../types'

const LHP_COORDS = { lat: 10.7769, lng: 106.6951 }

interface Globe3DProps {
  posts: Post[]
}

export default function Globe3D({ posts }: Globe3DProps) {
  const globeRef = useRef<React.ComponentRef<typeof GlobeInstance>>(null)
  const [GlobeComponent, setGlobeComponent] = useState<typeof GlobeInstance | null>(null)
  const [mode, setMode] = useState<GlobeMode>('arcs')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 960, h: 540 })

  useEffect(() => {
    import('react-globe.gl').then((mod) => setGlobeComponent(() => mod.default))
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDims({ w: width, h: height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    const g = globeRef.current
    g.pointOfView({ lat: LHP_COORDS.lat, lng: LHP_COORDS.lng, altitude: 2.5 }, 0)
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.5
    g.controls().enableZoom = true
  }, [GlobeComponent])

  const withCoords = useMemo(() => posts.filter((p) => p.lat != null && p.lng != null), [posts])

  const arcsData = useMemo(
    () => withCoords.map((p) => ({
      startLat: LHP_COORDS.lat, startLng: LHP_COORDS.lng,
      endLat: p.lat!, endLng: p.lng!,
      color: ['#f87171aa', '#fb923caa'],
    })),
    [withCoords]
  )

  const pointsData = useMemo(
    () => withCoords.map((p) => ({
      lat: p.lat!, lng: p.lng!, size: 0.4, color: '#f87171',
      label: `${p.name} — ${p.city}, ${p.country}`,
    })),
    [withCoords]
  )

  const homeLabel = useMemo(() => [{
    lat: LHP_COORDS.lat, lng: LHP_COORDS.lng, text: 'NHÀ', size: 1.2, color: '#ffffff',
  }], [])

  const toggleFs = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) containerRef.current.requestFullscreen()
    else document.exitFullscreen()
  }, [])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  if (!GlobeComponent) {
    return (
      <div className="w-full aspect-[16/9] bg-card rounded-2xl flex items-center justify-center border border-border">
        <span className="text-text-faint animate-pulse text-sm">Đang tải bản đồ...</span>
      </div>
    )
  }

  const Globe = GlobeComponent as React.ComponentType<Record<string, unknown>>

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-border bg-[#060a14] ${
        isFullscreen ? 'h-screen rounded-none' : 'aspect-[16/9]'
      }`}
    >
      {/* Fullscreen button */}
      <button
        onClick={toggleFs}
        className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg border border-border text-text-faint hover:text-text transition-colors cursor-pointer"
        aria-label="Fullscreen"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isFullscreen
            ? <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
            : <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />}
        </svg>
      </button>

      {/* Mode toggle */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        {(['arcs', 'cities'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              mode === m
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-card/80 backdrop-blur-sm border border-border text-text-faint hover:text-text hover:border-border-hover'
            }`}
          >
            {m === 'arcs' ? 'Liên kết' : 'Thành phố'}
          </button>
        ))}
      </div>

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        arcsData={mode === 'arcs' ? arcsData : []}
        arcColor="color" arcDashLength={0.4} arcDashGap={0.2}
        arcDashAnimateTime={1500} arcStroke={0.5}
        pointsData={pointsData}
        pointAltitude="size" pointColor="color" pointRadius={0.3} pointLabel="label"
        labelsData={homeLabel}
        labelLat="lat" labelLng="lng" labelText="text"
        labelSize="size" labelColor="color" labelDotRadius={0.4} labelAltitude={0.01}
        animateIn={true}
        width={dims.w} height={dims.h}
      />
    </div>
  )
}
