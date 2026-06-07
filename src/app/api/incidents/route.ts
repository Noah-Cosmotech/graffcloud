import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type PropertyRow = Database['public']['Tables']['properties']['Row']
type IncidentRow = Database['public']['Tables']['incidents']['Row']

const BUCKET = 'incidents'

function inferCity(address: string): string {
  const parts = address.split(',').map(s => s.trim()).filter(Boolean)
  return parts.length >= 2 ? parts[parts.length - 1] : 'Oslo'
}

function displayId(uuid: string): string {
  return 'INC-' + uuid.split('-')[0].toUpperCase()
}

export async function POST(request: NextRequest) {
  // Authenticate via session cookie
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Parse multipart form data
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const photos = form.getAll('photos') as File[]
  const address = (form.get('property') as string | null)?.trim() ?? ''
  const date = (form.get('date') as string | null)?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  const costRaw = form.get('cost') as string | null
  const cost = costRaw ? Math.max(0, Number(costRaw)) : 0
  const lat = form.get('lat') ? Number(form.get('lat')) : null
  const lon = form.get('lon') ? Number(form.get('lon')) : null
  const geoValid = form.get('geoValid') === '1'
  const hash = (form.get('hash') as string | null) ?? null
  const bountyRaw = form.get('bountyAmount') as string | null
  const bountyAmount = bountyRaw ? Number(bountyRaw) : null

  if (!address) {
    return NextResponse.json({ error: 'Property address is required' }, { status: 400 })
  }

  // Upsert property — find by address (case-insensitive) or create new
  const city = inferCity(address)
  let propertyId: string

  const existingRes = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', user.id)
    .ilike('address', address)
    .maybeSingle() as { data: Pick<PropertyRow, 'id'> | null; error: unknown }

  if (existingRes.data) {
    propertyId = existingRes.data.id
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdRes = await (supabase.from('properties') as any)
      .insert({
        owner_id: user.id,
        name: address,
        address,
        city,
        type: 'commercial',
        readiness_score: 50,
      })
      .select('id')
      .single() as { data: Pick<PropertyRow, 'id'> | null; error: { message: string } | null }

    if (createdRes.error || !createdRes.data) {
      return NextResponse.json({ error: createdRes.error?.message ?? 'Could not create property' }, { status: 500 })
    }
    propertyId = createdRes.data.id
  }

  // Upload photos via service-role admin client (bypasses storage RLS)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create public bucket on first use (no-op if already exists)
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const photoUrls: string[] = []
  for (const photo of photos) {
    if (!photo.type.startsWith('image/')) continue
    const ext = photo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${user.id}/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await photo.arrayBuffer()
    const { error: storageErr } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: photo.type, upsert: false })
    if (!storageErr) {
      const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
      photoUrls.push(publicUrl)
    }
  }

  // Insert incident record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incidentRes = await (supabase.from('incidents') as any)
    .insert({
      property_id: propertyId,
      reported_by: user.id,
      date,
      cost_nok: cost,
      status: 'new',
      photo_urls: photoUrls,
      gps_lat: geoValid && lat !== null ? lat : null,
      gps_lng: geoValid && lon !== null ? lon : null,
      evidence_hash: hash,
    })
    .select('id')
    .single() as { data: Pick<IncidentRow, 'id'> | null; error: { message: string } | null }

  if (incidentRes.error || !incidentRes.data) {
    return NextResponse.json({ error: incidentRes.error?.message ?? 'Could not save incident' }, { status: 500 })
  }
  const incidentId = incidentRes.data.id

  // Optionally insert bounty
  if (bountyAmount && bountyAmount >= 1000) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('bounties') as any).insert({
      incident_id: incidentId,
      amount_nok: bountyAmount,
      status: 'open',
      posted_by: user.id,
      city,
    })
  }

  return NextResponse.json({
    incidentId,
    displayId: displayId(incidentId),
    propertyId,
    photoCount: photoUrls.length,
  })
}
