'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GCLogo } from '@/components/GCLogo'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/components/I18nProvider'
import { showToast, ToastContainer } from '@/components/Toast'

/* ─── Left-panel globe ──────────────────────────────────────────── */
function LoginGlobe() {
  // Orthographic projection: lat0=52°N, lon0=8°E, R=240, SVG center=(180,155)
  // City positions match landing page and canvas globe
  return (
    <svg viewBox="0 0 360 320" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}>
      {/* Globe sphere */}
      <circle cx="180" cy="160" r="130" stroke="white" strokeWidth="0.8" />
      <circle cx="180" cy="160" r="92" stroke="white" strokeWidth="0.5" />
      <ellipse cx="180" cy="160" rx="130" ry="43" stroke="white" strokeWidth="0.5" />
      <ellipse cx="180" cy="160" rx="130" ry="83" stroke="white" strokeWidth="0.4" />
      <path d="M180 30 Q214 160 180 290" stroke="white" strokeWidth="0.5" fill="none" />
      <path d="M180 30 Q146 160 180 290" stroke="white" strokeWidth="0.5" fill="none" />
      {/* K4Z3 trail: Oslo→Bergen→Trondheim→Göteborg→Copenhagen→Hamburg→Amsterdam→Barcelona */}
      <path d="M186 122 Q180 111 174 120" stroke="oklch(0.76 0.15 65)" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M174 120 Q179 102 185 107" stroke="oklch(0.76 0.15 65)" strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M185 107 Q190 114 191 139" stroke="oklch(0.76 0.15 65)" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M191 139 Q190 140 185 149" stroke="oklch(0.76 0.15 65)" strokeWidth="0.9" fill="none" opacity="0.45" />
      <path d="M185 149 Q178 149 172 153" stroke="oklch(0.76 0.15 65)" strokeWidth="0.9" fill="none" opacity="0.4" />
      <path d="M172 153 Q164 179 162 198" stroke="oklch(0.76 0.15 65)" strokeWidth="1.1" fill="none" opacity="0.6" />
      {/* Trondheim — above Oslo */}
      <circle cx="185" cy="107" r="3" fill="oklch(0.76 0.15 65)" />
      <circle cx="185" cy="107" r="7" fill="oklch(0.76 0.15 65)" opacity="0.25" />
      {/* Oslo — primary hub */}
      <circle cx="186" cy="122" r="4" fill="oklch(0.76 0.15 65)" />
      <circle cx="186" cy="122" r="9" fill="oklch(0.76 0.15 65)" opacity="0.3" />
      {/* Bergen — left of Oslo */}
      <circle cx="174" cy="120" r="2.5" fill="oklch(0.76 0.15 65)" opacity="0.8" />
      {/* Göteborg */}
      <circle cx="191" cy="139" r="2.5" fill="oklch(0.76 0.15 65)" opacity="0.7" />
      {/* Copenhagen */}
      <circle cx="185" cy="149" r="2" fill="white" opacity="0.6" />
      {/* Hamburg */}
      <circle cx="172" cy="153" r="2" fill="white" opacity="0.5" />
      {/* Barcelona — southern terminus */}
      <circle cx="162" cy="198" r="3.5" fill="oklch(0.76 0.15 65)" opacity="0.85" />
      <circle cx="162" cy="198" r="8" fill="oklch(0.76 0.15 65)" opacity="0.2" />
    </svg>
  )
}

/* ─── Google SVG icon ───────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

/* ─── Microsoft SVG icon ────────────────────────────────────────── */
function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022"/>
      <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00"/>
      <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
    </svg>
  )
}

