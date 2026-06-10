'use client'

import { useState } from 'react'
import { Nav } from '@/components/Nav'
import { Drawer } from '@/components/Drawer'
import { ToastContainer, showToast } from '@/components/Toast'
import { useI18n } from '@/components/I18nProvider'

// ── Types ──
interface Property {
  address: string
  score: number
  level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
  exposure: string
  trend: '↑' | '→' | '↓'
  trendLabel: string
  city: string
  recommendation: string
}

interface Claim {
  id: string
  address: string
  amount: string
  badge: 'PRE-FILLED' | 'VERIFIED' | 'PENDING'
  action: 'Review & approve' | 'View'
}

// ── Data ──
const PARTNERS = ['If Skadeforsikring', 'Gjensidige', 'Tryg', 'Fremtind', 'Sparebank 1', 'Storebrand']

const KPIS = [
  { value: '−22%', label: 'Claims cost density', color: 'var(--green)', bg: 'var(--green-wash)' },
  { value: 'NOK 84M', label: 'Claims processed', color: 'var(--ink)', bg: 'var(--bg)' },
  { value: '3,812', label: 'Properties in graph', color: 'var(--ink)', bg: 'var(--bg)' },
  { value: '67%', label: 'Claims pre-filled', color: 'var(--amber)', bg: 'var(--amber-wash)' },
  { value: '4.1×', label: 'Fraud detection rate', color: 'var(--ink)', bg: 'var(--bg)' },
]

const PROPERTIES: Property[] = [
  { address: 'Thorvald Meyers gate 42', score: 91, level: 'CRITICAL', exposure: 'NOK 184k', trend: '↑', trendLabel: 'increasing', city: 'Oslo', recommendation: 'Install tamper-proof CCTV on all ground-floor entry points. Review insurance coverage limit — current exposure exceeds policy cap by 12%.' },
  { address: 'Storgata 36', score: 74, level: 'HIGH', exposure: 'NOK 92k', trend: '→', trendLabel: 'stable', city: 'Oslo', recommendation: 'Schedule quarterly deep-clean contract to reduce dwell-time incentive. Coordinate with neighboring properties on shared lighting programme.' },
  { address: 'Markveien 18', score: 68, level: 'HIGH', exposure: 'NOK 68k', trend: '↓', trendLabel: 'improving', city: 'Oslo', recommendation: 'Improvement trend confirmed — two active signatures have not returned since deterrent installation. Continue monitoring for 60 days.' },
  { address: 'Bryggen 8', score: 42, level: 'MODERATE', exposure: 'NOK 38k', trend: '→', trendLabel: 'stable', city: 'Bergen', recommendation: 'UNESCO heritage zone requires specialist restoration. Pre-approved contractor list on file. Consider bounty incentive to close open signature.' },
  { address: 'Prinsens gate 14', score: 18, level: 'LOW', exposure: 'NOK 12k', trend: '↓', trendLabel: 'improving', city: 'Bergen', recommendation: 'Low risk. Standard annual review recommended. No active signatures matched in last 90 days.' },
]

const CLAIMS: Claim[] = [
  { id: 'CLM-2026-041', address: 'Thorvald Meyers gate 42', amount: 'NOK 18,400', badge: 'PRE-FILLED', action: 'Review & approve' },
  { id: 'CLM-2026-038', address: 'Markveien 18', amount: 'NOK 9,800', badge: 'VERIFIED', action: 'View' },
  { id: 'CLM-2026-035', address: 'Storgata 36', amount: 'NOK 12,100', badge: 'PRE-FILLED', action: 'Review & approve' },
  { id: 'CLM-2026-029', address: 'Bryggen 8', amount: 'NOK 4,200', badge: 'PENDING', action: 'View' },
]

const ENDPOINTS = [
  { method: 'GET', path: '/v2/risk/property/{id}', desc: 'Property risk score + trend' },
  { method: 'GET', path: '/v2/risk/heatmap', desc: 'City heatmap (GeoJSON)' },
  { method: 'GET', path: '/v2/claims/prefill/{incident_id}', desc: 'Pre-fill claim payload' },
  { method: 'POST', path: '/v2/webhooks/subscribe', desc: 'Subscribe to risk alerts' },
]

// ── Helper components ──
function levelColor(level: Property['level']): string {
  switch (level) {
    case 'CRITICAL': return 'var(--red)'
    case 'HIGH': return 'var(--amber)'
    case 'MODERATE': return '#6B8AFE'
    case 'LOW': return 'var(--green)'
  }
}

