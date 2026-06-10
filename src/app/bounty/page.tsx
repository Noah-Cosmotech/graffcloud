'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Drawer } from '@/components/Drawer'
import { showToast, ToastContainer } from '@/components/Toast'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/components/I18nProvider'

// ── types ─────────────────────────────────────────────────────────────────────
interface BountyCard {
  id: string
  code: string
  hot?: boolean
  closed?: boolean
  reward: number
  paid?: boolean
  city: string
  location: string
  incidents: number
  cities?: number
  since: string
  tags: string[]
  glyph: string
}

// ── SVG glyphs (abstract graffiti signatures) ─────────────────────────────────
const GLYPHS: Record<string, string> = {
  K4Z3: 'M10,40 L20,10 L30,35 L40,10 L50,40 M25,25 L35,25 M15,40 L45,40',
  'BRG-09': 'M15,10 Q30,5 35,20 Q40,35 25,38 Q10,40 12,25 Q14,10 15,10 M28,20 Q35,22 30,30',
  'TRD-22': 'M10,10 L50,10 M30,10 L30,40 M15,25 L45,25 M10,40 L50,40',
  'SVG-04': 'M15,35 Q15,10 30,10 Q45,10 45,25 Q45,40 30,38 M30,38 L30,45',
  'DRM-11': 'M10,10 L25,40 L40,10 M18,28 L32,28 M10,40 L40,40',
  'OSL-81': 'M20,10 Q45,10 45,25 Q45,40 20,40 L10,40 L10,10 Z M20,10 L20,40 M10,25 L20,25',
}

// ── data ──────────────────────────────────────────────────────────────────────
const BOUNTIES: BountyCard[] = [
  {
    id: '1', code: 'K4Z3', hot: true, reward: 25000, city: 'Oslo',
    location: 'Grünerløkka + Sentrum', incidents: 74, cities: 9,
    since: '14 MAR 2026', tags: ['multi-city', 'rail-hop', 'high-value'],
    glyph: GLYPHS['K4Z3'],
  },
  {
    id: '2', code: 'BRG-09', reward: 10000, city: 'Bergen',
    location: 'Bryggen', incidents: 12, since: '22 MAR 2026',
    tags: ['heritage', 'waterfront'], glyph: GLYPHS['BRG-09'],
  },
  {
    id: '3', code: 'TRD-22', reward: 8000, city: 'Trondheim',
    location: 'Midtbyen', incidents: 8, since: '01 APR 2026',
    tags: ['commercial', 'repeat'], glyph: GLYPHS['TRD-22'],
  },
  {
    id: '4', code: 'SVG-04', reward: 6500, city: 'Stavanger',
    location: 'Sentrum', incidents: 5, since: '05 APR 2026',
    tags: ['new', 'expanding'], glyph: GLYPHS['SVG-04'],
  },
  {
    id: '5', code: 'DRM-11', reward: 5000, city: 'Drammen',
    location: 'Strømsø', incidents: 7, since: '09 APR 2026',
    tags: ['residential'], glyph: GLYPHS['DRM-11'],
  },
  {
    id: '6', code: 'OSL-81', closed: true, paid: true, reward: 12000, city: 'Oslo',
    location: 'Oslo', incidents: 22, since: '09 APR 2026',
    tags: ['closed', 'paid'], glyph: GLYPHS['OSL-81'],
  },
]

const CITIES = ['All', 'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen']

