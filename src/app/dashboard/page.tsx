'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GCLogo } from '@/components/GCLogo'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/components/I18nProvider'
import { Drawer } from '@/components/Drawer'
import { showToast, ToastContainer } from '@/components/Toast'
import { createClient } from '@/lib/supabase/client'

const authConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

type Profile = {
  name: string
  email: string
  org: string | null
  initials: string
}

function getInitials(name: string, email: string) {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dash_portfolio' as const, icon: IconPortfolio, badge: 0, href: '/dashboard' },
  { key: 'dash_incidents' as const, icon: IconIncidents, badge: 14, href: '/dashboard' },
  { key: 'dash_intel' as const, icon: IconIntel, badge: 0, href: '/intelligence' },
  { key: 'dash_bounty' as const, icon: IconBounty, badge: 41, href: '/bounty' },
  { key: 'dash_billing' as const, icon: IconBilling, badge: 0, href: '/billing' },
  { key: 'dash_settings' as const, icon: IconSettings, badge: 0, href: '/dashboard' },
]

const DEMO_INCIDENTS = [
  { id: 'INC-04182', address: 'Thorvald Meyers gate 42', tag: 'K4Z3', cost: 'NOK 18,400', status: 'MATCHED', match: 94, lat: 59.923, lng: 10.757 },
  { id: 'INC-04177', address: 'Markveien 18', tag: null, cost: 'NOK 4,200', status: 'NEW', match: null, lat: 59.921, lng: 10.754 },
  { id: 'INC-04169', address: 'Storgata 36', tag: 'K4Z3', cost: 'NOK 9,800', status: 'OPEN', match: 71, lat: 59.913, lng: 10.748 },
  { id: 'INC-04158', address: 'Grensen 17', tag: 'BRG-09', cost: 'NOK 12,100', status: 'MATCHED', match: 88, lat: 59.912, lng: 10.742 },
  { id: 'INC-04144', address: 'Torvgata 2', tag: null, cost: 'NOK 3,400', status: 'NEW', match: null, lat: 59.910, lng: 10.746 },
  { id: 'INC-04132', address: 'Pilestredet 75', tag: null, cost: 'NOK 2,900', status: 'OPEN', match: null, lat: 59.921, lng: 10.730 },
  { id: 'INC-04101', address: 'Møllergata 6', tag: 'SVG-04', cost: 'NOK 6,700', status: 'CLOSED', match: 81, lat: 59.915, lng: 10.749 },
]

const DEMO_PROPERTIES = [
  { name: 'Thorvald Meyers gate 42', readiness: 91, cost: 'NOK 184k', color: 'red' },
  { name: 'Storgata 36', readiness: 74, cost: 'NOK 92k', color: 'amber' },
  { name: 'Markveien 18', readiness: 68, cost: 'NOK 68k', color: 'amber' },
  { name: 'Grünerløkka Borettslag', readiness: 45, cost: 'NOK 34k', color: 'green' },
  { name: 'Pilestredet 75', readiness: 32, cost: 'NOK 28k', color: 'green' },
]

const DEMO_ALERTS = [
  { level: 'CRITICAL', color: '#EF4444', dot: '#EF4444', text: 'K4Z3 confirmed match — Thorvald Meyers gate 42' },
  { level: 'WARNING', color: '#F59E0B', dot: '#F59E0B', text: 'Readiness below threshold: Pilestredet 75 (32%)' },
  { level: 'INFO', color: '#3B82F6', dot: '#3B82F6', text: 'New bounty posted: BRG-09 — NOK 10,000' },
]