function levelBg(level: Property['level']): string {
  switch (level) {
    case 'CRITICAL': return 'var(--red-wash)'
    case 'HIGH': return 'var(--amber-wash)'
    case 'MODERATE': return 'var(--blue-wash)'
    case 'LOW': return 'var(--green-wash)'
  }
}

function badgeColor(badge: Claim['badge']): { color: string; bg: string } {
  switch (badge) {
    case 'PRE-FILLED': return { color: 'var(--amber)', bg: 'var(--amber-wash)' }
    case 'VERIFIED': return { color: 'var(--green)', bg: 'var(--green-wash)' }
    case 'PENDING': return { color: 'var(--ink-4)', bg: 'rgba(10,10,10,0.06)' }
  }
}

// ── Chart helpers ──
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr']
const OSLO_DATA = [100, 88, 72, 62]
const BERGEN_DATA = [60, 62, 58, 55]

function toSvgY(val: number, min: number, max: number, height: number): number {
  return height - ((val - min) / (max - min)) * height
}

// ── Heatmap data ──
const WEEK_LABELS = ['Apr 7', 'Apr 14', 'Apr 21', 'Apr 28', 'May 5', 'May 12', 'May 19', 'May 26']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HEATMAP: number[][] = [
  [0.1, 0.1, 0.3, 0.1, 0.3, 0.6, 1.0],
  [0.1, 0.3, 0.1, 0.1, 0.6, 1.0, 0.6],
  [0.3, 0.1, 0.1, 0.3, 0.3, 0.6, 0.3],
  [0.1, 0.1, 0.3, 0.6, 0.3, 1.0, 0.6],
  [0.3, 0.3, 0.1, 0.1, 0.6, 0.6, 1.0],
  [0.1, 0.1, 0.3, 0.3, 0.3, 1.0, 0.6],
  [0.1, 0.3, 0.1, 0.1, 0.6, 0.6, 0.3],
  [0.3, 0.1, 0.3, 0.6, 0.3, 1.0, 1.0],
]

