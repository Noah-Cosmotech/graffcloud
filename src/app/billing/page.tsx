'use client'

import { useState } from 'react'
import { Nav } from '@/components/Nav'
import { ToastContainer, showToast } from '@/components/Toast'
import { useI18n } from '@/components/I18nProvider'

type BillingPeriod = 'monthly' | 'annual'
type PlanKey = 'starter' | 'pro' | 'enterprise'
type PaymentMethod = 'card' | 'vipps'

const INVOICES = [
  { id: 'INV-2026-04', period: 'Apr 2026', plan: 'Professional', amount: '5,900', status: 'PAID' },
  { id: 'INV-2026-03', period: 'Mar 2026', plan: 'Professional', amount: '5,900', status: 'PAID' },
  { id: 'INV-2026-02', period: 'Feb 2026', plan: 'Professional', amount: '5,900', status: 'PAID' },
  { id: 'INV-2026-01', period: 'Jan 2026', plan: 'Starter', amount: '1,490', status: 'PAID' },
]

function openPrintInvoice(inv: typeof INVOICES[0]) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${inv.id} — GraffCloud</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', sans-serif; color: #0A0A0A; padding: 60px; max-width: 800px; margin: 0 auto; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 2px solid #0A0A0A; padding-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .logo span { color: #6B6B6B; font-weight: 400; }
    .inv-id { font-size: 13px; color: #6B6B6B; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    h2 { font-size: 11px; letter-spacing: 0.1em; color: #9A9A9A; text-transform: uppercase; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .total { font-size: 18px; font-weight: 700; padding: 16px 0; border-top: 2px solid #0A0A0A; margin-top: 8px; display: flex; justify-content: space-between; }
    .badge { display: inline-block; background: #166534; color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
    .footer { margin-top: 60px; font-size: 12px; color: #9A9A9A; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 30px; } }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <div class="logo">GraffCloud <span>AS</span></div>
      <div class="inv-id">Org. 934 118 207 · Oslo, Norway</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em">${inv.id}</div>
      <div style="font-size:13px;color:#6B6B6B;margin-top:4px">${inv.period}</div>
      <div style="margin-top:8px"><span class="badge">${inv.status}</span></div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px">
    <div>
      <h2>Billed to</h2>
      <div style="font-size:14px;line-height:1.6">
        Eiendom AS<br/>
        Marte Haugen<br/>
        Storgata 1, 0182 Oslo<br/>
        marte@eiendom.no
      </div>
    </div>
    <div>
      <h2>Payment details</h2>
      <div style="font-size:14px;line-height:1.6">
        Method: Credit card<br/>
        Currency: NOK<br/>
        Due date: ${inv.period}<br/>
        Payment date: ${inv.period}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Line items</h2>
    <div class="row"><span>${inv.plan} Plan — ${inv.period}</span><span>NOK ${inv.amount}</span></div>
    <div class="row"><span>VAT 0% (reverse charge / B2B)</span><span>NOK 0</span></div>
    <div class="total"><span>Total</span><span>NOK ${inv.amount}</span></div>
  </div>

  <div class="footer">
    GraffCloud AS · Stortingsgata 6, 0161 Oslo · VAT NO 934118207MVA · IBAN NO93 1503 4242 4242 · support@graffcloud.no
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`)
  win.document.close()
}

export default function BillingPage() {
  const { t } = useI18n()
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [cardNum, setCardNum] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [vippsPhone, setVippsPhone] = useState('')

  function handleCheckout(plan: PlanKey) {
    setSelectedPlan(plan)
    setTimeout(() => {
      document.getElementById('gc-checkout-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlan) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, billing }),
      })
      if (!res.ok) throw new Error('stripe_not_configured')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('no_url')
      }
    } catch {
      showToast('Stripe not configured yet — add your keys in Vercel to enable checkout.', 'default')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const prices: Record<PlanKey, { monthly: string; annual: string; label: string }> = {
    starter: { monthly: '1 490', annual: '1 192', label: 'STARTER' },
    pro: { monthly: '5 900', annual: '4 720', label: 'PROFESSIONAL' },
    enterprise: { monthly: '24 900', annual: '24 900', label: 'ENTERPRISE' },
  }

  const planLabels: Record<PlanKey, string> = {
    starter: 'Starter',
    pro: 'Professional',
    enterprise: 'Enterprise',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav active="pricing" />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 40px' }}>

        {/* ── PRICING SECTION ── */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-4)', marginBottom: 16 }}>
            07 · PRICING
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.05, color: 'var(--ink)', margin: '0 0 32px' }}>
            {t('pricing_title')}
          </h2>

          {/* Billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', background: 'rgba(10,10,10,0.06)', borderRadius: 'var(--r-pill)', padding: 4 }}>
              {(['monthly', 'annual'] as BillingPeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => setBilling(p)}
                  style={{
                    border: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '8px 20px',
                    borderRadius: 'var(--r-pill)',
                    background: billing === p ? 'var(--ink)' : 'transparent',
                    color: billing === p ? '#fff' : 'var(--ink-4)',
                    transition: 'background .15s, color .15s',
                  }}
                >
                  {p === 'monthly' ? t('billing_monthly') : t('billing_annual')}
                </button>
              ))}
            </div>
            {billing === 'annual' && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--green)', background: 'var(--green-wash)', padding: '4px 10px', borderRadius: 'var(--r-pill)' }}>
                {t('billing_saves')}
              </span>
            )}
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, alignItems: 'start' }}>

            {/* STARTER */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-4)', marginBottom: 20 }}>
                STARTER
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400, color: 'var(--ink)' }}>
                  NOK {billing === 'monthly' ? '1 490' : '1 192'}
                </span>
                <span style={{ color: 'var(--ink-4)', fontSize: 14, marginLeft: 6 }}>/month</span>
              </div>
              {billing === 'annual' && (
                <div style={{ fontSize: 12, color: 'var(--ink-5)', marginBottom: 8 }}>{t('billing_billed_annual')}</div>
              )}
              <p style={{ fontSize: 14, color: 'var(--ink-4)', lineHeight: 1.5, margin: '0 0 24px' }}>
                Up to 5 properties, 100 incidents/month.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['AI signature clustering', 'Evidence vault (7-yr)', 'Oslo + Bergen + Trondheim graph', 'Court-ready PDF', 'Email support 24h SLA'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--ink-3)' }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleCheckout('starter')}
              >
                {t('pricing_cta_start')}
              </button>
            </div>

            {/* PRO (featured) */}
            <div style={{
              background: '#0A0A0A',
              borderRadius: 'var(--r-xl)',
              padding: 32,
              boxShadow: 'var(--shadow-pop)',
              transform: 'scale(1.02)',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--amber)', color: '#0A0A0A', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', padding: '4px 14px', borderRadius: 'var(--r-pill)' }}>
                {t('billing_popular')}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--amber)', marginBottom: 20 }}>
                PROFESSIONAL
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400, color: '#fff' }}>
                  NOK {billing === 'monthly' ? '5 900' : '4 720'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginLeft: 6 }}>/month</span>
              </div>
              {billing === 'annual' && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{t('billing_billed_annual')}</div>
              )}
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '0 0 24px' }}>
                Up to 50 properties, unlimited incidents.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Everything in Starter',
                  'Full Nordic graph',
                  'Portfolio readiness',
                  'Bounty publisher',
                  'BankID tipster',
                  'Slack + Teams',
                  'Success manager',
                ].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                    <span style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '13px 20px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--amber)',
                  color: '#0A0A0A',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onClick={() => handleCheckout('pro')}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(245,158,11,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
              >
                {t('pricing_cta_start')}
              </button>
            </div>

            {/* ENTERPRISE */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-4)', marginBottom: 20 }}>
                ENTERPRISE
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--ink-5)', marginBottom: 6 }}>
                FROM
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--ink)' }}>
                  NOK 24&hairsp;900
                </span>
                <span style={{ color: 'var(--ink-4)', fontSize: 14, marginLeft: 6 }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-4)', lineHeight: 1.5, margin: '0 0 24px' }}>
                Municipalities, housing groups, transit operators, insurers.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Everything in Pro',
                  'Unlimited properties & incidents',
                  'Insurer API',
                  'Police judicial-unlock',
                  'On-prem / Azure',
                  'ISO 27001 + GDPR DPA',
                  '99.9% SLA',
                ].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--ink-3)' }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@graffcloud.no"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
              >
                {t('pricing_cta_contact')}
              </a>
            </div>
          </div>
        </section>

        {/* ── CHECKOUT PANEL ── */}
        {selectedPlan && selectedPlan !== 'enterprise' && (
          <section id="gc-checkout-panel" style={{ marginBottom: 80 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32, alignItems: 'start' }}>

              {/* Order summary */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', padding: 36, boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
                  Complete your order
                </h3>

                {/* Summary row */}
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{planLabels[selectedPlan]} Plan</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>
                        NOK {prices[selectedPlan][billing]}/month{billing === 'annual' ? ' · billed annually' : ''}
                      </div>
                    </div>
                    <span style={{
                      background: 'var(--green-wash)',
                      color: 'var(--green)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 'var(--r-pill)',
                    }}>
                      30-DAY FREE TRIAL
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-5)', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                    No charge today. Cancel any time before trial ends.
                  </div>
                </div>

                {/* Payment method */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Payment method
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    {(['card', 'vipps'] as PaymentMethod[]).map(m => (
                      <label key={m} style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 16px',
                        borderRadius: 'var(--r-lg)',
                        border: `2px solid ${paymentMethod === m ? 'var(--ink)' : 'var(--line-2)'}`,
                        cursor: 'pointer',
                        background: paymentMethod === m ? 'rgba(10,10,10,0.03)' : 'transparent',
                        transition: 'border .15s',
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                        <input
                          type="radio"
                          name="payment"
                          value={m}
                          checked={paymentMethod === m}
                          onChange={() => setPaymentMethod(m)}
                          style={{ accentColor: 'var(--ink)' }}
                        />
                        {m === 'card' ? '💳 Card' : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ background: '#FF5B24', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 12, fontWeight: 800 }}>V</span>
                            Vipps
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit}>
                    {paymentMethod === 'card' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Card number</label>
                          <input
                            type="text"
                            placeholder="4242 4242 4242 4242"
                            value={cardNum}
                            onChange={e => setCardNum(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              borderRadius: 'var(--r-md)',
                              border: '1px solid var(--line-2)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 14,
                              background: 'var(--surface)',
                              color: 'var(--ink)',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Expiry</label>
                            <input
                              type="text"
                              placeholder="MM / YY"
                              value={cardExpiry}
                              onChange={e => setCardExpiry(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '11px 14px',
                                borderRadius: 'var(--r-md)',
                                border: '1px solid var(--line-2)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 14,
                                background: 'var(--surface)',
                                color: 'var(--ink)',
                                outline: 'none',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, display: 'block', fontWeight: 500 }}>CVC</label>
                            <input
                              type="text"
                              placeholder="•••"
                              value={cardCvc}
                              onChange={e => setCardCvc(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '11px 14px',
                                borderRadius: 'var(--r-md)',
                                border: '1px solid var(--line-2)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 14,
                                background: 'var(--surface)',
                                color: 'var(--ink)',
                                outline: 'none',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Mobile number</label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input
                            type="tel"
                            placeholder="+47 900 00 000"
                            value={vippsPhone}
                            onChange={e => setVippsPhone(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '11px 14px',
                              borderRadius: 'var(--r-md)',
                              border: '1px solid var(--line-2)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 14,
                              background: 'var(--surface)',
                              color: 'var(--ink)',
                              outline: 'none',
                            }}
                          />
                          <div style={{ background: '#FF5B24', color: '#fff', borderRadius: 8, padding: '8px 14px', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em' }}>
                            Vipps
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-5)', marginTop: 8 }}>
                          You will receive a push notification in the Vipps app to approve.
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={checkoutLoading}
                      style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '14px 20px', fontSize: 15, fontWeight: 600, opacity: checkoutLoading ? 0.7 : 1, cursor: checkoutLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {checkoutLoading ? 'Processing…' : 'Start 30-day trial'}
                    </button>
                  </form>
                </div>

                {/* Trust badges */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  {[
                    { icon: '🔒', label: 'SSL' },
                    { icon: '🇪🇺', label: 'GDPR' },
                    { icon: '⚡', label: 'Stripe' },
                    { icon: 'V', label: 'Vipps', vipps: true },
                  ].map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-5)', fontWeight: 500 }}>
                      {b.vipps ? (
                        <span style={{ background: '#FF5B24', color: '#fff', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontWeight: 900 }}>V</span>
                      ) : (
                        <span>{b.icon}</span>
                      )}
                      {b.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: plan recap */}
              <div style={{ background: '#0A0A0A', borderRadius: 'var(--r-xl)', padding: 28, color: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                  ORDER SUMMARY
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, marginBottom: 6 }}>
                  {planLabels[selectedPlan]}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  NOK {prices[selectedPlan][billing]}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
                  {billing === 'annual' ? `${t('billing_billed_annual')} · save 20%` : t('billing_monthly')}
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: 'var(--r-pill)', padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                >
                  Change plan
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── INVOICE HISTORY ── */}
        <section>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
            Invoice history
          </h3>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  {['Invoice', 'Period', 'Plan', 'Amount', 'Status', ''].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '14px 20px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      color: 'var(--ink-4)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((inv, i) => (
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: i < INVOICES.length - 1 ? '1px solid var(--line)' : 'none',
                    }}
                  >
                    <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)' }}>
                      {inv.id}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--ink-3)' }}>
                      {inv.period}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--ink-3)' }}>
                      {inv.plan}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                      NOK {inv.amount}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        background: 'var(--green-wash)',
                        color: 'var(--green)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => openPrintInvoice(inv)}
                        className="btn btn-ghost"
                        style={{ padding: '7px 16px', fontSize: 12, gap: 6 }}
                      >
                        ↓ Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <ToastContainer />
    </div>
  )
}
