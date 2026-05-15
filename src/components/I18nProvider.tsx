'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DICT = {
  en: {
    nav_product: 'Platform',
    nav_intelligence: 'Intelligence',
    nav_pricing: 'Pricing',
    nav_insurers: 'Insurers',
    nav_login: 'Sign in',
    nav_try: 'Request access',
    status_online: 'Platform online',
    live: 'Live',
    hero_eyebrow: 'Nordic Urban Vandalism Intelligence',
    hero_title_a: 'Turn graffiti into',
    hero_title_b: 'actionable evidence.',
    hero_sub: 'GraffCloud is the intelligence layer property owners, insurers and transit operators use to cluster tags, track crew movement across cities, and hand police a case file that actually closes.',
    hero_cta_primary: 'Start a 30-day trial',
    hero_cta_secondary: 'Watch 2-min demo',
    hero_proof: 'Piloted in Oslo, Bergen, Trondheim and Stavanger',
    metric_incidents: 'Incidents ingested',
    metric_cities: 'Cities in active graph',
    metric_recovery: 'Owner cost recovery rate',
    metric_clearance: 'Police referral clearance',
    section_how: 'How the intelligence layer works',
    step1_t: 'Capture',
    step1_d: 'Owners, tenants and transit crews upload from phone or desk. GPS, timestamp and chain-of-custody metadata are sealed into an immutable evidence record.',
    step2_t: 'Cluster',
    step2_d: "Our Siamese vision model fingerprints the tag's glyph shape, drip pattern and cap style — then matches it against 41,800+ incidents across the Nordics.",
    step3_t: 'Connect',
    step3_d: 'The ontology graph links tag → crew → route → funding → suspect, surfacing the same signature moving from Grünerløkka to Möllevången in under 11 days.',
    step4_t: 'Prosecute',
    step4_d: 'Export a court-ready PDF dossier with entity timeline, evidence chain and cost ledger. Police unlock identity clusters under judicial order.',
    cities_title: 'Beta coverage — live across Norway',
    insurers_title: 'Built with Nordic insurers, not around them',
    insurers_sub: 'Anonymised risk scores, predictive heatmaps and pre-filled claim intelligence plug directly into underwriter workflows. Claims cost density is down 22% in Oslo pilots.',
    pricing_title: 'Pricing that scales with your portfolio',
    pricing_sub: 'All tiers include AI clustering, evidence vault and the Nordic movement graph.',
    tier_starter: 'Starter',
    tier_pro: 'Professional',
    tier_enterprise: 'Enterprise',
    pricing_cta_start: 'Start free trial',
    pricing_cta_contact: 'Talk to sales',
    footer_rights: '© 2026 GraffCloud AS · Org. 934 118 207 · Oslo',
    dash_portfolio: 'Portfolio',
    dash_incidents: 'Incidents',
    dash_intel: 'Intelligence',
    dash_bounty: 'Bounty Board',
    dash_billing: 'Billing',
    dash_settings: 'Settings',
    dash_greeting: 'Good afternoon, Marte',
    dash_sub: '14 new incidents across your portfolio since yesterday. 3 match existing crew signatures.',
    dash_cost_ytd: 'Damage cost, YTD',
    dash_incidents_30: 'Incidents, last 30d',
    dash_readiness: 'Portfolio readiness',
    dash_open_bounties: 'Open bounties',
    dash_recent: 'Recent incidents',
    dash_properties: 'Properties',
    dash_alerts: 'Alerts',
    intel_title: 'Movement Intelligence',
    intel_sub: 'Signature K4Z3 — tracked across 9 cities since 14 Mar 2026',
    intel_timeline: 'Timeline playback',
    intel_cluster: 'Cluster profile',
    intel_related: 'Related entities',
    upload_title: 'Report an incident',
    upload_drop: 'Drop photo or drag from phone',
    upload_match: 'AI match confidence',
    back: 'Back',
    next: 'Next',
    new_incident: 'New incident',
    per_month: '/month',
  },
  no: {
    nav_product: 'Plattform',
    nav_intelligence: 'Etterretning',
    nav_pricing: 'Priser',
    nav_insurers: 'Forsikring',
    nav_login: 'Logg inn',
    nav_try: 'Be om tilgang',
    status_online: 'Plattform tilgjengelig',
    live: 'Live',
    hero_eyebrow: 'Nordisk tagging- og hærverksetterretning',
    hero_title_a: 'Gjør hærverk om til',
    hero_title_b: 'bevis som holder i retten.',
    hero_sub: 'GraffCloud er etterretningslaget eiendomseiere, forsikringsselskaper og kollektivoperatører bruker for å kople tags, spore miljøer på tvers av byer og levere politiet en sak som faktisk blir løst.',
    hero_cta_primary: 'Start 30 dagers prøve',
    hero_cta_secondary: 'Se 2-min demo',
    hero_proof: 'Pilotert i Oslo, Bergen, Trondheim og Stavanger',
    metric_incidents: 'Hendelser registrert',
    metric_cities: 'Byer i aktiv graf',
    metric_recovery: 'Kostnadsdekning for eier',
    metric_clearance: 'Politihenleggelse omgjort',
    section_how: 'Slik fungerer etterretningslaget',
    step1_t: 'Innhent',
    step1_d: 'Eiere, leietakere og driftspersonell laster opp fra mobil eller desktop. GPS, tidsstempel og sporbarhet forsegles i et uforanderlig bevisregister.',
    step2_t: 'Gruppér',
    step2_d: 'Vår Siamese-modell tar fingeravtrykk av taggens glyff, dryppmønster og capstil — og matcher den mot 41 800+ hendelser i Norden.',
    step3_t: 'Kople',
    step3_d: 'Ontologigrafen kopler tag → miljø → rute → finansiering → mistenkt og viser samme signatur fra Grünerløkka til Möllevången på under 11 dager.',
    step4_t: 'Anmeld',
    step4_d: 'Eksportér en rettsklar PDF-dossier med entitetstidslinje, beviskjede og kostnadsregnskap. Politiet låser opp identitet etter rettsbeslutning.',
    cities_title: 'Beta-dekning — live i Norge',
    insurers_title: 'Bygget sammen med nordiske forsikrere',
    insurers_sub: 'Anonymiserte risikoskårer, prediktive varmekart og forhåndsutfylt skadeintelligens plugges rett inn i skadebehandling. Skadekostnadstetthet er ned 22 % i Oslo-piloter.',
    pricing_title: 'Pris som skalerer med porteføljen',
    pricing_sub: 'Alle nivåer inkluderer AI-klustring, bevishvelv og den nordiske bevegelsesgrafene.',
    tier_starter: 'Starter',
    tier_pro: 'Profesjonell',
    tier_enterprise: 'Foretak',
    pricing_cta_start: 'Start gratis prøve',
    pricing_cta_contact: 'Snakk med salg',
    footer_rights: '© 2026 GraffCloud AS · Org. 934 118 207 · Oslo',
    dash_portfolio: 'Portefølje',
    dash_incidents: 'Hendelser',
    dash_intel: 'Etterretning',
    dash_bounty: 'Dusør',
    dash_billing: 'Fakturering',
    dash_settings: 'Innstillinger',
    dash_greeting: 'God ettermiddag, Marte',
    dash_sub: '14 nye hendelser på porteføljen din siden i går. 3 matcher kjente miljøer.',
    dash_cost_ytd: 'Skadekostnad, hittil i år',
    dash_incidents_30: 'Hendelser, siste 30d',
    dash_readiness: 'Beredskap i porteføljen',
    dash_open_bounties: 'Åpne dusører',
    dash_recent: 'Nylige hendelser',
    dash_properties: 'Eiendommer',
    dash_alerts: 'Varsler',
    intel_title: 'Bevegelsesettretning',
    intel_sub: 'Signatur K4Z3 — sporet gjennom 9 byer siden 14. mars 2026',
    intel_timeline: 'Tidslinjeavspilling',
    intel_cluster: 'Miljøprofil',
    intel_related: 'Relaterte enheter',
    upload_title: 'Rapportér hendelse',
    upload_drop: 'Slipp bilde eller dra fra mobil',
    upload_match: 'AI-matchsikkerhet',
    back: 'Tilbake',
    next: 'Neste',
    new_incident: 'Ny hendelse',
    per_month: '/mnd',
  },
} as const

type Lang = 'en' | 'no'
type DictKey = keyof typeof DICT.en

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: DictKey) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = localStorage.getItem('gc_lang') as Lang | null
    if (stored === 'en' || stored === 'no') setLangState(stored)
  }, [])

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('gc_lang', l)
    setLangState(l)
    document.documentElement.lang = l === 'no' ? 'nb' : 'en'
  }, [])

  const t = useCallback((key: DictKey): string => {
    return (DICT[lang] as Record<string, string>)[key] ?? (DICT.en as Record<string, string>)[key] ?? key
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
