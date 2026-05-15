'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GCLogo } from '@/components/GCLogo'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/components/I18nProvider'
import { Drawer } from '@/components/Drawer'
import { showToast, ToastContainer } from '@/components/Toast'

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dash_portfolio' as const, icon: IconPortfolio, badge: 0, href: '/dashboard' },
  { key: 'dash_incidents' as const, icon: IconIncidents, badge: 14, href: '/dashboard' },
  { key: 'dash_intel' as const, icon: IconIntel, badge: 0, href: '/intelligence' },
  { key: 'dash_bounty' as const, icon: IconBounty, badge: 41, href: '/bounty' },
  { key: 'dash_billing' as const, icon: IconBilling, badge: 0, href: '/billing' },
  { key: 'dash_settings' as const, icon: IconSettings, badge: 0, href: '/dashboard' },
]

const INCIDENTS = [
  { id: 'INC-04182', address: 'Thorvald Meyers gate 42', tag: 'K4Z3', cost: 'NOK 18,400', status: 'MATCHED', match: 94, lat: 59.923, lng: 10.757 },
  { id: 'INC-04177', address: 'Markveien 18', tag: null, cost: 'NOK 4,200', status: 'NEW', match: null, lat: 59.921, lng: 10.754 },
  { id: 'INC-04169', address: 'Storgata 36', tag: 'K4Z3', cost: 'NOK 9,800', status: 'OPEN', match: 71, lat: 59.913, lng: 10.748 },
  { id: 'INC-04158', address: 'Grensen 17', tag: 'BRG-09', cost: 'NOK 12,100', status: 'MATCHED', match: 88, lat: 59.912, lng: 10.742 },
  { id: 'INC-04144', address: 'Torvgata 2', tag: null, cost: 'NOK 3,400', status: 'NEW', match: null, lat: 59.910, lng: 10.746 },
  { id: 'INC-04132', address: 'Pilestredet 75', tag: null, cost: 'NOK 2,900', status: 'OPEN', match: null, lat: 59.921, lng: 10.730 },
  { id: 'INC-04101', address: 'Møllergata 6', tag: 'SVG-04', cost: 'NOK 6,700', status: 'CLOSED', match: 81, lat: 59.915, lng: 10.749 },
]

const PROPERTIES = [
  { name: 'Thorvald Meyers gate 42', readiness: 91, cost: 'NOK 184k', color: 'red' },
  { name: 'Storgata 36', readiness: 74, cost: 'NOK 92k', color: 'amber' },
  { name: 'Markveien 18', readiness: 68, cost: 'NOK 68k', color: 'amber' },
  { name: 'Grünerløkka Borettslag', readiness: 45, cost: 'NOK 34k', color: 'green' },
  { name: 'Pilestredet 75', readiness: 32, cost: 'NOK 28k', color: 'green' },
]

const ALERTS = [
  { level: 'CRITICAL', color: '#EF4444', dot: '#EF4444', text: 'K4Z3 confirmed match — Thorvald Meyers gate 42' },
  { level: 'WARNING', color: '#F59E0B', dot: '#F59E0B', text: 'Readiness below threshold: Pilestredet 75 (32%)' },
  { level: 'INFO', color: '#3B82F6', dot: '#3B82F6', text: 'New bounty posted: BRG-09 — NOK 10,000' },
]

const BOUNTIES = [
  { id: 'BNT-0041', sig: 'K4Z3', reward: 'NOK 15,000', incidents: 9, zone: 'Grünerløkka / Torshov', posted: '12 May 2026', status: 'ACTIVE' },
  { id: 'BNT-0038', sig: 'BRG-09', reward: 'NOK 10,000', incidents: 5, zone: 'Sentrum / Gamlebyen', posted: '8 May 2026', status: 'ACTIVE' },
  { id: 'BNT-0029', sig: 'SVG-04', reward: 'NOK 6,500', incidents: 3, zone: 'Majorstuen / Frogner', posted: '1 May 2026', status: 'ACTIVE' },
]

// ─── Heatmap dot positions (normalised 0–100 for an SVG viewport) ─────────────