const DEMO_BOUNTIES = [
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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour <= 11) return 'Good morning'
  if (hour >= 12 && hour <= 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Display model types (shared by demo and live data) ───────────────────────

type DisplayIncident = {
  id: string; address: string; tag: string | null; cost: string
  status: string; match: number | null; lat: number; lng: number
}
type DisplayProperty = { name: string; readiness: number; cost: string; color: string }
type DisplayAlert    = { level: string; color: string; dot: string; text: string }
type DisplayBounty   = { id: string; sig: string; reward: string; incidents: number; zone: string; posted: string; status: string }

// ─── Supabase SELECT row types ────────────────────────────────────────────────

type PropRow = { id: string; name: string; address: string; city: string; readiness_score: number }
type IncRow = {
  id: string; property_id: string; date: string
  cost_nok: number | null; status: string
  signature_id: string | null; ai_match_confidence: number | null
  gps_lat: number | null; gps_lng: number | null
}
type BountyRow = {
  id: string; signature_id: string | null; amount_nok: number
  status: string; city: string | null; created_at: string; tips_count: number | null
}

// ─── Live-data helpers ────────────────────────────────────────────────────────

function formatNok(amount: number): string {
  if (amount === 0) return 'NOK 0'
  return 'NOK ' + Math.round(amount).toLocaleString('no-NO')
}

function formatNokK(amount: number): string {
  if (amount === 0) return 'NOK 0'
  return amount >= 1000 ? `NOK ${Math.round(amount / 1000)}k` : formatNok(amount)
}

function scoreToColorKey(score: number): string {
  if (score >= 75) return 'red'
  if (score >= 50) return 'amber'
  return 'green'
}

function incidentDisplayId(uuid: string): string {
  return 'INC-' + uuid.split('-')[0].toUpperCase()
}

// GPS → SVG coordinate for Oslo heatmap (viewBox 0 0 100 80)
function gpsToHeatDot(lat: number, lng: number, status: string) {
  return {
    x: Math.max(5, Math.min(95, ((lng - 10.60) / 0.25) * 90 + 5)),
    y: Math.max(5, Math.min(75, ((59.98 - lat) / 0.13) * 70 + 5)),
    status,
  }
}

function exportIncidentsCsv(incidents: DisplayIncident[]) {
  const header = 'ID,Property,Date,Signature,Status,Cost(NOK)'
  const rows = incidents.map(inc => {
    const costNok = inc.cost.replace('NOK ', '').replace(/,/g, '')
    const date = new Date().toLocaleDateString('no-NO')
    const sig = inc.tag ?? ''
    return [inc.id, `"${inc.address}"`, date, sig, inc.status, costNok].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `graffcloud-incidents-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function openPoliceReferral(inc: DisplayIncident) {
  const w = window.open('', '_blank', 'width=820,height=700')
  if (!w) return
  const now = new Date()
  const timestamp = now.toLocaleString('no-NO', { dateStyle: 'long', timeStyle: 'medium' })
  const coords = (inc.lat && inc.lng) ? `${inc.lat}° N, ${inc.lng}° E` : 'Not recorded'
  w.document.write(`
    <html><head><title>Police Referral — ${inc.id} — GraffCloud</title><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Georgia', serif; background: #fff; color: #111; padding: 56px 64px; max-width: 760px; margin: 0 auto; }
      .letterhead { display: flex; align-items: center; gap: 18px; padding-bottom: 24px; border-bottom: 3px solid #111; margin-bottom: 32px; }
      .logo-mark { width: 42px; height: 42px; background: #111; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #FFA500; font-size: 22px; font-weight: 900; font-family: monospace; flex-shrink: 0; }
      .org { font-family: monospace; }
      .org-name { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
      .org-sub { font-size: 12px; color: #666; margin-top: 2px; }
      .doc-title { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
      .doc-ref { font-size: 13px; color: #555; font-family: monospace; margin-bottom: 32px; }
      .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-bottom: 10px; margin-top: 28px; }
      .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 32px; }
      .field { margin-bottom: 2px; }
      .field-key { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #888; margin-bottom: 3px; }
      .field-val { font-size: 15px; font-weight: 500; font-family: monospace; }
      .summary-box { margin-top: 28px; padding: 20px 24px; border: 1px solid #ddd; border-left: 4px solid #111; background: #fafafa; }
      .summary-text { font-size: 14px; line-height: 1.7; color: #333; }
      .footer { margin-top: 52px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; align-items: flex-end; }
      .footer-left { font-size: 12px; color: #777; line-height: 1.6; }
      .footer-brand { font-family: monospace; font-size: 13px; font-weight: 700; color: #111; }
      @media print { body { padding: 32px; } }
    </style></head><body>
      <div class="letterhead">
        <div class="logo-mark">GC</div>
        <div class="org">
          <div class="org-name">GraffCloud</div>
          <div class="org-sub">Digital Evidence Platform · graffcloud.no</div>
        </div>
      </div>

      <div class="doc-title">Police Referral</div>
      <div class="doc-ref">Ref: ${inc.id} · Generated ${timestamp}</div>

      <div class="section-label">Incident Details</div>
      <div class="field-grid">
        <div class="field"><div class="field-key">Incident ID</div><div class="field-val">${inc.id}</div></div>
        <div class="field"><div class="field-key">Status</div><div class="field-val">${inc.status}</div></div>
        <div class="field"><div class="field-key">Property / Address</div><div class="field-val">${inc.address}</div></div>
        <div class="field"><div class="field-key">Damage Cost</div><div class="field-val">${inc.cost}</div></div>
        <div class="field"><div class="field-key">Graffiti Signature</div><div class="field-val">${inc.tag ?? 'Not identified'}</div></div>
        <div class="field"><div class="field-key">AI Match Confidence</div><div class="field-val">${inc.match ? inc.match + '%' : 'Pending analysis'}</div></div>
        <div class="field"><div class="field-key">GPS Coordinates</div><div class="field-val">${coords}</div></div>
        <div class="field"><div class="field-key">Reported Date</div><div class="field-val">${now.toLocaleDateString('no-NO')}</div></div>
      </div>

      <div class="section-label">Case Summary</div>
      <div class="summary-box">
        <div class="summary-text">
          This referral concerns incident ${inc.id} at ${inc.address}, with estimated damage of ${inc.cost}.
          ${inc.tag ? `The graffiti signature <strong>${inc.tag}</strong> has been identified with ${inc.match}% AI confidence against the Nordic cluster database, indicating a known perpetrator active in the Oslo metropolitan area.` : 'The graffiti signature is currently awaiting AI analysis against the Nordic cluster database.'}
          Photo evidence has been sealed with GPS metadata and timestamp via the GraffCloud mobile platform, ensuring chain-of-custody integrity.
          All digital evidence is available for law enforcement review upon request.
        </div>
      </div>

      <div class="footer">
        <div class="footer-left">
          <div class="footer-brand">GraffCloud</div>
          Submitted via GraffCloud digital evidence platform<br>
          ${timestamp}<br>
          This document was generated automatically from verified incident data.
        </div>
        <div style="font-family:monospace;font-size:11px;color:#aaa;text-align:right">
          graffcloud.no<br>
          evidence@graffcloud.no
        </div>
      </div>
    </body></html>
  `)
  w.document.close()
}

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

function IncidentDrawerContent({ inc }: { inc: DisplayIncident }) {
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

function PropertyDrawerContent({ prop }: { prop: DisplayProperty }) {
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

function BountyDrawerContent({ bounty }: { bounty: DisplayBounty }) {
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

function OsloHeatmap({ dots }: { dots: typeof HEATMAP_DOTS }) {
  return (
    <div style={{ background: '#111', borderRadius: 'var(--r-lg)', padding: 20, height: 260, position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Oslo — incident heatmap</div>
      {dots.length === 0 && (
        <div style={{
          position: 'absolute', inset: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', padding: '0 20px',
        }}>
          Heatmap appears once you've reported incidents.
        </div>
      )}
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
        {dots.map((dot, i) => (
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
  | { type: 'incident'; data: DisplayIncident }
  | { type: 'property'; data: DisplayProperty }
  | { type: 'bounty'; data: DisplayBounty }

export default function DashboardPage() {
  const { t } = useI18n()
  const [drawer, setDrawer] = useState<DrawerContent | null>(null)
  const [alertsRead, setAlertsRead] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showDemo, setShowDemo] = useState(false)
  const activeNav = 0 // Portfolio

  useEffect(() => {
    if (!authConfigured) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const meta = (user.user_metadata ?? {}) as { name?: string; org?: string }
        const email = user.email ?? ''
        const name = meta.name?.trim() || email.split('@')[0] || 'You'
        setProfile({
          name,
          email,
          org: meta.org?.trim() || null,
          initials: getInitials(meta.name ?? '', email),
        })
      } catch {
        /* ignore — display falls back to email-less placeholder */
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('gc_show_demo')
    if (stored === '1') setShowDemo(true)
  }, [])

  // ── Live data state ──
  const [liveIncidents, setLiveIncidents] = useState<DisplayIncident[]>([])
  const [liveProperties, setLiveProperties] = useState<DisplayProperty[]>([])
  const [liveBounties, setLiveBounties] = useState<DisplayBounty[]>([])
  const [liveAlerts, setLiveAlerts] = useState<DisplayAlert[]>([])

  // ── Fetch from Supabase (runs once after mount) ──
  useEffect(() => {
    if (!authConfigured) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()

        const [propRes, incRes, bountyRes] = await Promise.all([
          supabase.from('properties').select('id,name,address,city,readiness_score').order('created_at', { ascending: false }),
          supabase.from('incidents').select('id,property_id,date,cost_nok,status,signature_id,ai_match_confidence,gps_lat,gps_lng').order('created_at', { ascending: false }).limit(100),
          supabase.from('bounties').select('id,signature_id,amount_nok,status,city,created_at,tips_count').eq('status', 'open').order('created_at', { ascending: false }).limit(20),
        ])

        if (cancelled) return

        const props = ((propRes.data ?? []) as unknown) as PropRow[]
        const incs  = ((incRes.data  ?? []) as unknown) as IncRow[]
        const bountiesRaw = ((bountyRes.data ?? []) as unknown) as BountyRow[]

        const propMap = new Map(props.map(p => [p.id, p]))

        // Per-property cost total
        const propCostMap = new Map<string, number>()
        for (const inc of incs) {
          propCostMap.set(inc.property_id, (propCostMap.get(inc.property_id) ?? 0) + (inc.cost_nok ?? 0))
        }

        const mappedIncs: DisplayIncident[] = incs.map(inc => ({
          id: incidentDisplayId(inc.id),
          address: propMap.get(inc.property_id)?.address ?? '—',
          tag: inc.signature_id ?? null,
          cost: formatNok(inc.cost_nok ?? 0),
          status: (inc.status ?? 'new').toUpperCase(),
          match: inc.ai_match_confidence ?? null,
          lat: inc.gps_lat ?? 0,
          lng: inc.gps_lng ?? 0,
        }))

        const mappedProps: DisplayProperty[] = props.map(p => ({
          name: p.name,
          readiness: p.readiness_score,
          cost: formatNokK(propCostMap.get(p.id) ?? 0),
          color: scoreToColorKey(p.readiness_score),
        }))

        const mappedBounties: DisplayBounty[] = bountiesRaw.map(b => ({
          id: 'BNT-' + b.id.split('-')[0].toUpperCase(),
          sig: b.signature_id ?? '—',
          reward: formatNok(b.amount_nok),
          incidents: b.tips_count ?? 0,
          zone: b.city ?? '—',
          posted: new Date(b.created_at).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: (b.status ?? 'open').toUpperCase(),
        }))

        // Derive alerts from live data
        const derivedAlerts: DisplayAlert[] = []
        const matched = mappedIncs.filter(i => i.status === 'MATCHED')
        if (matched.length > 0) {
          derivedAlerts.push({ level: 'CRITICAL', color: '#EF4444', dot: '#EF4444', text: `${matched[0].tag ?? 'Signature'} confirmed match — ${matched[0].address}` })
        }
        const lowReadiness = mappedProps.filter(p => p.readiness < 50)
        if (lowReadiness.length > 0) {
          derivedAlerts.push({ level: 'WARNING', color: '#F59E0B', dot: '#F59E0B', text: `Readiness below threshold: ${lowReadiness[0].name} (${lowReadiness[0].readiness}%)` })
        }
        if (mappedBounties.length > 0) {
          derivedAlerts.push({ level: 'INFO', color: '#3B82F6', dot: '#3B82F6', text: `${mappedBounties.length} open ${mappedBounties.length === 1 ? 'bounty' : 'bounties'} — ${mappedBounties[0].reward}` })
        }

        setLiveIncidents(mappedIncs)
        setLiveProperties(mappedProps)
        setLiveBounties(mappedBounties)
        setLiveAlerts(derivedAlerts)
      } catch {
        /* fail silently — empty state remains */
      }
    })()
    return () => { cancelled = true }
  }, [])

  function toggleDemo() {
    setShowDemo(prev => {
      const next = !prev
      localStorage.setItem('gc_show_demo', next ? '1' : '0')
      return next
    })
  }

  // ── Derived display arrays ──
  const incidents = showDemo ? DEMO_INCIDENTS : liveIncidents
  const properties = showDemo ? DEMO_PROPERTIES : liveProperties
  const alerts = showDemo ? DEMO_ALERTS : liveAlerts
  const bounties = showDemo ? DEMO_BOUNTIES : liveBounties

  const liveHeatDots = liveIncidents
    .filter(i => i.lat !== 0 && i.lng !== 0)
    .map(i => gpsToHeatDot(i.lat, i.lng, i.status))
  const heatmapDots = showDemo ? HEATMAP_DOTS : liveHeatDots

  // ── Live KPIs ──
  const liveTotalCost = liveIncidents.reduce((s, i) => s + (parseInt(i.cost.replace(/[^\d]/g, ''), 10) || 0), 0)
  const liveIncCount  = liveIncidents.length
  const liveAvgRead   = liveProperties.length > 0
    ? Math.round(liveProperties.reduce((s, p) => s + p.readiness, 0) / liveProperties.length)
    : null
  const liveOpenBounties = liveBounties.length

  function closeDrawer() { setDrawer(null) }

  function openIncident(inc: DisplayIncident) {
    setDrawer({ type: 'incident', data: inc })
  }
  function openProperty(prop: DisplayProperty) {
    setDrawer({ type: 'property', data: prop })
  }
  function openBounty(bounty: DisplayBounty) {
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
    <div className="gc-dash">

      {/* ── SIDEBAR ── */}
      <aside className="gc-sidebar-panel">
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
            const badge = showDemo ? item.badge : 0
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
                {badge > 0 && (
                  <span style={{
                    background: i === 0 ? 'var(--red)' : 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: 999,
                    lineHeight: 1.4,
                  }}>
                    {badge}
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
              {profile?.initials ?? '··'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.name ?? (authConfigured ? 'Loading…' : 'Pilot user')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.org ?? profile?.email ?? 'Sign in to load profile'}
              </div>
            </div>
            {profile && (
              <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 6,
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.45)',
                    borderRadius: 6,
                    display: 'flex',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 11.5l3.5-3.5L10 4.5M13 8H6M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>

      {/* ── MOBILE NAV BAR (hidden on desktop) ── */}
      <div className="gc-mob-nav-bar">
        <div className="gc-mob-nav-inner">
          <Link href="/dashboard" className="mob-active">📁 Portfolio</Link>
          <Link href="/intelligence">🌐 Intel</Link>
          <Link href="/bounty">🎯 Bounty</Link>
          <Link href="/billing">💳 Billing</Link>
          <Link href="/upload">📷 Upload</Link>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="gc-main-panel">

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
              {getGreeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-4)' }}>{t('dash_sub')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={toggleDemo}
              title={showDemo ? 'Hide sample portfolio' : 'Show sample portfolio'}
              style={{
                fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                textTransform: 'uppercase', padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid var(--line-2)',
                background: showDemo ? 'var(--amber-wash)' : 'transparent',
                color: showDemo ? 'var(--amber-ink)' : 'var(--ink-4)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: showDemo ? 'var(--amber-ink)' : 'var(--ink-5)' }} />
              {showDemo ? 'Demo on' : 'Demo off'}
            </button>
            <LangToggle />
            <button
              onClick={() => showToast(showDemo ? 'You have 14 new incidents and 3 unread alerts' : 'No new notifications')}
              style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center' }}
              aria-label="Notifications"
            >
              <IconBell badge={showDemo ? 14 : 0} />
            </button>
            <Link href="/upload" className="btn btn-primary" style={{ fontSize: 13, padding: '9px 18px', textDecoration: 'none' }}>
              + {t('new_incident')}
            </Link>
          </div>
        </div>

        <div className="gc-dash-inner">

          {/* ── KPI CARDS ── */}
          <div className="r-grid-4" style={{ gap: 14 }}>
            {(showDemo
              ? [
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
                ]
              : [
                  {
                    value: liveTotalCost > 0 ? formatNokK(liveTotalCost) : 'NOK 0',
                    label: t('dash_cost_ytd'),
                    onClick: () => showToast(liveTotalCost > 0 ? `Total across ${liveIncCount} incident${liveIncCount !== 1 ? 's' : ''}` : 'No incidents reported yet'),
                  },
                  {
                    value: String(liveIncCount),
                    label: t('dash_incidents_30'),
                    onClick: () => showToast(liveIncCount > 0 ? `${liveIncCount} incident${liveIncCount !== 1 ? 's' : ''} in your portfolio` : 'No incidents reported yet'),
                  },
                  {
                    value: liveAvgRead !== null ? `${liveAvgRead}%` : '—',
                    label: t('dash_readiness'),
                    onClick: () => showToast(liveProperties.length > 0 ? `Average across ${liveProperties.length} propert${liveProperties.length !== 1 ? 'ies' : 'y'}` : 'Add a property to track readiness'),
                  },
                  {
                    value: String(liveOpenBounties),
                    label: t('dash_open_bounties'),
                    onClick: () => showToast(liveOpenBounties > 0 ? `${liveOpenBounties} open ${liveOpenBounties === 1 ? 'bounty' : 'bounties'}` : 'No bounties posted yet'),
                  },
                ]
            ).map((kpi, i) => (
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
                onClick={() => exportIncidentsCsv(incidents)}
                disabled={incidents.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: '1px solid var(--line-2)', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}
              >
                <IconExport /> Export
              </button>
            </div>
            <div className="r-scroll-x">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Incident', 'Address', 'Signature', 'Cost', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 22px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
                      No incidents reported yet.{' '}
                      <Link href="/upload" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Upload your first photo →</Link>
                    </td>
                  </tr>
                )}
                {incidents.map((inc, i) => {
                  const sc = statusColor(inc.status)
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => openIncident(inc)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: i < incidents.length - 1 ? '1px solid var(--line)' : 'none',
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
          </div>

          {/* ── BOTTOM GRID: heatmap + properties ── */}
          <div className="r-grid-2" style={{ gap: 14 }}>

            {/* Oslo Heatmap */}
            <OsloHeatmap dots={heatmapDots} />

            {/* Properties */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t('dash_properties')}</h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {properties.length === 0 && (
                  <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
                    No properties added yet.
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-5)' }}>
                      Properties appear here once you upload incidents tied to an address.
                    </div>
                  </div>
                )}
                {properties.map((prop, i) => {
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
                        borderBottom: i < properties.length - 1 ? '1px solid var(--line)' : 'none',
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
          <div className="r-grid-2" style={{ gap: 14 }}>

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
                {alerts.length === 0 && (
                  <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
                    No active alerts.
                  </div>
                )}
                {alerts.map((alert, i) => (
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
                {bounties.length === 0 && (
                  <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
                    No open bounties.{' '}
                    <Link href="/bounty" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Post one →</Link>
                  </div>
                )}
                {bounties.map((bounty, i) => (
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
                      borderBottom: i < bounties.length - 1 ? '1px solid var(--line)' : 'none',
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
                onClick={() => { openPoliceReferral(drawer!.data as DisplayIncident); closeDrawer() }}

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
