import Stripe from 'stripe'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

export const PLANS = {
  starter: {
    name: 'Starter',
    nameNo: 'Starter',
    priceMonthly: 149000, // NOK in øre
    priceAnnual: 119200,
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    priceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL!,
    description: 'Up to 5 properties, 100 incidents/mo.',
    features: [
      'AI signature clustering',
      'Evidence vault (7-yr retention)',
      'Oslo + Bergen + Trondheim graph',
      'Court-ready PDF export',
      'Email support, 24h SLA',
    ],
  },
  pro: {
    name: 'Professional',
    nameNo: 'Profesjonell',
    priceMonthly: 590000,
    priceAnnual: 472000,
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    priceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
    description: 'Up to 50 properties, unlimited incidents.',
    features: [
      'Everything in Starter',
      'Full Nordic movement graph',
      'Portfolio readiness scoring',
      'Bounty marketplace publisher',
      'BankID-verified tipster channel',
      'Slack + Teams incident alerts',
      'Dedicated success manager',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    nameNo: 'Foretak',
    priceMonthly: 2490000,
    priceAnnual: null,
    priceId: null,
    priceIdAnnual: null,
    description: 'Municipalities, housing groups, transit operators, insurers.',
    features: [
      'Everything in Professional',
      'Unlimited properties & incidents',
      'Insurer risk-score API',
      'Police judicial-unlock integration',
      'On-prem or Azure Norway North',
      'ISO 27001 + GDPR DPA',
      '99.9% uptime SLA',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

export function formatNOK(øre: number): string {
  return (øre / 100).toLocaleString('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