const HEATMAP_DOTS = [
  { x: 62, y: 28, status: 'MATCHED' },
  { x: 54, y: 35, status: 'NEW' },
  { x: 44, y: 58, status: 'OPEN' },
  { x: 36, y: 62, status: 'MATCHED' },
  { x: 43, y: 67, status: 'NEW' },
  { x: 22, y: 30, status: 'OPEN' },
  { x: 47, y: 55, status: 'CLOSED' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string): { bg: string; color: string } {
  switch (status) {
    case 'MATCHED': return { bg: 'var(--amber-wash)', color: 'var(--amber-ink)' }
    case 'NEW': return { bg: 'oklch(0.93 0.04 230)', color: 'oklch(0.45 0.15 230)' }
    case 'OPEN': return { bg: 'rgba(10,10,10,0.05)', color: 'var(--ink-4)' }
    case 'CLOSED': return { bg: 'oklch(0.93 0.04 150)', color: 'oklch(0.45 0.12 150)' }
    default: return { bg: 'rgba(10,10,10,0.05)', color: 'var(--ink-4)' }
  }
}

function dotColor(status: string): string {
  switch (status) {
    case 'MATCHED': return 'var(--amber)'
    case 'NEW': return 'oklch(0.70 0.13 230)'
    case 'OPEN': return 'var(--ink-4)'
    case 'CLOSED': return 'var(--green)'
    default: return 'var(--ink-5)'
  }
}

function readinessColor(color: string): string {
  switch (color) {
    case 'red': return 'var(--red)'
    case 'amber': return 'var(--amber)'
    case 'green': return 'var(--green)'
    default: return 'var(--ink-5)'
  }
}

// ─── Icon components ──────────────────────────────────────────────────────────

function IconPortfolio() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconIncidents() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L14.5 13H1.5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.75" fill="currentColor" />
    </svg>
  )
}

function IconIntel() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconBounty() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4v1M8 11v1M5 8h1M10 8h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconBilling() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 6h14" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="9" width="3" height="1.5" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconBell({ badge }: { badge: number }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8.5 16.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {badge > 0 && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          background: 'var(--red)',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          padding: '2px 4px',
          borderRadius: 999,
          minWidth: 16,
          textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </div>
  )
}

function IconExport() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 9v3h10V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 1v7M4.5 5.5L7 8l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Drawer content components ────────────────────────────────────────────────

function IncidentDrawerContent({ inc }: { inc: typeof INCIDENTS[0] }) {
  const sc = statusColor(inc.status)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DrawerField label="Incident ID" value={inc.id} mono />
        <DrawerField label="Status">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
            {inc.status}
          </span>
        </DrawerField>
        <DrawerField label="Address" value={inc.address} />
        <DrawerField label="Damage cost" value={inc.cost} mono />
        {inc.tag && <DrawerField label="Signature" value={inc.tag} mono />}
        {inc.match && <DrawerField label="AI match" value={`${inc.match}%`} mono />}
      </div>
      <div style={{ padding: 16, borderRadius: 'var(--r-lg)', background: 'var(--bg-sand)' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-4)', marginBottom: 8 }}>Evidence timeline</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          Incident reported via GraffCloud mobile app. Photo evidence sealed with GPS + timestamp. {inc.tag ? `Signature ${inc.tag} matched against Nordic cluster database with ${inc.match}% confidence.` : 'Awaiting AI signature analysis.'}
        </div>
      </div>
    </div>
  )
}

function PropertyDrawerContent({ prop }: { prop: typeof PROPERTIES[0] }) {
  const barColor = readinessColor(prop.color)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DrawerField label="Property" value={prop.name} />
        <DrawerField label="Damage cost, YTD" value={prop.cost} mono />
        <DrawerField label="Readiness score">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: barColor }}>{prop.readiness}%</span>
        </DrawerField>
        <DrawerField label="Owner" value="Obos Eiendom" />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-4)', marginBottom: 8 }}>Portfolio readiness</div>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${prop.readiness}%`, background: barColor, borderRadius: 999, transition: 'width .4s ease' }} />
        </div>
      </div>
      <div style={{ padding: 16, borderRadius: 'var(--r-lg)', background: 'var(--bg-sand)' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-4)', marginBottom: 8 }}>Recent activity</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          {prop.readiness < 50 ? 'Readiness below recommended threshold of 50%. Review pending incidents and evidence quality for this property.' : `Property is maintaining acceptable readiness. ${prop.readiness >= 80 ? 'All recent incidents documented with high-confidence AI matches.' : 'Some incidents pending AI analysis.'}`}
        </div>
      </div>
    </div>
  )
}

function BountyDrawerContent({ bounty }: { bounty: typeof BOUNTIES[0] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DrawerField label="Bounty ID" value={bounty.id} mono />
        <DrawerField label="Reward" value={bounty.reward} mono />
        <DrawerField label="Signature" value={bounty.sig} mono />
        <DrawerField label="Linked incidents" value={String(bounty.incidents)} mono />
        <DrawerField label="Zone" value={bounty.zone} />
        <DrawerField label="Posted" value={bounty.posted} />
      </div>
      <div style={{ padding: 16, borderRadius: 'var(--r-lg)', background: 'var(--bg-mint)' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-4)', marginBottom: 8 }}>How bounties work</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          Verified information leading to police identification of signature {bounty.sig} qualifies for the reward. Submit evidence through GraffCloud — rewards are processed within 30 days of confirmed prosecution referral.
        </div>
      </div>
    </div>
  )
}

function DrawerField({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-5)', marginBottom: 4 }}>{label}</div>
      {children ?? (
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value}</div>
      )}
    </div>
  )
}