/* ─── BankID icon ───────────────────────────────────────────────── */
function BankIDIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#003082"/>
      <text x="2" y="14" fontSize="8" fontWeight="700" fill="#fff" fontFamily="monospace">BID</text>
    </svg>
  )
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string; password?: string}>({})
  const passwordRef = useRef<HTMLInputElement>(null)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const validateFields = () => {
    const newErrors: {email?: string; password?: string} = {}
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignIn = () => {
    if (!validateFields()) return
    setLoading(true)
    setTimeout(() => router.push('/dashboard'), 600)
  }

  const handleForgot = () => {
    if (!emailRegex.test(email)) return
    setForgotSent(true)
    setTimeout(() => setForgotSent(false), 3000)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <ToastContainer />

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <LoginGlobe />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <GCLogo size={30} color="#fff" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff' }}>
            GraffCloud
          </span>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 3vw, 46px)',
            fontWeight: 400,
            color: '#fff',
            lineHeight: 1.1,
            margin: '0 0 40px',
            maxWidth: 400,
          }}>
            From photo to court-ready evidence in{' '}
            <em style={{ color: 'oklch(0.76 0.15 65)', fontStyle: 'italic' }}>48 hours.</em>
          </h2>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 48 }}>
            {[
              { n: '41,842', l: 'Incidents' },
              { n: '92%', l: 'Match rate' },
              { n: '9', l: 'Cities' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'oklch(0.76 0.15 65)', lineHeight: 1, marginBottom: 4 }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--r-lg)',
            padding: '24px 28px',
            maxWidth: 420,
          }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.55,
              margin: '0 0 16px',
              fontStyle: 'italic',
            }}>
              "GraffCloud gave us the first crew-level evidence our legal team could actually use. Three repeat offenders identified across Oslo and Bergen within two weeks."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: '#fff',
                fontWeight: 600,
              }}>
                GL
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>Geirr Løvås</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Head of Security · Obos Eiendom</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div style={{
        width: 520,
        flexShrink: 0,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 48px',
        overflowY: 'auto',
      }}>
        {/* Lang toggle top-right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 48 }}>
          <LangToggle />
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 36px',
            lineHeight: 1.05,
          }}>
            {t('login_welcome')}
          </h2>

          {/* SSO buttons */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 24 }}>
            <button
              onClick={() => showToast('Google sign-in available when connected to Supabase. For demo: use any email + password.')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '13px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--line-2)',
                borderRadius: 'var(--r-pill)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                transition: 'background .15s, transform .15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)' }}
            >
              <GoogleIcon />
              {t('login_google')}
            </button>
            <button
              onClick={() => showToast('Microsoft sign-in available when connected to Supabase. For demo: use any email + password.')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '13px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--line-2)',
                borderRadius: 'var(--r-pill)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                transition: 'background .15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)' }}
            >
              <MicrosoftIcon />
              {t('login_microsoft')}
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 24,
            color: 'var(--ink-4)',
            fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
            or email
            <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
          </div>

          {/* Email + password */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              <input
                type="email"
                placeholder={t('login_email_placeholder')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
                onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${errors.email ? '#ef4444' : 'var(--line-2)'}`,
                  background: 'var(--surface)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  transition: 'border-color .15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : 'var(--ink)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : 'var(--line-2)' }}
              />
              {errors.email && (
                <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.email}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              <input
                ref={passwordRef}
                type="password"
                placeholder={t('login_password_placeholder')}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${errors.password ? '#ef4444' : 'var(--line-2)'}`,
                  background: 'var(--surface)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  transition: 'border-color .15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : 'var(--ink)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : 'var(--line-2)' }}
              />
              {errors.password && (
                <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.password}</span>
              )}
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right' as const, marginBottom: 20 }}>
            {forgotSent ? (
              <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
                Reset link sent to {email}
              </span>
            ) : (
              <button
                onClick={handleForgot}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 13,
                  color: 'var(--ink-4)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  textDecoration: 'underline',
                  textDecorationColor: 'transparent',
                  transition: 'color .15s, text-decoration-color .15s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.color = 'var(--ink)'
                  el.style.textDecorationColor = 'var(--ink)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.color = 'var(--ink-4)'
                  el.style.textDecorationColor = 'transparent'
                }}
              >
                {t('login_forgot')}
              </button>
            )}
          </div>

          {/* Sign in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              padding: '14px 24px',
              background: 'var(--ink)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              fontSize: 15,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginBottom: 12,
              transition: 'opacity .15s, transform .15s, box-shadow .15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const el = e.currentTarget as HTMLButtonElement
                el.style.transform = 'translateY(-1px)'
                el.style.boxShadow = 'var(--shadow-2)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            {loading ? t('login_signing_in') : t('login_submit')}
          </button>

          {/* BankID button */}
          <button
            onClick={() => showToast('BankID sign-in available when connected to Supabase. For demo: use any email + password.')}
            style={{
              padding: '14px 24px',
              background: '#003082',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              fontSize: 15,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = '0 4px 20px rgba(0,48,130,0.35)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            <BankIDIcon />
            {t('login_bankid')}
          </button>

          {/* Signup link */}
          <div style={{ textAlign: 'center' as const, fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 24 }}>
            {t('login_no_account')}{' '}
            <Link href="/landing#pricing" style={{
              color: 'var(--ink)',
              fontWeight: 500,
              textDecoration: 'underline',
              textDecorationColor: 'var(--line-2)',
            }}>
              {t('login_request')} →
            </Link>
          </div>

          {/* Security badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'var(--surface)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--line)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L2 3v4c0 2.76 2.12 5.34 5 5.94C9.88 12.34 12 9.76 12 7V3L7 1z" fill="var(--green)" opacity="0.85"/>
              <path d="M5 7l1.5 1.5L9 5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>
              GDPR aligned · Data stored in Norway · ISO 27001 in progress
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
