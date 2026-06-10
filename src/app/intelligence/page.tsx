'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { showToast, ToastContainer } from '@/components/Toast'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/components/I18nProvider'

// ── helpers ──────────────────────────────────────────────────────────────────
function colorWithAlpha(hex: string, a: number): string {
  var r = parseInt(hex.slice(1, 3), 16)
  var g = parseInt(hex.slice(3, 5), 16)
  var b = parseInt(hex.slice(5, 7), 16)
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
}

function toRad(deg: number) { return deg * Math.PI / 180 }

function latLonToXYZ(lat: number, lon: number): [number, number, number] {
  const φ = toRad(lat)
  const λ = toRad(lon)
  return [Math.cos(φ) * Math.cos(λ), Math.sin(φ), Math.cos(φ) * Math.sin(λ)]
}

function rotateY(x: number, y: number, z: number, angle: number): [number, number, number] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [cos * x + sin * z, y, -sin * x + cos * z]
}

// ── constants ─────────────────────────────────────────────────────────────────
const CITIES = [
  { name: 'Oslo',      lat: 59.9,  lon: 10.7,  primary: true },
  { name: 'Bergen',    lat: 60.4,  lon: 5.3,   primary: true },
  { name: 'Trondheim', lat: 63.4,  lon: 10.4,  primary: false },
  { name: 'Göteborg',  lat: 57.7,  lon: 12.0,  primary: false },
  { name: 'Malmö',     lat: 55.6,  lon: 13.0,  primary: false },
  { name: 'København', lat: 55.7,  lon: 12.6,  primary: false },
  { name: 'Hamburg',   lat: 53.6,  lon: 10.0,  primary: false },
  { name: 'Amsterdam', lat: 52.4,  lon: 4.9,   primary: false },
  { name: 'Barcelona', lat: 41.4,  lon: 2.2,   primary: true },
  { name: 'Reykjavík', lat: 64.1,  lon: -21.9, primary: false },
]

const TRAIL_PAIRS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]
]

const HOP_ROWS = [
  { city: 'Oslo',      date: '14 MAR 2026', incidents: 18, status: 'ACTIVE' },
  { city: 'Bergen',    date: '22 MAR 2026', incidents: 8,  status: '' },
  { city: 'Trondheim', date: '01 APR 2026', incidents: 6,  status: '' },
  { city: 'Göteborg',  date: '05 APR 2026', incidents: 4,  status: '' },
  { city: 'Malmö',     date: '09 APR 2026', incidents: 7,  status: '' },
  { city: 'København', date: '13 APR 2026', incidents: 5,  status: '' },
  { city: 'Hamburg',   date: '17 APR 2026', incidents: 3,  status: '' },
  { city: 'Amsterdam', date: '21 APR 2026', incidents: 4,  status: '' },
  { city: 'Barcelona', date: '25 APR 2026', incidents: 5,  status: 'ACTIVE TRAIL' },
]

