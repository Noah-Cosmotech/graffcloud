'use client'

import Link from 'next/link'
import { useState } from 'react'
import { GCLogo } from '@/components/GCLogo'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/components/I18nProvider'

const tiles = [
  { num: '01', key: 'hub_t1', href: '/landing', span: 12, bg: 'var(--bg-sand)', dark: false, hero: true },
  { num: '02', key: 'hub_t2', href: '/login', span: 6, bg: 'var(--ink)', dark: true },
  { num: '03', key: 'hub_t3', href: '/dashboard', span: 6, bg: 'var(--bg-mist)', dark: false },
  { num: '04', key: 'hub_t4', href: '/intelligence', span: 8, bg: 'var(--ink-2)', dark: true },
  { num: '05', key: 'hub_t5', href: '/upload', span: 4, bg: 'var(--amber-wash)', dark: false },
  { num: '06', key: 'hub_t6', href: '/bounty', span: 4, bg: 'var(--bg)', dark: false },
  { num: '07', key: 'hub_t7', href: '/billing', span: 4, bg: 'var(--surface)', dark: false },
  { num: '08', key: 'hub_t8', href: '/insurer', span: 4, bg: 'var(--bg-mist)', dark: false },
] as const

type Tile = typeof tiles[number]
type TKey = Parameters<ReturnType<typeof useI18n>['t']>[0]

function TileCard({ tile }: { tile: Tile }) {
  const { t } = useI18n()
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
        padding: 'hero' in tile && tile.hero ? '48px 56px' : '32px 36px',
        background: tile.bg,
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--line)',
        textDecoration: 'none',
        color: tile.dark ? '#fff' : 'var(--ink)',
        transition: 'transform .18s ease, box-shadow .18s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-pop)' : 'var(--shadow-1)',
        minHeight: 'hero' in tile && tile.hero ? 220 : 180,
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
          {tile.num} · {t(`${tile.key}_label` as TKey)}
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'hero' in tile && tile.hero ? 36 : 22,
          fontWeight: 400,
          margin: '0 0 12px',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>
          {t(`${tile.key}_title` as TKey)}
        </h3>
        <p style={{
          fontSize: 14,
          lineHeight: 1.55,
          opacity: tile.dark ? 0.7 : 0.65,
          margin: 0,
          maxWidth: 'hero' in tile && tile.hero ? 560 : 320,
        }}>
          {t(`${tile.key}_desc` as TKey)}
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
        {t('hub_enter')} <span style={{ fontSize: 16 }}>→</span>
      </div>
    </Link>
  )
}

export default function HubPage() {
  const { t } = useI18n()
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '0 0 80px' }}>
      {/* Header */}
      <header className="gc-hub-header" style={{
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
          <span className="gc-hub-version" style={{
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
      <div className="gc-hub-hero" style={{ padding: '64px 48px 48px', maxWidth: 1400 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: '0 0 20px',
          maxWidth: 820,
        }}>
          {t('hub_title_a')}
          <em style={{ color: 'var(--brand)', fontStyle: 'italic' }}>{t('hub_title_em')}</em>
          {t('hub_title_b')}
        </h1>
        <p style={{
          fontSize: 17,
          color: 'var(--ink-3)',
          lineHeight: 1.6,
          maxWidth: 600,
          margin: 0,
        }}>
          {t('hub_sub')}
        </p>
      </div>

      {/* 12-column tile grid */}
      <div className="gc-hub-grid" style={{
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