// ─── Oslo Heatmap SVG ─────────────────────────────────────────────────────────

function OsloHeatmap() {
  return (
    <div style={{ background: '#111', borderRadius: 'var(--r-lg)', padding: 20, height: 260 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Oslo — incident heatmap</div>
      <svg viewBox="0 0 100 80" width="100%" height="100%" style={{ display: 'block' }}>
        {/* Street grid */}
        {[15, 30, 45, 60, 75].map(y => (
          <line key={`h${y}`} x1="5" y1={y} x2="95" y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
        ))}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => (
          <line key={`v${x}`} x1={x} y1="5" x2={x} y2="75" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
        ))}
        {/* Diagonal streets */}
        <line x1="5" y1="25" x2="55" y2="5" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="30" y1="75" x2="80" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="5" y1="55" x2="65" y2="10" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        {/* River */}
        <path d="M5 50 Q25 48 40 52 Q55 56 70 50 Q85 44 95 48" stroke="rgba(100,150,255,0.18)" strokeWidth="2" fill="none" />
        {/* Fjord */}
        <path d="M20 75 Q50 68 80 75" stroke="rgba(100,150,255,0.12)" strokeWidth="3" fill="none" />
        {/* Incident dots */}
        {HEATMAP_DOTS.map((dot, i) => (
          <g key={i}>
            <circle cx={dot.x} cy={dot.y} r="3.5" fill={dotColor(dot.status)} opacity="0.25" />
            <circle cx={dot.x} cy={dot.y} r="2" fill={dotColor(dot.status)} opacity="0.85" />
          </g>
        ))}
        {/* Legend */}
        <text x="5" y="78" fontSize="3.5" fill="rgba(255,255,255,0.3)" fontFamily="monospace">Oslo, NO</text>
      </svg>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

type DrawerContent =
  | { type: 'incident'; data: typeof INCIDENTS[0] }
  | { type: 'property'; data: typeof PROPERTIES[0] }
  | { type: 'bounty'; data: typeof BOUNTIES[0] }

export default function DashboardPage() {
  const { t } = useI18n()
  const [drawer, setDrawer] = useState<DrawerContent | null>(null)
  const [alertsRead, setAlertsRead] = useState(false)
  const activeNav = 0 // Portfolio

  function closeDrawer() { setDrawer(null) }

  function openIncident(inc: typeof INCIDENTS[0]) {
    setDrawer({ type: 'incident', data: inc })
  }
  function openProperty(prop: typeof PROPERTIES[0]) {
    setDrawer({ type: 'property', data: prop })
  }
  function openBounty(bounty: typeof BOUNTIES[0]) {
    setDrawer({ type: 'bounty', data: bounty })
  }

  const drawerTitle = drawer == null ? ''
    : drawer.type === 'incident' ? drawer.data.id
    : drawer.type === 'property' ? drawer.data.name
    : drawer.data.id

  const drawerSubtitle = drawer == null ? ''
    : drawer.type === 'incident' ? drawer.data.address
    : drawer.type === 'property' ? `${drawer.data.readiness}% readiness · ${drawer.data.cost}`
    : `${drawer.data.sig} · ${drawer.data.reward}`

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GCLogo size={28} color="var(--amber)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff', letterSpacing: '-0.01em' }}>GraffCloud</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon
            const isActive = i === activeNav
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  transition: 'background .15s, color .15s',
                  position: 'relative',
                }}
              >
                <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                  <Icon />
                </span>
                <span style={{ flex: 1 }}>{t(item.key)}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: i === 0 ? 'var(--red)' : 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: 999,
                    lineHeight: 1.4,
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>
              ML
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Marte Løken · Pro</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>NOK 5,900/mnd · Obos Eiendom</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(245,241,234,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--line)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {t('dash_greeting')}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-4)' }}>{t('dash_sub')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LangToggle />
            <button
              onClick={() => showToast('You have 14 new incidents and 3 unread alerts')}
              style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center' }}
              aria-label="Notifications"
            >
              <IconBell badge={14} />
            </button>
            <Link href="/upload" className="btn btn-primary" style={{ fontSize: 13, padding: '9px 18px', textDecoration: 'none' }}>
              + {t('new_incident')}
            </Link>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── KPI CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              {
                value: 'NOK 1.24M', label: t('dash_cost_ytd'),
                onClick: () => showToast('YTD breakdown: Thorvald Meyers 38% · Storgata 22% · Other 40%'),
              },
              {
                value: '147', label: t('dash_incidents_30'),
                onClick: () => showToast('147 incidents: 61 matched, 42 open, 28 new, 16 closed'),
              },
              {
                value: '74%', label: t('dash_readiness'),
                onClick: () => showToast('Portfolio readiness: 2 properties below 50% threshold'),
              },
              {
                value: '41', label: t('dash_open_bounties'),
                onClick: () => showToast('41 open bounties · NOK 312,500 total reward pool'),
              },
            ].map((kpi, i) => (
              <button
                key={i}
                onClick={kpi.onClick}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--r-lg)',
                  boxShadow: 'var(--shadow-1)',
                  padding: '20px 22px',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-1)' }}
              >
                <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>{kpi.value}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
              </button>
            ))}
          </div>

          {/* ── INCIDENTS TABLE ── */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t('dash_recent')}</h2>
              <button
                onClick={() => showToast('Exporting incidents to CSV…')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: '1px solid var(--line-2)', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}
              >
                <IconExport /> Export
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Incident', 'Address', 'Signature', 'Cost', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 22px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INCIDENTS.map((inc, i) => {
                  const sc = statusColor(inc.status)
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => openIncident(inc)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: i < INCIDENTS.length - 1 ? '1px solid var(--line)' : 'none',
                        transition: 'background .1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                      <td style={{ padding: '13px 22px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--ink)' }}>{inc.id}</td>
                      <td style={{ padding: '13px 22px', fontSize: 13, color: 'var(--ink-3)' }}>{inc.address}</td>
                      <td style={{ padding: '13px 22px', fontSize: 13 }}>
                        {inc.tag
                          ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--amber-ink)', background: 'var(--amber-wash)', padding: '3px 8px', borderRadius: 6 }}>{inc.tag}</span>
                          : <span style={{ color: 'var(--ink-5)' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 22px', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{inc.cost}</td>
                      <td style={{ padding: '13px 22px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', background: sc.bg, color: sc.color }}>
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── BOTTOM GRID: heatmap + properties ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>

            {/* Oslo Heatmap */}
            <OsloHeatmap />

            {/* Properties */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t('dash_properties')}</h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {PROPERTIES.map((prop, i) => {
                  const barColor = readinessColor(prop.color)
                  return (
                    <div
                      key={i}
                      onClick={() => openProperty(prop)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '12px 22px',
                        cursor: 'pointer',
                        transition: 'background .1s',
                        borderBottom: i < PROPERTIES.length - 1 ? '1px solid var(--line)' : 'none',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.name}</div>
                        <div style={{ height: 6, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${prop.readiness}%`, background: barColor, borderRadius: 999 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: barColor, fontFamily: 'var(--font-mono)' }}>{prop.readiness}%</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-5)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{prop.cost}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── ALERTS + BOUNTIES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Alerts */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t('dash_alerts')}</h2>
                <button
                  onClick={() => setAlertsRead(true)}
                  style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-4)', border: 0, background: 'transparent', cursor: 'pointer', padding: '4px 8px' }}
                >
                  Mark all read
                </button>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALERTS.map((alert, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: alertsRead ? 'transparent' : `${alert.color}08`,
                      border: `1px solid ${alertsRead ? 'var(--line)' : `${alert.color}22`}`,
                      opacity: alertsRead ? 0.45 : 1,
                      transition: 'opacity .3s, background .3s, border-color .3s',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: alert.dot, flexShrink: 0, marginTop: 3 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: alert.color, letterSpacing: '0.06em', marginBottom: 3 }}>{alert.level}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.4 }}>{alert.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Bounties */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Open Bounties</h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {BOUNTIES.map((bounty, i) => (
                  <div
                    key={bounty.id}
                    onClick={() => openBounty(bounty)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 22px',
                      cursor: 'pointer',
                      transition: 'background .1s',
                      borderBottom: i < BOUNTIES.length - 1 ? '1px solid var(--line)' : 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'var(--amber-wash)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--amber-ink)',
                    }}>
                      {bounty.sig}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{bounty.id}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>{bounty.incidents} incidents</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bounty.zone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{bounty.reward}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 2 }}>{bounty.posted}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── DRAWER ── */}
      <Drawer
        open={drawer !== null}
        onClose={closeDrawer}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        actions={
          drawer?.type === 'incident' ? (
            <>
              <button
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '9px 18px' }}
                onClick={() => { showToast('Police referral sent ✓', 'success'); closeDrawer() }}
              >
                Refer to police
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: '9px 18px' }}
                onClick={closeDrawer}
              >
                Close
              </button>
            </>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 13, padding: '9px 18px' }}
              onClick={closeDrawer}
            >
              Close
            </button>
          )
        }
      >
        {drawer?.type === 'incident' && <IncidentDrawerContent inc={drawer.data} />}
        {drawer?.type === 'property' && <PropertyDrawerContent prop={drawer.data} />}
        {drawer?.type === 'bounty' && <BountyDrawerContent bounty={drawer.data} />}
      </Drawer>

      <ToastContainer />
    </div>
  )
}