// ── globe renderer ─────────────────────────────────────────────────────────────
function drawGlobe(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rotation: number,
  arcGlow: number,
  showTrail: boolean,
  showDots: boolean,
  photonSpeed: number,
  focusCity: number | null,
  t: number
) {
  ctx.clearRect(0, 0, W, H)

  const cx = W / 2
  const cy = H / 2
  const R = Math.min(W, H) * 0.42

  // Atmosphere glow
  const atmGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.18)
  atmGrad.addColorStop(0, 'rgba(229,72,92,0.07)')
  atmGrad.addColorStop(1, 'rgba(229,72,92,0)')
  ctx.beginPath()
  ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2)
  ctx.fillStyle = atmGrad
  ctx.fill()

  // Globe base
  const globeGrad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, R)
  globeGrad.addColorStop(0, '#1a1a2e')
  globeGrad.addColorStop(1, '#050510')
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = globeGrad
  ctx.fill()

  // Fibonacci surface dots
  if (showDots) {
    const N = 1800
    const golden = Math.PI * (3 - Math.sqrt(5))
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    for (let i = 0; i < N; i++) {
      const y0 = 1 - (i / (N - 1)) * 2
      const radius = Math.sqrt(1 - y0 * y0)
      const theta = golden * i
      let x0 = Math.cos(theta) * radius
      const z0 = Math.sin(theta) * radius
      const [rx, ry, rz] = rotateY(x0, y0, z0, rotation)
      if (rz < 0) continue // back-face cull
      const sx = cx + rx * R
      const sy = cy - ry * R
      ctx.beginPath()
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Project city
  function projectCity(cityIdx: number): { sx: number; sy: number; visible: boolean; rz: number } {
    const c = CITIES[cityIdx]
    const [x0, y0, z0] = latLonToXYZ(c.lat, c.lon)
    const [rx, ry, rz] = rotateY(x0, y0, z0, rotation)
    return { sx: cx + rx * R, sy: cy - ry * R, visible: rz > -0.1, rz }
  }

  // Great-circle arc
  function drawArc(cityA: number, cityB: number, photonT: number) {
    const a = CITIES[cityA]
    const b = CITIES[cityB]
    const [ax, ay, az] = latLonToXYZ(a.lat, a.lon)
    const [bx, by, bz] = latLonToXYZ(b.lat, b.lon)

    const steps = 60
    const points: { sx: number; sy: number; rz: number }[] = []

    for (let i = 0; i <= steps; i++) {
      const frac = i / steps
      // Slerp
      const dot = ax * bx + ay * by + az * bz
      const omega = Math.acos(Math.max(-1, Math.min(1, dot)))
      let x0, y0, z0
      if (Math.abs(omega) < 0.001) {
        x0 = ax; y0 = ay; z0 = az
      } else {
        const sinO = Math.sin(omega)
        const fa = Math.sin((1 - frac) * omega) / sinO
        const fb = Math.sin(frac * omega) / sinO
        x0 = fa * ax + fb * bx
        y0 = fa * ay + fb * by
        z0 = fa * az + fb * bz
      }
      const [rx, ry, rz] = rotateY(x0, y0, z0, rotation)
      points.push({ sx: cx + rx * R, sy: cy - ry * R, rz })
    }

    // Draw arc segments
    for (let i = 0; i < steps; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      if (p0.rz < 0 && p1.rz < 0) continue
      const alpha = arcGlow * (p0.rz > 0 ? 0.9 : 0.2)
      const grad = ctx.createLinearGradient(p0.sx, p0.sy, p1.sx, p1.sy)
      grad.addColorStop(0, colorWithAlpha('#E5485C', alpha))
      grad.addColorStop(1, colorWithAlpha('#F06A7C', alpha))
      ctx.beginPath()
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#E5485C'
      ctx.shadowBlur = arcGlow * 8
      ctx.moveTo(p0.sx, p0.sy)
      ctx.lineTo(p1.sx, p1.sy)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Photon particle
    if (showTrail) {
      const frac = photonT % 1
      const idx = frac * steps
      const i0 = Math.floor(idx)
      const i1 = Math.min(i0 + 1, steps)
      const f = idx - i0
      const px = points[i0].sx + (points[i1].sx - points[i0].sx) * f
      const py = points[i0].sy + (points[i1].sy - points[i0].sy) * f
      const rz = points[i0].rz
      if (rz > 0) {
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 6)
        pg.addColorStop(0, 'rgba(255,205,212,1)')
        pg.addColorStop(0.5, 'rgba(229,72,92,0.6)')
        pg.addColorStop(1, 'rgba(229,72,92,0)')
        ctx.beginPath()
        ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fillStyle = pg
        ctx.fill()
        // Core dot
        ctx.beginPath()
        ctx.arc(px, py, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#FFE9EC'
        ctx.fill()
      }
    }
  }

  // Draw all arcs
  if (showTrail) {
    TRAIL_PAIRS.forEach(([a, b], i) => {
      const offset = i / TRAIL_PAIRS.length
      const ph = (t * photonSpeed * 0.00015 + offset) % 1
      drawArc(a, b, ph)
    })
  } else {
    TRAIL_PAIRS.forEach(([a, b]) => {
      drawArc(a, b, 0)
    })
  }

  // City dots + rings
  CITIES.forEach((c, i) => {
    const proj = projectCity(i)
    if (!proj.visible) return
    const isPrimary = c.primary
    const pulse = isPrimary ? 0.5 + 0.5 * Math.sin(t * 0.003 + i) : 0

    // Pulsing outer ring
    if (isPrimary) {
      const ringR = 8 + pulse * 6
      const rg = ctx.createRadialGradient(proj.sx, proj.sy, 0, proj.sx, proj.sy, ringR)
      rg.addColorStop(0, 'rgba(229,72,92,0.0)')
      rg.addColorStop(0.6, colorWithAlpha('#E5485C', 0.25 * pulse))
      rg.addColorStop(1, 'rgba(229,72,92,0)')
      ctx.beginPath()
      ctx.arc(proj.sx, proj.sy, ringR, 0, Math.PI * 2)
      ctx.fillStyle = rg
      ctx.fill()
    }

    // City dot
    const dotR = isPrimary ? 5 : 3.5
    const dg = ctx.createRadialGradient(proj.sx, proj.sy, 0, proj.sx, proj.sy, dotR)
    dg.addColorStop(0, '#FFF5CC')
    dg.addColorStop(1, isPrimary ? '#E5485C' : '#AAAAAA')
    ctx.beginPath()
    ctx.arc(proj.sx, proj.sy, dotR, 0, Math.PI * 2)
    ctx.fillStyle = dg
    ctx.shadowColor = isPrimary ? '#E5485C' : 'transparent'
    ctx.shadowBlur = isPrimary ? 10 : 0
    ctx.fill()
    ctx.shadowBlur = 0

    // City label
    if (proj.rz > 0.1) {
      ctx.fillStyle = isPrimary ? 'rgba(255,200,100,0.95)' : 'rgba(180,180,180,0.7)'
      ctx.font = `${isPrimary ? 600 : 400} ${isPrimary ? 11 : 9}px var(--font-mono, monospace)`
      ctx.fillText(c.name, proj.sx + 8, proj.sy - 6)
    }
  })

  // Equator + meridian guides (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()
}

// ── component ─────────────────────────────────────────────────────────────────
export default function IntelligencePage() {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const rotRef = useRef(0)
  const tRef = useRef(0)
  const pausedRef = useRef(false)
  const speedRef = useRef(1)
  const arcGlowRef = useRef(0.8)
  const showTrailRef = useRef(true)
  const showDotsRef = useRef(true)
  const photonSpeedRef = useRef(1)
  const focusCityRef = useRef<number | null>(null)
  const focusTargetRef = useRef<number | null>(null)

  const [paused, setPaused] = useState(false)
  const [showTweaks, setShowTweaks] = useState(false)
  const [activeHop, setActiveHop] = useState<number | null>(null)
  const [speed, setSpeed] = useState(1)
  const [arcGlow, setArcGlow] = useState(0.8)
  const [photonSpeed, setPhotonSpeed] = useState(1)
  const [showTrail, setShowTrail] = useState(true)
  const [showDots, setShowDots] = useState(true)
  const [scrubber, setScrubber] = useState(0)
  const [tipDrawerOpen, setTipDrawerOpen] = useState(false)

  // Expose speed to window for external control
  useEffect(() => {
    (window as any)._gcSpeed = 1
  }, [])

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now

      const extSpeed = (window as any)._gcSpeed ?? 1
      const spd = speedRef.current * extSpeed

      if (!pausedRef.current) {
        rotRef.current += (dt / 1000) * spd * 0.25
        tRef.current += dt
      }

      // Focus interpolation
      if (focusTargetRef.current !== null) {
        const target = CITIES[focusTargetRef.current]
        const [tx] = latLonToXYZ(target.lat, target.lon)
        const targetAngle = -Math.atan2(
          Math.cos(toRad(target.lat)) * Math.sin(toRad(target.lon)),
          Math.cos(toRad(target.lat)) * Math.cos(toRad(target.lon))
        )
        const diff = ((targetAngle - rotRef.current) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI
        if (Math.abs(diff) < 0.01) {
          focusTargetRef.current = null
        } else {
          rotRef.current += diff * 0.04
        }
      }

      const dpr = window.devicePixelRatio || 1
      drawGlobe(
        ctx,
        canvas.width / dpr,
        canvas.height / dpr,
        rotRef.current,
        arcGlowRef.current,
        showTrailRef.current,
        showDotsRef.current,
        photonSpeedRef.current,
        focusCityRef.current,
        tRef.current
      )

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [])

  const handleHopClick = (idx: number) => {
    setActiveHop(idx)
    focusTargetRef.current = idx
    showToast(`Focusing on ${HOP_ROWS[idx].city} — ${HOP_ROWS[idx].incidents} incidents`, 'default')
  }

  const handleSpeedChange = (s: number) => {
    setSpeed(s)
    speedRef.current = s
    ;(window as any)._gcSpeed = s
  }

  const handleArcGlowChange = (v: number) => {
    setArcGlow(v)
    arcGlowRef.current = v
  }

  const handlePhotonSpeed = (v: number) => {
    setPhotonSpeed(v)
    photonSpeedRef.current = v
  }

  const handleTrailToggle = () => {
    const v = !showTrailRef.current
    showTrailRef.current = v
    setShowTrail(v)
  }

  const handleDotsToggle = () => {
    const v = !showDotsRef.current
    showDotsRef.current = v
    setShowDots(v)
  }

  const handlePause = () => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }

  const handleFullscreen = () => {
    const el = canvasRef.current?.parentElement?.parentElement
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  const handleExport = () => {
    const w = window.open('', '_blank', 'width=800,height=600')
    if (!w) return
    w.document.write(`
      <html><head><title>K4Z3 Dossier — GraffCloud</title><style>
        body { font-family: monospace; background: #0a0a0a; color: #eee; padding: 40px; }
        h1 { color: #F06A7C; } table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        td, th { padding: 10px 14px; border-bottom: 1px solid #333; text-align: left; }
        th { color: #F06A7C; font-size: 11px; letter-spacing: 0.08em; }
      </style></head><body>
        <h1>K4Z3 — CLUSTER DOSSIER</h1>
        <p>Confidence: 92.4% | Incidents: 74 | Cities: 9 | Estimated damage: NOK 1.8M</p>
        <table>
          <tr><th>City</th><th>Date</th><th>Incidents</th><th>Status</th></tr>
          ${HOP_ROWS.map(h => `<tr><td>${h.city}</td><td>${h.date}</td><td>${h.incidents}</td><td>${h.status || '—'}</td></tr>`).join('')}
        </table>
        <p style="color:#666;margin-top:40px;font-size:11px">Exported ${new Date().toISOString()} · GraffCloud Intelligence Platform</p>
      </body></html>
    `)
    w.document.close()
  }

  return (
    // Dark page — remap the amber accent token to the bright brand red
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--ink)', color: '#fff', overflow: 'hidden', '--amber': 'var(--brand-bright)' } as React.CSSProperties}>
      <ToastContainer />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
        flexShrink: 0, zIndex: 10, flexWrap: 'wrap'
      }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          ← {t('back')}
        </Link>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em', color: 'var(--amber)', flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          K4Z3 — OSLO → BARCELONA
          <span title="Sample data — your real trails populate once your portfolio has sealed incidents" style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '3px 7px', borderRadius: 4, textTransform: 'uppercase',
          }}>Pilot preview</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <LangToggle />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)' }} />
          <button onClick={handlePause} style={iconBtn}>
            {paused ? '▶' : '⏸'}
          </button>
          {([1, 2, 5, 10] as const).map(s => (
            <button key={s} onClick={() => handleSpeedChange(s)} style={{
              ...iconBtn,
              background: speed === s ? 'rgba(229,72,92,0.25)' : 'rgba(255,255,255,0.06)',
              color: speed === s ? 'var(--amber)' : 'rgba(255,255,255,0.6)',
              fontSize: 11, padding: '5px 10px',
            }}>{s}×</button>
          ))}
          <button onClick={handleFullscreen} style={iconBtn} title="Fullscreen">⛶</button>
          <button onClick={() => setShowTweaks(prev => !prev)} style={{
            ...iconBtn,
            background: showTweaks ? 'rgba(229,72,92,0.2)' : 'rgba(255,255,255,0.06)',
            color: showTweaks ? 'var(--amber)' : 'rgba(255,255,255,0.6)',
          }}>{t('intel_tweaks')}</button>
        </div>
      </div>

      {/* Main */}
      <div className="gc-intel-main" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Globe panel */}
        <div className="gc-intel-globe" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          </div>

          {/* Timeline scrubber */}
          <div style={{ padding: '10px 24px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', flexShrink: 0 }}>14 MAR</span>
              <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                {/* Track */}
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                  <div style={{ width: `${scrubber}%`, height: '100%', background: 'var(--amber)', borderRadius: 99, transition: 'width 0.1s' }} />
                </div>
                {/* City marks */}
                {HOP_ROWS.map((_, i) => (
                  <div key={i} onClick={() => { setScrubber((i / 8) * 100); handleHopClick(i) }}
                    style={{ position: 'absolute', left: `${(i / 8) * 100}%`, transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: activeHop === i ? 'var(--amber)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', zIndex: 2 }} />
                ))}
                <input type="range" min={0} max={100} value={scrubber} onChange={e => setScrubber(+e.target.value)}
                  style={{ position: 'absolute', left: 0, right: 0, width: '100%', opacity: 0, cursor: 'pointer', height: 24 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', flexShrink: 0 }}>25 APR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {HOP_ROWS.map((h, i) => (
                <div key={i} onClick={() => { setScrubber((i / 8) * 100); handleHopClick(i) }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: activeHop === i ? 'var(--amber)' : 'rgba(255,255,255,0.2)', cursor: 'pointer', letterSpacing: '0.04em' }}>
                  {h.city.slice(0, 3).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="gc-intel-right" style={{
          width: 360, background: '#111118', borderLeft: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

            {/* Cluster profile */}
            <div style={{ marginBottom: 20, padding: 16, background: 'rgba(229,72,92,0.07)', borderRadius: 12, border: '1px solid rgba(229,72,92,0.2)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(229,72,92,0.6)', letterSpacing: '0.1em', marginBottom: 8 }}>{t('intel_cluster_profile')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--amber)', marginBottom: 4 }}>K4Z3</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[['92.4%', 'confidence'], ['74', 'incidents'], ['9', 'cities'], ['NOK 1.8M', 'damage']].map(([v, l]) => (
                  <div key={l} style={{ flex: '1 1 auto', minWidth: 70, padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#fff', fontWeight: 600 }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Movement log */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 10 }}>{t('intel_movement_log')}</div>
              {HOP_ROWS.map((hop, i) => (
                <div key={i} onClick={() => handleHopClick(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                    background: activeHop === i ? 'rgba(229,72,92,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${activeHop === i ? 'rgba(229,72,92,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: activeHop === i ? 'rgba(229,72,92,0.3)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: activeHop === i ? 'var(--amber)' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: activeHop === i ? 'var(--amber)' : '#fff' }}>{hop.city}</span>
                      {hop.status && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', borderRadius: 99, background: hop.status === 'ACTIVE' ? 'rgba(0,200,100,0.2)' : 'rgba(229,72,92,0.2)', color: hop.status === 'ACTIVE' ? '#4ef09a' : 'var(--amber)', letterSpacing: '0.06em' }}>
                          {hop.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{hop.date} — {hop.incidents} incidents</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>→</div>
                </div>
              ))}
            </div>

            {/* Related entities */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 10 }}>{t('intel_related_entities')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['BRG-09', 'AMS-17', 'rail-hop pattern'].map(e => (
                  <div key={e} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 99, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    {e}
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <button onClick={handleExport} style={{
              width: '100%', padding: '13px 20px', background: 'rgba(229,72,92,0.15)', border: '1px solid rgba(229,72,92,0.35)',
              borderRadius: 10, color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: 12,
              letterSpacing: '0.08em', cursor: 'pointer', fontWeight: 600,
            }}>
              {t('intel_export')} →
            </button>
          </div>
        </div>
      </div>

      {/* Tweaks panel */}
      {showTweaks && (
        <div className="gc-tweaks-panel" style={{
          position: 'fixed', top: 60, right: 370, width: 260, background: '#18181f',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 20,
          zIndex: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>TWEAKS</span>
            <button onClick={() => setShowTweaks(false)} style={{ border: 0, background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>

          <TweakRow label="Globe Speed">
            <input type="range" min={0} max={2} step={0.1} value={speed}
              onChange={e => handleSpeedChange(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--amber)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>{speed.toFixed(1)}×</div>
          </TweakRow>

          <TweakRow label="Arc Glow">
            <input type="range" min={0} max={1} step={0.05} value={arcGlow}
              onChange={e => handleArcGlowChange(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--amber)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>{arcGlow.toFixed(2)}</div>
          </TweakRow>

          <TweakRow label="Photon Speed">
            <div style={{ display: 'flex', gap: 6 }}>
              {[['Slow', 0.4], ['Med', 1], ['Fast', 2.5]].map(([l, v]) => (
                <button key={l as string} onClick={() => handlePhotonSpeed(v as number)} style={{
                  flex: 1, padding: '5px 0', background: photonSpeed === v ? 'rgba(229,72,92,0.2)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${photonSpeed === v ? 'rgba(229,72,92,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: photonSpeed === v ? 'var(--amber)' : 'rgba(255,255,255,0.5)',
                  borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10,
                }}>{l}</button>
              ))}
            </div>
          </TweakRow>

          <TweakRow label="City Focus">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Oslo', 'Bergen', 'Barcelona'].map(name => {
                const idx = CITIES.findIndex(c => c.name === name)
                return (
                  <button key={name} onClick={() => { focusTargetRef.current = idx; showToast(`Focusing ${name}`) }} style={{
                    flex: '1 1 auto', padding: '5px 8px', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', fontSize: 10,
                  }}>{name}</button>
                )
              })}
            </div>
          </TweakRow>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={handleTrailToggle} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${showTrail ? 'rgba(229,72,92,0.4)' : 'rgba(255,255,255,0.1)'}`, background: showTrail ? 'rgba(229,72,92,0.15)' : 'rgba(255,255,255,0.05)', color: showTrail ? 'var(--amber)' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              Trail {showTrail ? 'ON' : 'OFF'}
            </button>
            <button onClick={handleDotsToggle} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${showDots ? 'rgba(229,72,92,0.4)' : 'rgba(255,255,255,0.1)'}`, background: showDots ? 'rgba(229,72,92,0.15)' : 'rgba(255,255,255,0.05)', color: showDots ? 'var(--amber)' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              Dots {showDots ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', marginBottom: 6 }}>{label.toUpperCase()}</div>
      {children}
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  border: 0, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: 13, lineHeight: 1,
  fontFamily: 'var(--font-mono)', transition: 'background 0.15s',
}
