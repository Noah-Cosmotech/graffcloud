'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { useI18n } from '@/components/I18nProvider'

/* ─── Interactive pilot globe (canvas) ──────────────────────────── */
const PILOT_CITIES = [
  { name: 'Oslo',      lat: 59.91, lon: 10.75, r: 5,   factKey: 'globe_fact_oslo' },
  { name: 'Bergen',    lat: 60.39, lon: 5.32,  r: 4,   factKey: 'globe_fact_bergen' },
  { name: 'Trondheim', lat: 63.43, lon: 10.40, r: 4,   factKey: 'globe_fact_trondheim' },
  { name: 'Stavanger', lat: 58.97, lon: 5.73,  r: 4,   factKey: 'globe_fact_stavanger' },
] as const

const GLOBE_LINKS: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 3]]

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function latLonToXYZ(lat: number, lon: number): [number, number, number] {
  const φ = toRad(lat); const λ = toRad(lon)
  return [Math.cos(φ) * Math.cos(λ), Math.sin(φ), Math.cos(φ) * Math.sin(λ)]
}

function rotY(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a); const sn = Math.sin(a)
  return [c * x + sn * z, y, -sn * x + c * z]
}

// Rotation that puts ~8°E (southern Norway) facing the viewer
const GLOBE_HOME = toRad(8) - Math.PI / 2

