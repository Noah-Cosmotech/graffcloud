'use client'

import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { useI18n } from '@/components/I18nProvider'

/* ─── Globe SVG ─────────────────────────────────────────────────── */
function HeroGlobe() {
  // Orthographic projection: lat0=52°N, lon0=8°E, R=280, SVG center=(220,175)
  // Cities follow the K4Z3 trail: Oslo→Bergen→Trondheim→Göteborg→Copenhagen→Hamburg→Amsterdam→Barcelona
  return (
    <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Globe sphere */}
      <circle cx="200" cy="180" r="148" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <circle cx="200" cy="180" r="108" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <ellipse cx="200" cy="180" rx="148" ry="49" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <ellipse cx="200" cy="180" rx="148" ry="95" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <path d="M200 32 Q246 180 200 328" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
      <path d="M200 32 Q154 180 200 328" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
      <path d="M200 32 Q290 180 200 328" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
      <path d="M200 32 Q110 180 200 328" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />

      {/* Trail arcs — K4Z3 route (Oslo→Bergen→Trondheim→Göteborg→Copenhagen→Hamburg→Amsterdam→Barcelona) */}
      {/* Oslo→Bergen */}
      <path d="M227 137 Q226 124 214 134" stroke="rgba(251,191,36,0.55)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      {/* Bergen→Trondheim */}
      <path d="M214 134 Q224 113 225 119" stroke="rgba(251,191,36,0.5)" strokeWidth="1.4" fill="none" strokeDasharray="4 3" />
      {/* Trondheim→Göteborg */}
      <path d="M225 119 Q236 121 231 147" stroke="rgba(251,191,36,0.45)" strokeWidth="1.3" fill="none" strokeDasharray="4 3" />
      {/* Göteborg→Copenhagen */}
      <path d="M231 147 Q241 145 233 157" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2" fill="none" strokeDasharray="4 3" />
      {/* Copenhagen→Hamburg */}
      <path d="M233 157 Q238 158 226 168" stroke="rgba(251,191,36,0.35)" strokeWidth="1.1" fill="none" strokeDasharray="4 3" />
      {/* Hamburg→Amsterdam */}
      <path d="M226 168 Q224 168 211 172" stroke="rgba(251,191,36,0.3)" strokeWidth="1" fill="none" strokeDasharray="4 3" />
      {/* Amsterdam→Barcelona */}
      <path d="M211 172 Q206 204 199 226" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />

      {/* Secondary node: Reykjavík */}
      <circle cx="159" cy="103" r="2.5" fill="rgba(255,255,255,0.25)" />
      <text x="113" y="101" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">Reykjavík</text>

      {/* Trondheim — northernmost primary */}
      <circle cx="225" cy="119" r="4" fill="oklch(0.76 0.15 65)" opacity="0.85" />
      <circle cx="225" cy="119" r="8" fill="oklch(0.76 0.15 65)" opacity="0.15" />
      <text x="230" y="116" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="monospace">Trondheim</text>

      {/* Bergen */}
      <circle cx="214" cy="134" r="3.5" fill="oklch(0.76 0.15 65)" />
      <circle cx="214" cy="134" r="8" fill="oklch(0.76 0.15 65)" opacity="0.15" />
      <text x="172" y="131" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="monospace">Bergen</text>

      {/* Oslo — primary hub */}
      <circle cx="227" cy="137" r="6" fill="oklch(0.76 0.15 65)" />
      <circle cx="227" cy="137" r="13" fill="oklch(0.76 0.15 65)" opacity="0.2" />
      <circle cx="227" cy="137" r="20" fill="oklch(0.76 0.15 65)" opacity="0.07" />
      <text x="237" y="133" fill="white" fontSize="11" fontFamily="monospace" fontWeight="600">Oslo</text>

      {/* Göteborg */}
      <circle cx="231" cy="147" r="3" fill="oklch(0.76 0.15 65)" opacity="0.7" />
      <text x="237" y="144" fill="rgba(255,255,255,0.55)" fontSize="9" fontFamily="monospace">Göteborg</text>

      {/* Copenhagen */}
      <circle cx="233" cy="157" r="3.5" fill="oklch(0.76 0.15 65)" opacity="0.75" />
      <circle cx="233" cy="157" r="8" fill="oklch(0.76 0.15 65)" opacity="0.12" />
      <text x="239" y="154" fill="rgba(255,255,255,0.65)" fontSize="9" fontFamily="monospace">Copenhagen</text>

      {/* Hamburg */}
      <circle cx="226" cy="168" r="3" fill="rgba(255,255,255,0.45)" />
      <text x="231" y="165" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="monospace">Hamburg</text>

      {/* Amsterdam */}
      <circle cx="211" cy="172" r="3" fill="rgba(255,255,255,0.4)" />
      <text x="165" y="169" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">Amsterdam</text>

      {/* Barcelona — southern terminus */}
      <circle cx="199" cy="226" r="5" fill="oklch(0.76 0.15 65)" opacity="0.9" />
      <circle cx="199" cy="226" r="11" fill="oklch(0.76 0.15 65)" opacity="0.18" />
      <text x="207" y="222" fill="rgba(255,255,255,0.8)" fontSize="10" fontFamily="monospace">Barcelona</text>
    </svg>
  )
}

