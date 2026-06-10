'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { showToast, ToastContainer } from '@/components/Toast'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/components/I18nProvider'

const authConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ── types ─────────────────────────────────────────────────────────────────────
interface Photo { id: string; url: string; name: string; file: File }
interface GeoCoords { lat: number; lon: number; accuracy?: number }

const AI_MATCHES = [
  { code: 'K4Z3', confidence: 92, city: 'Oslo → Barcelona', incidents: 74, color: '#940014' },
  { code: 'BRG-09', confidence: 87, city: 'Bergen', incidents: 12, color: '#FF6B35' },
  { code: 'TRD-22', confidence: 74, city: 'Trondheim', incidents: 8, color: '#E85D04' },
]

// Suggested properties — users can also type any free-form address
const PROPERTY_SUGGESTIONS = [
  'Grünerløkka Gate 12, Oslo',
  'Torget 5, Bergen',
  'Bryggen 18, Bergen',
  'Storgata 44, Trondheim',
  'Jernbanetorget 1, Oslo',
]

const SURFACE_TYPES = ['Wall', 'Window', 'Vehicle', 'Transit', 'Fence', 'Other']

function hashString(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0 }
  return Math.abs(h).toString(16).padStart(8, '0').repeat(8).slice(0, 64)
}

function formatTime(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

// ── component ─────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const { t } = useI18n()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [property, setProperty] = useState('')
  const [surface, setSurface] = useState('Wall')
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [cost, setCost] = useState('')
  const [cctv, setCctv] = useState(false)
  const [coords, setCoords] = useState<GeoCoords>({ lat: 59.9139, lon: 10.7522 })
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(false)
  const [bountyAmount, setBountyAmount] = useState('')
  const [postBounty, setPostBounty] = useState(false)
  const [now, setNow] = useState(new Date())
  const [uploadStage, setUploadStage] = useState(0)
  const [selectedMatch, setSelectedMatch] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [incidentDisplayId, setIncidentDisplayId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Real GPS — requests permission on first load
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setGeoLoading(false)
        setGeoError(false)
      },
      () => { setGeoLoading(false); setGeoError(true) },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  useEffect(() => {
    if (step !== 3) return
    setUploadStage(0)
    const stages = [800, 1600, 2400, 3200]
    const timers = stages.map((delay, i) => setTimeout(() => setUploadStage(i + 1), delay))
    return () => timers.forEach(clearTimeout)
  }, [step])

  const addFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setPhotos(prev => [...prev, { id: Math.random().toString(36).slice(2), url, name: file.name, file }])
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files)
  }

  const removePhoto = (id: string) => setPhotos(prev => prev.filter(p => p.id !== id))

  const refreshGPS = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }); setGeoLoading(false); setGeoError(false) },
      () => { setGeoLoading(false); setGeoError(true) },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  const goStep2 = () => {
    if (photos.length === 0) { showToast('Please upload at least one photo', 'error'); return }
    setStep(2)
  }

  const goStep3 = async () => {
    if (!property.trim()) { showToast('Please enter the property address', 'error'); return }
    if (postBounty && (!bountyAmount || Number(bountyAmount) < 1000)) {
      showToast('Bounty minimum is NOK 1,000', 'error'); return
    }

    setSubmitting(true)
    setStep(3) // show progress immediately

    if (!authConfigured) {
      // Demo mode — no backend call, fake success
      setIncidentDisplayId('INC-DEMO01')
      setSubmitting(false)
      return
    }

    try {
      const form = new FormData()
      photos.forEach(p => form.append('photos', p.file))
      form.append('property', property.trim())
      form.append('date', incidentDate)
      form.append('cost', cost || '0')
      form.append('lat', String(coords.lat))
      form.append('lon', String(coords.lon))
      form.append('geoValid', geoError ? '0' : '1')
      form.append('hash', sealHash)
      if (postBounty && bountyAmount) form.append('bountyAmount', bountyAmount)

      const res = await fetch('/api/incidents', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setIncidentDisplayId(data.displayId)
      showToast('Incident saved successfully', 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed'
      showToast(message, 'error')
      setStep(2)
    } finally {
      setSubmitting(false)
    }
  }

  const sealHash = hashString(`${coords.lat},${coords.lon},${now.toISOString()},${photos.map(p => p.name).join(',')}`)
  const device = typeof navigator !== 'undefined' ? (navigator.userAgent.match(/\(([^)]+)\)/)?.[1] ?? 'Unknown') : 'Unknown'
  const STAGES = ['Uploading', 'Sealing', 'Hashing', 'Done']

  // Stepper — shared between desktop nav and mobile stepper bar
  const stepperItems = [t('upload_photos'), t('upload_details'), t('upload_done')].map((label, i) => {
    const n = i + 1; const done = step > n; const active = step === n
    return (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {i > 0 && <div style={{ width: 20, height: 1, background: done ? 'var(--brand)' : 'var(--line-2)', flexShrink: 0 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: done ? 'var(--brand)' : active ? 'var(--ink)' : 'transparent',
            border: `2px solid ${done ? 'var(--brand)' : active ? 'var(--ink)' : 'var(--line-2)'}`,
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            color: done || active ? '#fff' : 'var(--ink-4)', flexShrink: 0,
          }}>{done ? '✓' : n}</div>
          <span className="gc-step-label" style={{ fontSize: 12, fontWeight: 500, color: active ? 'var(--ink)' : 'var(--ink-4)', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
      </div>
    )
  })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <ToastContainer />

      {/* ── NAV BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 30 }}>
        <Link href="/dashboard" style={{ color: 'var(--ink-4)', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>← {t('back')}</Link>
        <div style={{ width: 1, height: 18, background: 'var(--line-2)', flexShrink: 0 }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, flexShrink: 0 }}>{t('upload_report')}</div>
        <div style={{ flex: 1 }} />
        {/* Stepper — hidden on small mobile, shown in bar below */}
        <div className="gc-stepper-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {stepperItems}
        </div>
        <LangToggle />
      </div>

      {/* ── MOBILE STEPPER BAR (visible only on small screens) ── */}
      <div className="gc-stepper-mobile" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        {stepperItems}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="gc-upload-wrap" style={{ display: 'flex', minHeight: 'calc(100dvh - 61px)', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── FORM ── */}
        <div className="gc-upload-form" style={{ flex: 1, padding: '32px 40px', minWidth: 0 }}>

          {/* ── Step 1: Photos ── */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 6 }}>Upload Photos</div>
              <div style={{ color: 'var(--ink-4)', fontSize: 14, marginBottom: 28 }}>Drag and drop incident photos or take a new photo.</div>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--line-2)'}`,
                  borderRadius: 16, padding: '48px 32px', textAlign: 'center',
                  cursor: 'pointer', background: dragOver ? 'rgba(148,0,20,0.03)' : 'var(--surface)',
                  transition: 'all 0.15s', marginBottom: 16,
                }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🖼</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>Drop photos here</div>
                <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>or click to browse — JPG, PNG, HEIC supported</div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
              </div>

              <button onClick={() => cameraInputRef.current?.click()} style={{ ...ghostBtn, marginBottom: 28 }}>
                📷 Take Photo
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />

              {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))', gap: 10, marginBottom: 32 }}>
                  {photos.map(p => (
                    <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#000' }}>
                      <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => removePhoto(p.id)} style={{
                        position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)', border: 0, color: '#fff', cursor: 'pointer', fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={goStep2} style={primaryBtn}>Continue to Details →</button>
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 6 }}>Incident Details</div>
              <div style={{ color: 'var(--ink-4)', fontSize: 14, marginBottom: 28 }}>Fill in what happened. Location is auto-detected.</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520 }}>

                {/* Property — free text with suggestions */}
                <Field label="Property address *">
                  <input
                    type="text"
                    placeholder="e.g. Karl Johans gate 25, Oslo"
                    value={property}
                    onChange={e => setProperty(e.target.value)}
                    list="gc-property-list"
                    autoComplete="off"
                    style={inputStyle}
                  />
                  <datalist id="gc-property-list">
                    {PROPERTY_SUGGESTIONS.map(p => <option key={p} value={p} />)}
                  </datalist>
                  <div style={{ fontSize: 12, color: 'var(--ink-5)', marginTop: 5 }}>
                    Type any address. Common portfolio addresses appear as suggestions.
                  </div>
                </Field>

                <Field label="Surface Type">
                  <select value={surface} onChange={e => setSurface(e.target.value)} style={inputStyle}>
                    {SURFACE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                <Field label="Date &amp; Time of Incident">
                  <input type="datetime-local" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Estimated Cost (NOK)">
                  <input type="number" placeholder="e.g. 12 000" value={cost} onChange={e => setCost(e.target.value)} min={0} style={inputStyle} />
                </Field>

                <Field label="">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={cctv} onChange={e => setCctv(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--brand)' }} />
                    <span style={{ fontSize: 14, color: 'var(--ink)' }}>CCTV footage available</span>
                  </label>
                </Field>

                {/* GPS — real browser geolocation */}
                <Field label="GPS Location">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1, padding: '10px 14px', background: 'var(--surface)', border: `1px solid ${geoError ? 'var(--line-2)' : 'var(--line-2)'}`, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: geoError ? 'var(--ink-5)' : 'var(--ink-3)' }}>
                      {geoLoading ? 'Detecting location…' : geoError ? 'Location unavailable — allow browser access' : `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`}
                      {!geoLoading && !geoError && coords.accuracy && (
                        <span style={{ color: 'var(--ink-5)', marginLeft: 8 }}>±{Math.round(coords.accuracy)}m</span>
                      )}
                    </div>
                    <button onClick={refreshGPS} disabled={geoLoading} style={{ ...ghostBtn, opacity: geoLoading ? 0.5 : 1 }}>
                      {geoLoading ? '…' : 'Refresh'}
                    </button>
                  </div>
                  {geoError && (
                    <div style={{ fontSize: 12, color: 'var(--ink-5)', marginTop: 5 }}>
                      Enable location in your browser settings to get real GPS coordinates.
                    </div>
                  )}
                </Field>

                {/* Optional bounty posting */}
                <div style={{ background: 'rgba(148,0,20,0.05)', border: '1px solid rgba(148,0,20,0.16)', borderRadius: 12, padding: '16px 18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: postBounty ? 14 : 0 }}>
                    <input type="checkbox" checked={postBounty} onChange={e => setPostBounty(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--brand)' }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Post a bounty reward</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Offer NOK reward for identification of the perpetrator</div>
                    </div>
                  </label>
                  {postBounty && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--amber-ink)', flexShrink: 0 }}>NOK</span>
                      <input
                        type="number"
                        placeholder="1 000"
                        value={bountyAmount}
                        onChange={e => setBountyAmount(e.target.value)}
                        min={1000}
                        step={500}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                  )}
                  {postBounty && bountyAmount && Number(bountyAmount) < 1000 && (
                    <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>Minimum bounty is NOK 1,000</div>
                  )}
                </div>

              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
                <button onClick={() => setStep(1)} style={ghostBtn}>← Back</button>
                <button
                  onClick={goStep3}
                  disabled={submitting}
                  style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Submitting…' : 'Submit Incident →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,200,100,0.12)', marginBottom: 24 }}>
                <div style={{ fontSize: 40 }}>✓</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, marginBottom: 8 }}>Incident Reported</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--brand)', marginBottom: 8 }}>
                {incidentDisplayId ?? 'Saving…'}
              </div>
              <div style={{ color: 'var(--ink-4)', fontSize: 14, marginBottom: 40 }}>Your report has been securely sealed and submitted to the GraffCloud platform.</div>

              {/* Upload stages */}
              <div style={{ display: 'flex', gap: 0, justifyContent: 'center', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
                {STAGES.map((label, i) => {
                  const done = uploadStage > i; const active = uploadStage === i
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--green)' : active ? 'var(--brand)' : 'var(--line)', transition: 'all 0.4s', fontSize: 16 }}>
                          {done ? '✓' : active ? '⟳' : '○'}
                        </div>
                        <div style={{ fontSize: 11, color: done ? 'var(--green)' : active ? 'var(--brand)' : 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                      </div>
                      {i < STAGES.length - 1 && <div style={{ width: 24, height: 2, background: uploadStage > i ? 'var(--green)' : 'var(--line)', transition: 'background 0.4s', flexShrink: 0, margin: '0 4px' }} />}
                    </div>
                  )
                })}
              </div>

              <div style={{ background: 'rgba(148,0,20,0.05)', border: '1px solid rgba(148,0,20,0.18)', borderRadius: 14, padding: '20px 24px', maxWidth: 400, margin: '0 auto 32px', textAlign: 'left', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 10, right: 12, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-5)', background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>SAMPLE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand)', letterSpacing: '0.1em', marginBottom: 12 }}>AI MATCH — PILOT PREVIEW</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--brand)' }}>K4Z3</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>92% confidence</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>74 prior incidents across 9 cities</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink-5)', lineHeight: 1.5 }}>
                  Crew matching uses sample data during the pilot. Real signature matching activates once your portfolio reaches 25 sealed incidents.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {incidentDisplayId && (
                  <Link href="/intelligence" style={{ ...primaryBtn as React.CSSProperties, textDecoration: 'none' }}>View Trail Map →</Link>
                )}
                <button
                  onClick={() => {
                    setStep(1); setPhotos([]); setProperty(''); setBountyAmount('')
                    setPostBounty(false); setIncidentDisplayId(null)
                  }}
                  style={ghostBtn}
                >
                  Report Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: AI match + evidence seal ── */}
        <div className="gc-upload-right" style={{ width: 320, borderLeft: '1px solid var(--line)', background: 'var(--surface)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: 24 }}>

            {/* AI Matches */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-4)', marginBottom: 14 }}>AI SIGNATURE MATCH</div>
              {AI_MATCHES.map((m, i) => (
                <div key={m.code} onClick={() => setSelectedMatch(i)} style={{
                  padding: '12px 14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                  background: selectedMatch === i ? 'rgba(148,0,20,0.06)' : 'rgba(10,10,10,0.02)',
                  border: `1px solid ${selectedMatch === i ? 'rgba(148,0,20,0.28)' : 'var(--line)'}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: m.color }}>{m.code}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{m.confidence}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6 }}>{m.city}</div>
                  <div style={{ width: '100%', height: 4, background: 'var(--line)', borderRadius: 99 }}>
                    <div style={{ width: `${m.confidence}%`, height: '100%', background: m.color, borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 6 }}>{m.incidents} prior incidents</div>
                </div>
              ))}
            </div>

            {/* Evidence Seal */}
            {step >= 2 && (
              <div style={{ background: 'var(--ink)', borderRadius: 14, padding: 18, color: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ef09a' }} />
                  LIVE EVIDENCE SEAL
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SealRow label="GPS" value={geoError ? 'Permission denied' : `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`} />
                  <SealRow label="Timestamp" value={formatTime(now)} highlight />
                  <SealRow label="Device" value={device.slice(0, 30)} />
                  <SealRow label="Photos" value={`${photos.length} file${photos.length !== 1 ? 's' : ''}`} />
                  <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.08em' }}>SHA-256</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,200,80,0.8)', wordBreak: 'break-all', lineHeight: 1.5 }}>{sealHash}</div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ background: 'rgba(10,10,10,0.04)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500, marginBottom: 6 }}>Evidence Seal</div>
                <div style={{ fontSize: 12, color: 'var(--ink-5)', lineHeight: 1.5 }}>
                  Upload photos to generate a cryptographic evidence seal with GPS, timestamp, and device fingerprint.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 8, letterSpacing: '0.01em' }} dangerouslySetInnerHTML={{ __html: label }} />}
      {children}
    </div>
  )
}

function SealRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: highlight ? '#4ef09a' : 'rgba(255,255,255,0.75)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '13px 28px', background: 'var(--ink)', color: '#fff',
  border: 0, borderRadius: 99, cursor: 'pointer', fontSize: 14, fontWeight: 600,
  fontFamily: 'var(--font-sans)', display: 'inline-flex', alignItems: 'center', gap: 8,
}

const ghostBtn: React.CSSProperties = {
  padding: '11px 20px', background: 'transparent', color: 'var(--ink)',
  border: '1px solid var(--line-2)', borderRadius: 99, cursor: 'pointer', fontSize: 14,
  fontFamily: 'var(--font-sans)', display: 'inline-flex', alignItems: 'center', gap: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'var(--surface)',
  border: '1px solid var(--line-2)', borderRadius: 10, fontSize: 14,
  fontFamily: 'var(--font-sans)', color: 'var(--ink)', outline: 'none',
}