function PilotGlobe({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef({ rot: GLOBE_HOME, dragging: false, lastX: 0, moved: 0, idleT: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const cityPx: { x: number; y: number; front: boolean }[] = PILOT_CITIES.map(() => ({ x: 0, y: 0, front: false }))
    ;(canvas as HTMLCanvasElement & { __cityPx?: typeof cityPx }).__cityPx = cityPx

    function draw(t: number) {
      const c = canvasRef.current
      if (!c || !ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = c.clientWidth; const H = c.clientHeight
      if (c.width !== W * dpr || c.height !== H * dpr) {
        c.width = W * dpr; c.height = H * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const st = rotRef.current
      // Gentle sway around Norway when idle, so the pilot cities stay in focus
      if (!st.dragging) {
        st.idleT += 1
        const target = GLOBE_HOME + Math.sin(st.idleT * 0.004) * 0.22
        st.rot += (target - st.rot) * 0.02
      }
      const rot = st.rot

      const cx = W / 2; const cy = H / 2 + 6
      const R = Math.min(W, H) * 0.40

      // Sphere outline + graticule
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      for (const ry of [0.33, 0.62, 0.86]) {
        ctx.beginPath(); ctx.ellipse(cx, cy, R, R * ry, 0, 0, Math.PI * 2); ctx.stroke()
      }
      // Meridians (rotate with globe)
      for (let m = 0; m < 6; m++) {
        const lonM = (m * 60)
        ctx.beginPath()
        let started = false
        for (let la = -85; la <= 85; la += 5) {
          const [x0, y0, z0] = latLonToXYZ(la, lonM)
          const [rx, ryy, rz] = rotY(x0, y0, z0, rot)
          if (rz < 0) { started = false; continue }
          const sx = cx + rx * R; const sy = cy - ryy * R
          if (!started) { ctx.moveTo(sx, sy); started = true } else ctx.lineTo(sx, sy)
        }
        ctx.stroke()
      }

      // Surface dots
      const N = 700
      const golden = Math.PI * (3 - Math.sqrt(5))
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      for (let i = 0; i < N; i++) {
        const y0 = 1 - (i / (N - 1)) * 2
        const rad = Math.sqrt(1 - y0 * y0)
        const th = golden * i
        const [rx, ryy, rz] = rotY(Math.cos(th) * rad, y0, Math.sin(th) * rad, rot)
        if (rz < 0) continue
        ctx.beginPath()
        ctx.arc(cx + rx * R, cy - ryy * R, 0.9, 0, Math.PI * 2)
        ctx.fill()
      }

      // Project cities
      PILOT_CITIES.forEach((city, i) => {
        const [x0, y0, z0] = latLonToXYZ(city.lat, city.lon)
        const [rx, ryy, rz] = rotY(x0, y0, z0, rot)
        cityPx[i] = { x: cx + rx * R, y: cy - ryy * R, front: rz > 0 }
      })

      // Pilot network arcs (slerp great circles)
      for (const [ai, bi] of GLOBE_LINKS) {
        const a = PILOT_CITIES[ai]; const b = PILOT_CITIES[bi]
        const [ax, ay, az] = latLonToXYZ(a.lat, a.lon)
        const [bx, by, bz] = latLonToXYZ(b.lat, b.lon)
        const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz))
        const om = Math.acos(dot)
        ctx.beginPath()
        let started = false
        const steps = 24
        for (let k = 0; k <= steps; k++) {
          const f = k / steps
          let x0: number; let y0: number; let z0: number
          if (om < 0.001) { x0 = ax; y0 = ay; z0 = az } else {
            const sO = Math.sin(om)
            const fa = Math.sin((1 - f) * om) / sO
            const fb = Math.sin(f * om) / sO
            x0 = fa * ax + fb * bx; y0 = fa * ay + fb * by; z0 = fa * az + fb * bz
            const len = Math.hypot(x0, y0, z0); x0 /= len; y0 /= len; z0 /= len
          }
          const [rx, ryy, rz] = rotY(x0, y0, z0, rot)
          if (rz < 0) { started = false; continue }
          // Lift the arc slightly off the surface
          const lift = 1 + Math.sin(f * Math.PI) * 0.04
          const sx = cx + rx * R * lift; const sy = cy - ryy * R * lift
          if (!started) { ctx.moveTo(sx, sy); started = true } else ctx.lineTo(sx, sy)
        }
        ctx.strokeStyle = 'rgba(229,72,92,0.45)'
        ctx.lineWidth = 1.2
        ctx.setLineDash([4, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // City markers + labels
      const pulse = (Math.sin(t * 0.003) + 1) / 2
      PILOT_CITIES.forEach((city, i) => {
        const p = cityPx[i]
        if (!p.front) return
        const isSel = i === selected
        // Halo
        ctx.beginPath()
        ctx.arc(p.x, p.y, city.r + 5 + pulse * 4, 0, Math.PI * 2)
        ctx.fillStyle = isSel ? 'rgba(229,72,92,0.28)' : 'rgba(229,72,92,0.12)'
        ctx.fill()
        // Dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, isSel ? city.r + 1 : city.r, 0, Math.PI * 2)
        ctx.fillStyle = '#E5485C'
        ctx.fill()
        // Label
        ctx.font = `${isSel ? 600 : 400} 11px ui-monospace, monospace`
        ctx.fillStyle = isSel ? '#ffffff' : 'rgba(255,255,255,0.65)'
        const lx = city.name === 'Bergen' || city.name === 'Stavanger' ? p.x - ctx.measureText(city.name).width - 10 : p.x + 9
        ctx.fillText(city.name, lx, p.y + 4)
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [selected])

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const st = rotRef.current
    st.dragging = true; st.lastX = e.clientX; st.moved = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const st = rotRef.current
    if (!st.dragging) return
    const dx = e.clientX - st.lastX
    st.lastX = e.clientX
    st.moved += Math.abs(dx)
    st.rot += dx * 0.006
  }
  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const st = rotRef.current
    st.dragging = false
    st.idleT = 0
    if (st.moved < 6) {
      // Treat as a tap — hit-test the pilot cities
      const rect = e.currentTarget.getBoundingClientRect()
      const px = e.clientX - rect.left; const py = e.clientY - rect.top
      const cityPx = (e.currentTarget as HTMLCanvasElement & { __cityPx?: { x: number; y: number; front: boolean }[] }).__cityPx
      if (cityPx) {
        let best = -1; let bestD = 22
        cityPx.forEach((p, i) => {
          if (!p.front) return
          const d = Math.hypot(p.x - px, p.y - py)
          if (d < bestD) { bestD = d; best = i }
        })
        if (best >= 0) onSelect(best)
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'grab', touchAction: 'pan-y' }}
    />
  )
}

/* ─── Property damage index chart (Oslo Police District) ────────── */
function DamageIndexChart() {
  // Index: pre-pandemic average = 100 → 2024 ≈ 128 → 2025 (H1 annualised) ≈ 118
  // Derived from Oslo PD "Anmeldt kriminalitet 1. halvår 2025": −8% vs 2024, +18% vs pre-pandemic
  const series: { x: number; y: number; v: number; label: string }[] = [
    { x: 10,  y: 72, v: 100, label: '2019*' },
    { x: 185, y: 24, v: 128, label: '2024' },
    { x: 350, y: 41, v: 118, label: '2025*' },
  ]
  const pathD = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = pathD + ' L350,100 L10,100 Z'

  return (
    <svg viewBox="0 0 360 112" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 112 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-bright)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand-bright)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} stroke="var(--brand-bright)" strokeWidth="2" fill="none" strokeLinejoin="round" />
      {series.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="var(--brand-bright)" />
          <text x={p.x} y={p.y - 9} fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="monospace" textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}>
            {p.v}
          </text>
          <text x={p.x} y={108} fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="monospace" textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ─── Glyph SVG ─────────────────────────────────────────────────── */
function GraffGlyph({ label }: { label: string }) {
  return (
    <div style={{
      background: 'var(--ink)',
      borderRadius: 'var(--r-md)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'center',
    }}>
      <svg viewBox="0 0 80 40" fill="none" style={{ width: 80, height: 40 }}>
        <text
          x="4" y="32"
          fontSize="28"
          fontWeight="900"
          fontFamily="monospace"
          fill="var(--brand-bright)"
          letterSpacing="-1"
          style={{ fontStyle: 'italic' }}
        >
          {label}
        </text>
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
        SIGNATURE CLUSTER
      </span>
    </div>
  )
}

/* ─── Section label ─────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.15em',
      textTransform: 'uppercase' as const,
      color: 'var(--ink-4)',
      marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const { t } = useI18n()
  const [selectedCity, setSelectedCity] = useState(0)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      <Nav active="product" />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section id="product" style={{ padding: 'clamp(40px,7vw,80px) clamp(16px,5vw,40px) 72px', maxWidth: 1280, margin: '0 auto' }}>
        <div className="r-grid-2 gc-hero-grid" style={{ gap: 64, alignItems: 'center' }}>
          {/* Left column */}
          <div>
            <div className="pill" style={{ marginBottom: 28 }}>
              <span className="pill-dot" />
              {t('hero_eyebrow')}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 62px)',
              fontWeight: 400,
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              margin: '0 0 24px',
              color: 'var(--ink)',
            }}>
              {t('hero_title_a')}<br />
              <em style={{ color: 'var(--brand)', fontStyle: 'italic' }}>
                {t('hero_title_b')}
              </em>
            </h1>
            <p style={{
              fontSize: 17,
              color: 'var(--ink-3)',
              lineHeight: 1.65,
              maxWidth: 480,
              margin: '0 0 36px',
            }}>
              {t('hero_sub')}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <Link href="/login?mode=signup" className="btn btn-primary" style={{ fontSize: 15, padding: '14px 26px' }}>
                {t('hero_cta_primary')} →
              </Link>
              <Link href="/intelligence" className="btn btn-ghost" style={{ fontSize: 15, padding: '14px 26px' }}>
                {t('hero_cta_secondary')}
              </Link>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-4)', margin: 0 }}>
              🇳🇴 {t('hero_proof')}
            </p>
          </div>

          {/* Right column — interactive pilot globe */}
          <div className="gc-hero-right" style={{
            background: 'var(--ink)',
            borderRadius: 'var(--r-xl)',
            padding: 32,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 380,
          }}>
            <PilotGlobe selected={selectedCity} onSelect={setSelectedCity} />

            {/* Drag hint */}
            <div style={{
              position: 'absolute', top: 24, left: 24, pointerEvents: 'none',
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.35)',
            }}>
              {t('globe_drag').toUpperCase()}
            </div>

            {/* Pilot badge */}
            <div style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--r-md)',
              padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.1)',
              pointerEvents: 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 4 }}>
                {t('globe_pilot_label')}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: '#fff', fontWeight: 600 }}>
                {t('globe_pilot_cities')}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Oslo · Bergen · Trondheim · Stavanger</div>
            </div>

            {/* Selected city fact */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none',
              maxWidth: '60%',
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--brand-bright)',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(229,72,92,0.25)',
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                {PILOT_CITIES[selectedCity].name} — {t(PILOT_CITIES[selectedCity].factKey)}
              </span>
            </div>

            {/* Real stat chip */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              background: 'var(--brand)',
              borderRadius: 'var(--r-md)',
              padding: '8px 14px',
              pointerEvents: 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {t('globe_chip_stat')}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
                {t('globe_chip_stat_sub')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS BAR ──────────────────────────────────────────── */}
      <section className="gc-metrics-bar" style={{ background: 'var(--ink)', padding: '40px clamp(16px,5vw,40px)' }}>
        <div className="r-grid-4" style={{ maxWidth: 1280, margin: '0 auto', gap: 0 }}>
          {[
            { num: t('metric1_num'), label: t('metric1_label') },
            { num: t('metric2_num'), label: t('metric2_label') },
            { num: t('metric3_num'), label: t('metric3_label') },
            { num: t('metric4_num'), label: t('metric4_label') },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '8px 32px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(26px, 2.6vw, 38px)',
                color: 'var(--brand-bright)',
                lineHeight: 1,
                marginBottom: 8,
                whiteSpace: 'nowrap',
              }}>
                {m.num}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1280, margin: '20px auto 0', textAlign: 'center' }}>
          <a
            href="https://www.ssb.no/sosiale-forhold-og-kriminalitet/kriminalitet-og-rettsvesen/statistikk/anmeldte-lovbrudd-og-ofre"
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
          >
            {t('metrics_sources')} ↗
          </a>
        </div>
      </section>

      {/* ── THESIS / ONTOLOGY ────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div className="r-grid-2" style={{ gap: 24 }}>
          {/* White card — ontology */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r-xl)',
            padding: '44px 48px',
            border: '1px solid var(--line)',
          }}>
            <SectionLabel>THE ONTOLOGY LAYER</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 400,
              margin: '0 0 16px',
              lineHeight: 1.1,
            }}>
              Entities, not incidents.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 32px' }}>
              Every upload enriches a knowledge graph that links tag→crew→route→suspect across all 9 cities simultaneously.
            </p>

            {/* Match visualizer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <GraffGlyph label="K4Z3" />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: 2,
                  background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand) 100%)',
                  borderRadius: 2,
                  position: 'relative',
                  marginBottom: 10,
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'var(--surface)',
                    border: '2px solid var(--brand)',
                    borderRadius: 'var(--r-pill)',
                    padding: '4px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--brand)',
                    whiteSpace: 'nowrap' as const,
                  }}>
                    92% match
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginTop: 14 }}>
                  Oslo → Bergen
                </div>
              </div>
              <GraffGlyph label="K4Z3" />
            </div>
          </div>

          {/* Dark card — data moat */}
          <div style={{
            background: 'var(--ink)',
            borderRadius: 'var(--r-xl)',
            padding: '44px 48px',
            color: '#fff',
          }}>
            <SectionLabel>THE DATA MOAT</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 400,
              margin: '0 0 16px',
              lineHeight: 1.1,
              color: '#fff',
            }}>
              Every upload makes the graph sharper.
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 32px' }}>
              Network effects compound. Our model has seen 2,187 unique crew signatures — growing by ~40 per week across active cities.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { n: '41,842', l: 'Evidence records' },
                { n: '2,187', l: 'Signature clusters' },
                { n: '148', l: 'Inferred crews' },
                { n: '11d', l: 'Cross-city latency' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 'var(--r-md)',
                  padding: '20px 22px',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--brand-bright)', marginBottom: 6 }}>
                    {s.n}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', background: 'var(--bg-sand)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>{t('section_how')}</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 400,
            margin: '0 0 56px',
            letterSpacing: '-0.015em',
          }}>
            {t('section_how')}
          </h2>
          <div className="r-grid-4" style={{ gap: 24 }}>
            {[
              {
                n: '01', title: t('step1_t'), desc: t('step1_d'),
                endpoint: 'POST /api/evidence/ingest',
              },
              {
                n: '02', title: t('step2_t'), desc: t('step2_d'),
                endpoint: 'GET /api/cluster/{id}',
              },
              {
                n: '03', title: t('step3_t'), desc: t('step3_d'),
                endpoint: 'GET /api/graph/traverse',
              },
              {
                n: '04', title: t('step4_t'), desc: t('step4_d'),
                endpoint: 'POST /api/dossier/export',
              },
            ].map((step) => (
              <div key={step.n} style={{
                background: 'var(--surface)',
                borderRadius: 'var(--r-lg)',
                padding: '32px 28px',
                border: '1px solid var(--line)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  color: 'var(--brand)',
                  marginBottom: 16,
                }}>
                  STEP {step.n}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 400,
                  margin: '0 0 12px',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 24px' }}>
                  {step.desc}
                </p>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  background: 'var(--bg-sand)',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  letterSpacing: '0.03em',
                }}>
                  {step.endpoint}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CITIES ───────────────────────────────────────────────── */}
      <section id="cities" style={{ padding: '80px 40px', background: 'var(--bg-mint)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>{t('cities_title')}</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 400,
            margin: '0 0 48px',
            letterSpacing: '-0.015em',
          }}>
            {t('cities_title')}
          </h2>

          {/* Live cities */}
          <div className="r-grid-6" style={{ gap: 16, marginBottom: 16 }}>
            {[
              { city: 'Oslo', incidents: '18,412', partners: '34' },
              { city: 'Bergen', incidents: '7,208', partners: '12' },
              { city: 'Trondheim', incidents: '4,091', partners: '8' },
              { city: 'Stavanger', incidents: '2,654', partners: '6' },
              { city: 'Tromsø', incidents: '1,102', partners: '3' },
              { city: 'Drammen', incidents: '1,834', partners: '4' },
            ].map((c) => (
              <div key={c.city} style={{
                background: 'var(--surface)',
                borderRadius: 'var(--r-lg)',
                padding: '22px 20px',
                border: '1px solid var(--line)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand)', letterSpacing: '0.1em', fontWeight: 600 }}>
                    LIVE
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 4 }}>
                  {c.city}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-4)' }}>
                  {c.incidents} incidents
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-5)', marginTop: 2 }}>
                  {c.partners} partners
                </div>
              </div>
            ))}
          </div>

          {/* Coming soon */}
          <div className="r-grid-6" style={{ gap: 16 }}>
            {[
              { city: 'Kristiansand', eta: 'Q3 2026' },
              { city: 'Ålesund', eta: 'Q3 2026' },
              { city: 'Fredrikstad', eta: 'Q4 2026' },
              { city: 'Bodø', eta: 'Q4 2026' },
              { city: 'København', eta: '2027' },
              { city: 'Stockholm', eta: '2027' },
            ].map((c) => (
              <div key={c.city} style={{
                background: 'rgba(255,255,255,0.45)',
                borderRadius: 'var(--r-lg)',
                padding: '22px 20px',
                border: '1px solid var(--line)',
                opacity: 0.7,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--ink-5)',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em', fontWeight: 600 }}>
                    {c.eta}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-3)', marginBottom: 4 }}>
                  {c.city}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-5)' }}>
                  Waitlist open
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSURERS ─────────────────────────────────────────────── */}
      <section id="insurers" style={{ padding: '80px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div className="r-grid-2" style={{ gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <SectionLabel>{t('insurers_title')}</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 40,
              fontWeight: 400,
              margin: '0 0 20px',
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
            }}>
              {t('insurers_title')}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.65, margin: '0 0 36px', maxWidth: 440 }}>
              {t('insurers_sub')}
            </p>

            {/* Insurer logo pills */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {[
                'IF SKADEFORSIKRING',
                'GJENSIDIGE',
                'TRYG',
                'FREMTIND',
                'SPAREBANK 1',
              ].map((ins) => (
                <div key={ins} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-pill)',
                  width: 'fit-content',
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'var(--bg-sand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--ink-3)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {ins[0]}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
                    {ins}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dark chart card */}
          <div style={{
            background: 'var(--ink)',
            borderRadius: 'var(--r-xl)',
            padding: '36px',
            color: '#fff',
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginBottom: 6 }}>
                {t('ins_chart_label')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--brand-bright)' }}>
                  {t('ins_chart_num')}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  {t('ins_chart_sub')}
                </div>
              </div>
            </div>
            <DamageIndexChart />
            <div style={{ marginTop: 8, fontSize: 9.5, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
              {t('ins_chart_note')}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 16 }}>
              {[
                { val: t('ins_stat1_val'), label: t('ins_stat1_label') },
                { val: t('ins_stat2_val'), label: t('ins_stat2_label') },
                { val: t('ins_stat3_val'), label: t('ins_stat3_label') },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap' }}>{s.val}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '80px 40px', background: 'var(--bg-sand)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <SectionLabel>{t('pricing_title')}</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 42,
              fontWeight: 400,
              margin: '0 0 14px',
              letterSpacing: '-0.015em',
            }}>
              {t('pricing_title')}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: 0 }}>{t('pricing_sub')}</p>
          </div>

          <div className="r-grid-3" style={{ gap: 20, alignItems: 'center' }}>
            {/* Starter */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--r-xl)',
              padding: '36px 32px',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-4)', marginBottom: 20 }}>
                {t('tier_starter').toUpperCase()}
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40 }}>NOK 1,490</span>
                <span style={{ fontSize: 14, color: 'var(--ink-4)' }}>{t('per_month')}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {['Up to 3 properties', 'AI clustering', 'Evidence vault', 'Email support'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--green)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login?mode=signup&plan=starter" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                {t('pricing_cta_start')}
              </Link>
            </div>

            {/* Professional — featured */}
            <div style={{
              background: 'var(--ink)',
              borderRadius: 'var(--r-xl)',
              padding: '40px 32px',
              transform: 'scale(1.02)',
              boxShadow: 'var(--shadow-pop)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--brand)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '5px 14px',
                borderRadius: 'var(--r-pill)',
                whiteSpace: 'nowrap' as const,
              }}>
                MOST POPULAR
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                {t('tier_pro').toUpperCase()}
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: '#fff' }}>NOK 5,900</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{t('per_month')}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {['Up to 25 properties', 'Nordic movement graph', 'Court-ready PDF export', 'Crew & route tracking', 'Dedicated support'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--brand-bright)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login?mode=signup&plan=professional" className="btn btn-primary" style={{
                width: '100%',
                justifyContent: 'center',
                background: 'var(--brand)',
                color: '#fff',
              }}>
                {t('pricing_cta_start')}
              </Link>
            </div>

            {/* Enterprise */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--r-xl)',
              padding: '36px 32px',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-4)', marginBottom: 20 }}>
                {t('tier_enterprise').toUpperCase()}
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 15, color: 'var(--ink-3)' }}>From </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40 }}>NOK 24,900</span>
                <span style={{ fontSize: 14, color: 'var(--ink-4)' }}>{t('per_month')}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {['Unlimited properties', 'Custom city onboarding', 'Insurer API integration', 'Police liaison module', 'SLA + dedicated CSM'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--green)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="mailto:sales@graffcloud.no" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                {t('pricing_cta_contact')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
