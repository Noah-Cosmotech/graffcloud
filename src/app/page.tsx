'use client'

import Link from 'next/link'
import { useState } from 'react'
import { GCLogo } from '@/components/GCLogo'
import { LangToggle } from '@/components/LangToggle'

const tiles = [
  {
    num: '01',
    label: 'Marketing',
    title: 'Landing & pricing',
    desc: 'Public marketing site, feature overview, city coverage and plan selection.',
    href: '/landing',
    span: 12,
    bg: 'var(--bg-sand)',
    dark: false,
    hero: true,
  },
  {
    num: '02',
    label: 'Auth',
    title: 'Sign in',
    desc: 'BankID, Google SSO and email authentication flow.',
    href: '/login',
    span: 6,
    bg: 'var(--ink)',
    dark: true,
  },
  {
    num: '03',
    label: 'Owner',
    title: 'Portfolio dashboard',
    desc: 'Incident map, cost metrics, recent incidents and portfolio readiness.',
    href: '/dashboard',
    span: 6,
    bg: 'var(--bg-mist)',
    dark: false,
  },
  {
    num: '04',
    label: 'Intelligence',
    title: 'Movement Intelligence Globe',
    desc: 'Signature tracking across the Nordic graph. Real-time crew movement and timeline playback.',
    href: '/intelligence',
    span: 8,
    bg: 'var(--ink-2)',
    dark: true,
  },
  {
    num: '05',
    label: 'Reporting',
    title: 'Report incident',
    desc: 'Multi-step upload wizard with live AI match confidence.',
    href: '/upload',
    span: 4,
    bg: 'var(--amber-wash)',
    dark: false,
  },
  {
    num: '06',
    label: 'Marketplace',
    title: 'Bounty marketplace',
    desc: 'Post and claim bounties on active signatures. Crowd-sourced intelligence.',
    href: '/bounty',
    span: 4,
    bg: 'var(--bg)',
    dark: false,
  },
  {
    num: '07',
    label: 'Billing',
    title: 'Plans & billing',
    desc: 'Stripe-powered subscription management and invoice history.',
    href: '/billing',
    span: 4,
    bg: 'var(--surface)',
    dark: false,
  },
  {
    num: '08',
    label: 'Insurer',
    title: 'Insurer console',
    desc: 'Risk scores, predictive heatmaps and claim intelligence for Nordic insurers.',
    href: '/insurer',
    span: 4,
    bg: 'var(--bg-mist)',
    dark: false,
  },
]

function TileCard({ tile }: { tile: typeof tiles[number] }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={tile.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: `span ${tile.span}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: tile.hero ? '48px 56px' : '32px 36px',
        background: tile.bg,
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--line)',
        textDecoration: 'none',
        color: tile.dark ? '#fff' : 'var(--ink)',
        transition: 'transform .18s ease, box-shadow .18s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-pop)' : 'var(--shadow-1)',
        minHeight: tile.hero ? 220 : 180,
        cursor: 'pointer',
      }}
    >
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          opacity: tile.dark ? 0.55 : 0.5,
          marginBottom: 20,
        }}>
          {tile.num} · {tile.label}
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: tile.hero ? 36 : 22,
          fontWeight: 400,
          margin: '0 0 12px',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>
          {tile.title}
        </h3>
        <p style={{
          fontSize: 14,
          lineHeight: 1.55,
          opacity: tile.dark ? 0.7 : 0.65,
          margin: 0,
          maxWidth: tile.hero ? 560 : 320,
        }}>
          {tile.desc}
        </p>
      </div>
      <div style={{
        marginTop: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        opacity: tile.dark ? 0.85 : 0.7,
        letterSpacing: '0.02em',
      }}>
        Enter <span style={{ fontSize: 16 }}>→</span>
      </div>
    </Link>
  )
}

export default function HubPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '0 0 80px' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 48px',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GCLogo size={30} color="var(--ink)" />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
          }}>
            GraffCloud
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <LangToggle />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            letterSpacing: '0.08em',
          }}>
            v 0.9.4 · PROTOTYPE · OSLO
          </span>
        </div>
      </header>

      {/* Hero text */}
      <div style={{ padding: '64px 48px 48px', maxWidth: 1400 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: '0 0 20px',
          maxWidth: 820,
        }}>
          GraffCloud — the Nordic{' '}
          <em style={{ color: 'var(--amber-ink)', fontStyle: 'italic' }}>urban vandalism</em>
          {' '}intelligence platform.
        </h1>
        <p style={{
          fontSize: 17,
          color: 'var(--ink-3)',
          lineHeight: 1.6,
          maxWidth: 600,
          margin: 0,
        }}>
          Eight surfaces, one intelligence graph. Select a section to explore the prototype.
        </p>
      </div>

      {/* 12-column tile grid */}
      <div style={{
        padding: '0 48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 16,
        maxWidth: 1400,
      }}>
        {tiles.map(tile => (
          <TileCard key={tile.num} tile={tile} />
        ))}
      </div>
    </div>
  )
}
