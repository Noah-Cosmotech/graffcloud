'use client'

import Link from 'next/link'
import { useI18n } from './I18nProvider'

export function Footer() {
  const { t } = useI18n()
  return (
    <footer style={{ background: 'var(--ink)', color: '#fff', padding: '80px 40px 48px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 14 }}>GraffCloud</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 280, fontSize: 13.5, lineHeight: 1.55 }}>
              The Nordic urban vandalism intelligence platform. Built in Oslo, deployed across Scandinavia.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ISO 27001', 'GDPR', 'SOC 2'].map(badge => (
                <span key={badge} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', fontWeight: 500 }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/dashboard', label: 'Owner dashboard' },
                { href: '/intelligence', label: 'Intelligence globe' },
                { href: '/upload', label: 'Incident upload' },
                { href: '/bounty', label: 'Bounty marketplace' },
                { href: '/insurer', label: 'Insurer console' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14 }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', fontWeight: 500 }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/landing#product', label: 'About GraffCloud' },
                { href: '/insurer', label: 'Security & Compliance' },
                { href: 'mailto:press@graffcloud.no', label: 'Press enquiries' },
                { href: 'mailto:jobs@graffcloud.no', label: 'Careers — 4 open roles' },
                { href: 'mailto:sales@graffcloud.no', label: 'Contact sales' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14 }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', fontWeight: 500 }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Terms of service', 'GDPR & privacy', 'DPA template', 'Evidence handling', 'Responsible use policy',
              ].map(label => (
                <li key={label}>
                  <a href="mailto:legal@graffcloud.no" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14 }}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          <span>{t('footer_rights')}</span>
          <span>Made in Oslo 🇳🇴</span>
        </div>
      </div>
    </footer>
  )
}