// ── Main component ──
export default function InsurerPage() {
  const { t } = useI18n()
  const [drawerProperty, setDrawerProperty] = useState<Property | null>(null)
  const [drawerClaim, setDrawerClaim] = useState<Claim | null>(null)
  const [keyRevealed, setKeyRevealed] = useState(false)
  const [showTweaks, setShowTweaks] = useState(false)

  // Tweaks state
  const [riskThreshold, setRiskThreshold] = useState(65)
  const [autoPreFill, setAutoPreFill] = useState(true)
  const [fraudAlerts, setFraudAlerts] = useState(true)
  const [gdprBlur, setGdprBlur] = useState(false)
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV' | 'PDF'>('JSON')

  const LIVE_KEY = 'sk_live_gc_ins_••••••••••••••••••••••••••••••r4x9'
  const REVEALED_KEY = 'sk_demo_gc_ins_XXXXXXXXXXXXXXXXXXXX'

  function copyEndpoint(path: string) {
    navigator.clipboard.writeText(`https://api.graffcloud.no${path}`).catch(() => {})
    showToast('Copied to clipboard', 'success')
  }

  const chartW = 480
  const chartH = 120
  const chartPadL = 40
  const chartPadB = 24
  const plotW = chartW - chartPadL - 20
  const plotH = chartH - chartPadB

  function px(i: number): number {
    return chartPadL + (i / (MONTHS.length - 1)) * plotW
  }

  const allVals = [...OSLO_DATA, ...BERGEN_DATA]
  const minV = Math.min(...allVals) - 5
  const maxV = Math.max(...allVals) + 5

  function py(val: number): number {
    return toSvgY(val, minV, maxV, plotH)
  }

  const osloPath = OSLO_DATA.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(v)}`).join(' ')
  const bergenPath = BERGEN_DATA.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(v)}`).join(' ')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <Nav active="insurer" />

      {/* ── HERO ── */}
      <section style={{
        background: '#0A0A0A',
        padding: 'clamp(40px, 6vw, 64px) clamp(16px, 5vw, 40px)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>
            GRAFFCLOUD RISK INTELLIGENCE API · v2.4
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 400, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 16px' }}>
            {t('insurers_title')}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', margin: '0 0 36px', lineHeight: 1.6 }}>
            {t('insurers_sub')}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PARTNERS.map(p => (
              <span key={p} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
                borderRadius: 'var(--r-pill)',
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 500,
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 40px' }} className="gc-insurer-main">

        {/* ── KPI CARDS ── */}
        <div className="r-grid-5" style={{ gap: 16, marginBottom: 48 }}>
          {KPIS.map(kpi => (
            <div key={kpi.label} style={{
              background: kpi.bg,
              borderRadius: 'var(--r-lg)',
              padding: '22px 20px',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, color: kpi.color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', fontWeight: 500, lineHeight: 1.4 }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="r-grid-2" style={{ gap: 24, marginBottom: 32 }}>

          {/* Claims density chart */}
          <div style={{ background: '#0A0A0A', borderRadius: 'var(--r-xl)', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                  CLAIMS COST DENSITY
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', letterSpacing: '-0.01em' }}>
                  Jan–Apr 2026
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  <div style={{ width: 24, height: 2, background: 'var(--brand)', borderRadius: 2 }} />
                  Oslo
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  <div style={{ width: 24, height: 2, background: 'var(--blue)', borderRadius: 2 }} />
                  Bergen
                </div>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              {/* Y axis labels */}
              {[60, 80, 100].map(v => (
                <g key={v}>
                  <text x={chartPadL - 6} y={py(v) + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.25)">{v}</text>
                  <line x1={chartPadL} y1={py(v)} x2={chartPadL + plotW} y2={py(v)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                </g>
              ))}

              {/* X axis labels */}
              {MONTHS.map((m, i) => (
                <text key={m} x={px(i)} y={chartH - 4} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.3)">{m}</text>
              ))}

              {/* GraffCloud activation marker */}
              <line x1={px(1)} y1={0} x2={px(1)} y2={plotH} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
              <text x={px(1) + 4} y={12} fontSize={8} fill="rgba(255,255,255,0.35)">GraffCloud activation</text>

              {/* Lines */}
              <path d={bergenPath} fill="none" stroke="var(--blue)" strokeWidth={2} strokeLinejoin="round" />
              <path d={osloPath} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" />

              {/* Dots */}
              {OSLO_DATA.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r={3.5} fill="var(--brand)" />
              ))}
              {BERGEN_DATA.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r={3} fill="var(--blue)" />
              ))}
            </svg>
          </div>

          {/* Heatmap */}
          <div style={{ background: '#0A0A0A', borderRadius: 'var(--r-xl)', padding: 28 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
              INCIDENT FREQUENCY HEATMAP
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', letterSpacing: '-0.01em', marginBottom: 20 }}>
              Weekly pattern · last 8 weeks
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', gap: 3 }}>
              {/* Day headers */}
              <div />
              {DAYS.map(d => (
                <div key={d} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                  {d}
                </div>
              ))}

              {/* Heatmap rows */}
              {HEATMAP.map((row, wi) => (
                <>
                  <div key={`label-${wi}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)', paddingRight: 4 }}>
                    {WEEK_LABELS[wi]}
                  </div>
                  {row.map((val, di) => (
                    <div
                      key={`cell-${wi}-${di}`}
                      title={`${WEEK_LABELS[wi]} · ${DAYS[di]} · intensity ${Math.round(val * 100)}%`}
                      style={{
                        height: 20,
                        borderRadius: 4,
                        background: `rgba(148,0,20,${val})`,
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    />
                  ))}
                </>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>LOW</span>
              {[0.1, 0.3, 0.6, 1.0].map(v => (
                <div key={v} style={{ width: 16, height: 10, borderRadius: 3, background: `rgba(148,0,20,${v})` }} />
              ))}
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>CRITICAL</span>
            </div>
          </div>
        </div>

        {/* ── PORTFOLIO RISK TABLE ── */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-4)', marginBottom: 4 }}>PORTFOLIO RISK TABLE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '-0.01em' }}>Property risk assessment</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink-5)' }}>Click row for details →</span>
          </div>
          <div className="r-scroll-x">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Address', 'Score', 'Level', 'Exposure', 'Trend', 'City'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-4)', fontWeight: 500, textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROPERTIES.map((prop, i) => (
                <tr
                  key={prop.address}
                  onClick={() => setDrawerProperty(prop)}
                  style={{
                    borderTop: '1px solid var(--line)',
                    cursor: 'pointer',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '15px 20px', fontSize: 14, fontWeight: 500, color: gdprBlur ? 'transparent' : 'var(--ink)', textShadow: gdprBlur ? '0 0 8px var(--ink)' : 'none', userSelect: gdprBlur ? 'none' : 'auto', transition: 'text-shadow .2s' }}>
                    {prop.address}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: 'var(--line-2)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prop.score}%`, background: levelColor(prop.level), borderRadius: 'var(--r-pill)', transition: 'width .4s' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: levelColor(prop.level) }}>{prop.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ background: levelBg(prop.level), color: levelColor(prop.level), fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: 'var(--r-pill)' }}>
                      {prop.level}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: 14, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                    {prop.exposure}
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: 16 }}>
                    <span title={prop.trendLabel} style={{ color: prop.trend === '↑' ? 'var(--red)' : prop.trend === '↓' ? 'var(--green)' : 'var(--ink-4)' }}>
                      {prop.trend}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: 13, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
                    {prop.city}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* ── PRE-FILLED CLAIM FEED ── */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-4)', marginBottom: 4 }}>PRE-FILLED CLAIM FEED</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '-0.01em' }}>Pending claims</div>
          </div>
          <div>
            {CLAIMS.map((claim, i) => {
              const bc = badgeColor(claim.badge)
              return (
                <div
                  key={claim.id}
                  onClick={() => setDrawerClaim(claim)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: i < CLAIMS.length - 1 ? '1px solid var(--line)' : 'none',
                    cursor: 'pointer',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', fontWeight: 600, flexShrink: 0 }}>{claim.id}</span>
                    <span style={{ fontSize: 14, color: gdprBlur ? 'transparent' : 'var(--ink-3)', textShadow: gdprBlur ? '0 0 8px var(--ink-3)' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{claim.address}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{claim.amount}</span>
                    <span style={{ background: bc.bg, color: bc.color, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: 'var(--r-pill)', flexShrink: 0 }}>
                      {claim.badge}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDrawerClaim(claim) }}
                    className="btn btn-ghost"
                    style={{ padding: '7px 16px', fontSize: 12 }}
                  >
                    {claim.action}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── API PANEL ── */}
        <div style={{ background: '#0A0A0A', borderRadius: 'var(--r-xl)', padding: 32, marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
            DEVELOPER
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff', letterSpacing: '-0.01em', marginBottom: 24 }}>
            Risk Score API
          </div>

          {/* API Key */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>LIVE API KEY</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
                    {keyRevealed ? REVEALED_KEY : LIVE_KEY}
                  </code>
                  {keyRevealed && (
                    <span style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4 }}>
                      DEMO KEY
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setKeyRevealed(r => !r)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 'var(--r-pill)', padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}
              >
                {keyRevealed ? 'Hide key' : 'Reveal key'}
              </button>
            </div>
            {keyRevealed && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)', paddingLeft: 4 }}>
                This is a demo key. Real keys are provisioned after contract signing.
              </div>
            )}
          </div>

          {/* Endpoints */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ENDPOINTS.map(ep => (
              <div
                key={ep.path}
                style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: ep.method === 'GET' ? 'var(--green)' : 'var(--amber)',
                    background: ep.method === 'GET' ? 'var(--green-wash)' : 'var(--amber-wash)',
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}>
                    {ep.method}
                  </span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{ep.path}</code>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{ep.desc}</span>
                </div>
                <button
                  onClick={() => copyEndpoint(ep.path)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', borderRadius: 'var(--r-pill)', padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── TWEAKS PANEL ── */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
          <button
            onClick={() => setShowTweaks(t => !t)}
            style={{
              width: '100%',
              padding: '20px 24px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-4)' }}>CONFIGURATION</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)' }}>Risk & export tweaks</div>
            </div>
            <span style={{ fontSize: 18, color: 'var(--ink-4)', transform: showTweaks ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>↓</span>
          </button>

          {showTweaks && (
            <div style={{ padding: '24px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Risk threshold */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)' }}>Risk threshold</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', fontWeight: 700 }}>{riskThreshold}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={riskThreshold}
                  onChange={e => setRiskThreshold(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                  <span>0 (all)</span><span>50 (moderate+)</span><span>100 (critical only)</span>
                </div>
              </div>

              {/* Toggles */}
              {[
                { label: 'Auto pre-fill claims', desc: 'AI automatically populates claim forms from incident data', state: autoPreFill, set: setAutoPreFill },
                { label: 'Fraud alerts', desc: 'Push notification when fraud signature detected', state: fraudAlerts, set: setFraudAlerts },
                { label: 'GDPR anonymise', desc: 'Blur owner names and addresses in this view', state: gdprBlur, set: setGdprBlur },
              ].map(toggle => (
                <div key={toggle.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)', marginBottom: 3 }}>{toggle.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-5)' }}>{toggle.desc}</div>
                  </div>
                  <button
                    onClick={() => toggle.set((s: boolean) => !s)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 'var(--r-pill)',
                      border: 'none',
                      cursor: 'pointer',
                      background: toggle.state ? 'var(--green)' : 'var(--line-2)',
                      position: 'relative',
                      transition: 'background .2s',
                      flexShrink: 0,
                      marginLeft: 16,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 3,
                      left: toggle.state ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left .2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              ))}

              {/* Export format */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)', marginBottom: 10 }}>Export format</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['JSON', 'CSV', 'PDF'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      style={{
                        border: `2px solid ${exportFormat === fmt ? 'var(--ink)' : 'var(--line-2)'}`,
                        background: exportFormat === fmt ? 'var(--ink)' : 'transparent',
                        color: exportFormat === fmt ? '#fff' : 'var(--ink-3)',
                        borderRadius: 'var(--r-pill)',
                        padding: '7px 20px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── PROPERTY DRAWER ── */}
      <Drawer
        open={!!drawerProperty}
        onClose={() => setDrawerProperty(null)}
        title={drawerProperty?.address ?? ''}
        subtitle={`${drawerProperty?.city} · Risk score ${drawerProperty?.score}`}
        actions={
          <>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { showToast('Pre-fill claim initiated', 'success'); setDrawerProperty(null) }}>
              Pre-fill claim
            </button>
            <button className="btn btn-ghost" onClick={() => setDrawerProperty(null)}>
              Close
            </button>
          </>
        }
      >
        {drawerProperty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>RISK SCORE</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: levelColor(drawerProperty.level) }}>{drawerProperty.score}</div>
              </div>
              <div style={{ background: levelBg(drawerProperty.level), borderRadius: 'var(--r-md)', padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>LEVEL</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: levelColor(drawerProperty.level) }}>{drawerProperty.level}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>TREND</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, color: drawerProperty.trend === '↑' ? 'var(--red)' : drawerProperty.trend === '↓' ? 'var(--green)' : 'var(--ink-4)' }}>
                  {drawerProperty.trend}
                </span>
                <span style={{ fontSize: 14, color: 'var(--ink-3)', textTransform: 'capitalize' }}>{drawerProperty.trendLabel}</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>ESTIMATED EXPOSURE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>{drawerProperty.exposure}</div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>RECOMMENDATION</div>
              <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>{drawerProperty.recommendation}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── CLAIM DRAWER ── */}
      <Drawer
        open={!!drawerClaim}
        onClose={() => setDrawerClaim(null)}
        title={drawerClaim?.id ?? ''}
        subtitle={drawerClaim?.address}
        actions={
          drawerClaim?.badge !== 'PENDING' ? (
            <>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { showToast(`${drawerClaim!.id} approved`, 'success'); setDrawerClaim(null) }}>
                Approve
              </button>
              <button className="btn btn-ghost" onClick={() => { showToast('Sent for manual review', 'default'); setDrawerClaim(null) }}>
                Review
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDrawerClaim(null)}>
              Close
            </button>
          )
        }
      >
        {drawerClaim && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>CLAIM AMOUNT</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>{drawerClaim.amount}</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>STATUS</div>
              <span style={{
                background: badgeColor(drawerClaim.badge).bg,
                color: badgeColor(drawerClaim.badge).color,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '5px 12px',
                borderRadius: 'var(--r-pill)',
              }}>
                {drawerClaim.badge}
              </span>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-5)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>CLAIM DETAIL</div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                AI confidence: <strong>94.2%</strong><br />
                Matched signature: <strong>K4Z3</strong><br />
                Evidence photos: <strong>4 attached</strong><br />
                Police ref: <strong>2026-OS-04412</strong><br />
                Cleanup contractor: <strong>Renhold AS</strong>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ToastContainer />
    </div>
  )
}