/* ─── Risk score chart SVG ──────────────────────────────────────── */
function RiskChart() {
  const points = [
    [0, 70], [40, 65], [80, 72], [120, 58], [160, 50], [200, 55],
    [240, 42], [280, 38], [320, 32], [360, 28],
  ]
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const areaD = pathD + ' L360,100 L0,100 Z'

  return (
    <svg viewBox="0 0 360 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 100 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.76 0.15 65)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="oklch(0.76 0.15 65)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} stroke="oklch(0.76 0.15 65)" strokeWidth="2" fill="none" strokeLinejoin="round" />
      {points.map(([x, y], i) => i % 2 === 0 && (
        <circle key={i} cx={x} cy={y} r="3" fill="oklch(0.76 0.15 65)" />
      ))}
      {/* X axis labels */}
      <text x="0" y="98" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace">Jan</text>
      <text x="80" y="98" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace">Mar</text>
      <text x="160" y="98" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace">May</text>
      <text x="240" y="98" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace">Jul</text>
      <text x="320" y="98" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace">Sep</text>
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
          fill="oklch(0.76 0.15 65)"
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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
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
              <em style={{ color: 'var(--amber-ink)', fontStyle: 'italic' }}>
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

          {/* Right column — dark globe card */}
          <div className="gc-hero-right" style={{
            background: 'var(--ink)',
            borderRadius: 'var(--r-xl)',
            padding: 32,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 380,
          }}>
            <HeroGlobe />

            {/* Floating stat chips */}
            <div style={{
              position: 'absolute',
              top: 28,
              right: 28,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--r-md)',
              padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 4 }}>
                ACTIVE NOW
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: '#fff', fontWeight: 600 }}>
                41,842
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>incidents indexed</div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 28,
              left: 28,
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'oklch(0.72 0.11 150)',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(116,200,146,0.25)',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                K4Z3 · 9 cities · live
              </span>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 28,
              right: 28,
              background: 'oklch(0.76 0.15 65)',
              borderRadius: 'var(--r-md)',
              padding: '8px 14px',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#1a1000' }}>
                92% match
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS BAR ──────────────────────────────────────────── */}
      <section className="gc-metrics-bar" style={{ background: 'var(--ink)', padding: '40px clamp(16px,5vw,40px)' }}>
        <div className="r-grid-4" style={{ maxWidth: 1280, margin: '0 auto', gap: 0 }}>
          {[
            { num: '41,842', label: t('metric_incidents') },
            { num: '9+', label: t('metric_cities') },
            { num: '67%', label: t('metric_recovery') },
            { num: '3.1×', label: t('metric_clearance') },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '8px 32px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 42,
                color: 'oklch(0.76 0.15 65)',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {m.num}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                {m.label}
              </div>
            </div>
          ))}
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
                  background: 'linear-gradient(90deg, oklch(0.76 0.15 65) 0%, oklch(0.76 0.15 65) 100%)',
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
                    border: '2px solid oklch(0.76 0.15 65)',
                    borderRadius: 'var(--r-pill)',
                    padding: '4px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--amber-ink)',
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
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'oklch(0.76 0.15 65)', marginBottom: 6 }}>
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
                  color: 'var(--amber-ink)',
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
                    background: 'oklch(0.76 0.15 65)',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--amber-ink)', letterSpacing: '0.1em', fontWeight: 600 }}>
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
                RISK SCORE · PORTFOLIO AGGREGATE
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'oklch(0.76 0.15 65)' }}>
                  −22%
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  claim cost density, Oslo pilots
                </div>
              </div>
            </div>
            <RiskChart />
            <div style={{ marginTop: 20, display: 'flex', gap: 16 }}>
              {[
                { label: 'High risk assets', val: '14' },
                { label: 'Avg risk score', val: '3.2' },
                { label: 'Claims prevented', val: '82' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#fff', marginBottom: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
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
                background: 'oklch(0.76 0.15 65)',
                color: '#1a0f00',
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
                    <span style={{ color: 'oklch(0.76 0.15 65)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login?mode=signup&plan=professional" className="btn btn-primary" style={{
                width: '100%',
                justifyContent: 'center',
                background: 'oklch(0.76 0.15 65)',
                color: '#1a0f00',
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