// ── component ─────────────────────────────────────────────────────────────────
export default function BountyPage() {
  const { t } = useI18n()
  const [activeCity, setActiveCity] = useState('All')
  const [search, setSearch] = useState('')
  const [tipTarget, setTipTarget] = useState<BountyCard | null>(null)
  const [tipText, setTipText] = useState('')
  const [bankId, setBankId] = useState(false)

  const filtered = useMemo(() => {
    return BOUNTIES.filter(b => {
      const cityMatch = activeCity === 'All' || b.city === activeCity
      const q = search.toLowerCase()
      const searchMatch = !q || b.code.toLowerCase().includes(q) || b.location.toLowerCase().includes(q) || b.city.toLowerCase().includes(q)
      return cityMatch && searchMatch
    })
  }, [activeCity, search])

  const handleSubmitTip = () => {
    if (!tipText.trim()) { showToast('Please write a tip before submitting', 'error'); return }
    setTipTarget(null)
    setTipText('')
    setBankId(false)
    showToast('Tip submitted anonymously ✓', 'success')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <ToastContainer />

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--ink-4)', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-mono)' }}>← {t('back')}</Link>
        <div style={{ width: 1, height: 18, background: 'var(--line-2)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{t('bounty_title')}</div>
        <div style={{ flex: 1 }} />
        <LangToggle />
        <Link href="/upload" style={{ padding: '9px 18px', background: 'var(--ink)', color: '#fff', borderRadius: 99, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          {t('bounty_report')}
        </Link>
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--ink)', color: '#fff', padding: 'clamp(36px, 6vw, 56px) clamp(16px, 5vw, 40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 14 }}>
            COMMUNITY INTELLIGENCE PROGRAM
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 8vw, 52px)', lineHeight: 1.05, marginBottom: 20 }}>
            Help identify vandals.<br />Get rewarded.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 36, maxWidth: 520 }}>
            Property owners post bounties for identifying graffiti crews. Submit verified tips through BankID for anonymous, tamper-proof reporting.
          </div>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {[
              { value: '41', label: 'Open Bounties' },
              { value: 'NOK 284k', label: 'Total Pool' },
              { value: '18', label: 'Paid in 2026' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--brand-bright)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            {CITIES.map(city => (
              <button key={city} onClick={() => setActiveCity(city)} style={{
                padding: '7px 16px', borderRadius: 99, border: `1px solid ${activeCity === city ? 'var(--ink)' : 'var(--line-2)'}`,
                background: activeCity === city ? 'var(--ink)' : 'transparent',
                color: activeCity === city ? '#fff' : 'var(--ink-3)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'all 0.15s',
              }}>{city}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '1 1 160px', maxWidth: 260 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', fontSize: 14 }}>🔍</span>
            <input
              type="text" placeholder="Search code or location…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1px solid var(--line-2)', borderRadius: 10, fontSize: 13, color: 'var(--ink)', background: 'var(--bg)', fontFamily: 'var(--font-sans)', width: '100%', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ maxWidth: 940, margin: '40px auto', padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-4)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>No bounties found</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Try a different city or search term.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
            {filtered.map(b => (
              <BountyCardItem key={b.id} bounty={b} onSubmitTip={() => setTipTarget(b)} />
            ))}
          </div>
        )}
      </div>

      {/* Tip modal via Drawer */}
      <Drawer
        open={!!tipTarget}
        onClose={() => { setTipTarget(null); setTipText('') }}
        title={tipTarget ? `Submit Tip — ${tipTarget.code}` : 'Submit Tip'}
        subtitle={tipTarget ? `Bounty: NOK ${tipTarget.reward.toLocaleString('nb-NO')}` : undefined}
        actions={
          <button onClick={handleSubmitTip} style={{ padding: '13px 28px', background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 99, cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%' }}>
            Submit Anonymous Tip
          </button>
        }
      >
        {tipTarget && (
          <div>
            {/* Bounty summary */}
            <div style={{ padding: '14px 16px', background: 'rgba(148,0,20,0.05)', border: '1px solid rgba(148,0,20,0.18)', borderRadius: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--brand)' }}>{tipTarget.code}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-4)', marginTop: 4 }}>{tipTarget.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--brand)' }}>
                    NOK {tipTarget.reward.toLocaleString('nb-NO')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>reward</div>
                </div>
              </div>
            </div>

            {/* Tip textarea */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 8 }}>Your Tip</label>
              <textarea
                value={tipText} onChange={e => setTipText(e.target.value)}
                placeholder="Describe what you know — identity, location, social media handles, vehicle, etc. Be as specific as possible."
                rows={6}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line-2)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', resize: 'vertical', outline: 'none', background: 'var(--bg)', lineHeight: 1.6 }}
              />
              <div style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 8 }}>Your identity is never stored or linked to this tip.</div>
            </div>

            {/* BankID note */}
            <div style={{ padding: '14px 16px', background: 'rgba(10,10,10,0.04)', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>🔐</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>BankID Verification</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.5 }}>
                    To claim the reward, you'll verify your identity via BankID after investigators confirm the tip. Verification is only initiated upon successful identification — your tip is submitted anonymously.
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={bankId} onChange={e => setBankId(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--brand)' }} />
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>I understand the BankID verification process</span>
              </label>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

// ── BountyCard ─────────────────────────────────────────────────────────────────
function BountyCardItem({ bounty: b, onSubmitTip }: { bounty: BountyCard; onSubmitTip: () => void }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 18, padding: 22,
      boxShadow: 'var(--shadow-1)', border: `1px solid ${b.closed ? 'var(--line)' : 'var(--line)'}`,
      opacity: b.closed ? 0.75 : 1, display: 'flex', flexDirection: 'column', gap: 0,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { if (!b.closed) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-2)' } }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-1)' }}
    >
      {/* Header: code + badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: b.closed ? 'var(--ink-4)' : 'var(--ink)' }}>{b.code}</span>
            {b.hot && !b.closed && (
              <span style={{ padding: '3px 8px', background: 'rgba(255,60,0,0.12)', color: '#E85D04', borderRadius: 99, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>HOT</span>
            )}
            {b.closed && (
              <span style={{ padding: '3px 8px', background: 'rgba(10,10,10,0.08)', color: 'var(--ink-4)', borderRadius: 99, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>CLOSED</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>Since {b.since}</div>
        </div>

        {/* Glyph preview */}
        <svg width={52} height={52} viewBox="0 0 60 50" style={{ background: 'rgba(10,10,10,0.04)', borderRadius: 10, flexShrink: 0 }}>
          <path d={b.glyph} fill="none" stroke={b.closed ? '#aaa' : 'var(--brand)'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Reward */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: b.closed ? 'var(--ink-4)' : 'var(--brand)', lineHeight: 1 }}>
          NOK {b.reward.toLocaleString('nb-NO')}
          {b.paid && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--green)', marginLeft: 8 }}>PAID</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 4 }}>
          {b.closed ? 'Reward paid Apr 2026' : 'Reward for identification'}
        </div>
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>📍</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{b.city}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{b.location}</div>
        </div>
      </div>

      {/* Incident count */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '10px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{b.incidents}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-5)', marginTop: 2 }}>incidents</div>
        </div>
        {b.cities && (
          <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{b.cities}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-5)', marginTop: 2 }}>cities</div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {b.tags.map(tag => (
          <span key={tag} style={{ padding: '4px 10px', background: 'rgba(10,10,10,0.05)', borderRadius: 99, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      {b.closed ? (
        <div style={{ padding: '11px 16px', background: 'rgba(10,10,10,0.04)', borderRadius: 10, fontSize: 13, color: 'var(--ink-4)', textAlign: 'center', fontWeight: 500 }}>
          Bounty closed — reward paid
        </div>
      ) : (
        <button onClick={onSubmitTip} style={{
          padding: '12px 0', background: 'var(--ink)', color: '#fff', border: 0,
          borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          fontFamily: 'var(--font-sans)', width: '100%', transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#333')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--ink)')}
        >
          Submit Tip →
        </button>
      )}
    </div>
  )
}
