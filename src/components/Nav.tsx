'use client'

import Link from 'next/link'
import { GCLogo } from './GCLogo'
import { LangToggle } from './LangToggle'
import { useI18n } from './I18nProvider'

interface NavProps {
  active?: 'product' | 'intel' | 'insurer' | 'pricing'
}

export function Nav({ active }: NavProps) {
  const { t } = useI18n()
  return (
    <nav className="gc-nav">
      <Link href="/" className="gc-brand">
        <GCLogo size={26} color="var(--ink)" />
        GraffCloud
      </Link>
      <div className="gc-nav-links">
        <Link href="/landing#product" className={active === 'product' ? 'on' : ''}>{t('nav_product')}</Link>
        <Link href="/intelligence" className={active === 'intel' ? 'on' : ''}>{t('nav_intelligence')}</Link>
        <Link href="/insurer" className={active === 'insurer' ? 'on' : ''}>{t('nav_insurers')}</Link>
        <Link href="/billing" className={active === 'pricing' ? 'on' : ''}>{t('nav_pricing')}</Link>
      </div>
      <div className="gc-nav-right">
        <LangToggle />
        <Link href="/login" className="gc-nav-signin">{t('nav_login')}</Link>
        <Link href="/login?mode=signup" className="btn btn-primary">{t('nav_try')}</Link>
      </div>
    </nav>
  )
}
