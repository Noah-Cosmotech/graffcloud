import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type PropertyRow = Database['public']['Tables']['properties']['Row']
type IncidentRow = Database['public']['Tables']['incidents']['Row']

const BUCKET = 'incidents'
const MAX_PHOTOS = 12
const MAX_PHOTO_BYTES = 10 * 1024 * 1024 // 10 MB

function inferCity(address: string): string {
  const parts = address.split(',').map(s => s.trim()).filter(Boolean)
  return parts.length >= 2 ? parts[parts.length - 1] : 'Oslo'
}

function displayId(uuid: string): string {
  return 'INC-' + uuid.split('-')[0].toUpperCase()
}

// Escape Postgres ILIKE metacharacters so a user-typed address can't act as a
// wildcard pattern (e.g. "Storgata %" matching an unrelated property).
function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, m => '\\' + m)
}

// Never trust the client-supplied MIME type. Sniff the leading bytes and return
// a safe, server-decided content type — or null to reject. This closes the
// stored-XSS hole from image/svg+xml being served inline from the public bucket.
function sniffImageType(bytes: Uint8Array): string | null {
  const b = bytes
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11])
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].includes(brand)) {
      return 'image/heic'
    }
  }
  return null
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/heic': 'heic',
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
  const rawDate = (form.get('date') as string | null) ?? ''
  const date = rawDate.slice(0, 10) || new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }
  const costRaw = form.get('cost') as string | null
  const cost = costRaw ? Math.max(0, Number(costRaw)) : 0
  const lat = form.get('lat') ? Number(form.get('lat')) : null
  const lon = form.get('lon') ? Number(form.get('lon')) : null
  const geoValid = form.get('geoValid') === '1'
  const hash = (form.get('hash') as string | null) ?? null
  const surface = (form.get('surface') as string | null)?.slice(0, 40) ?? null
  const cctv = form.get('cctv') === '1'
  const bountyRaw = form.get('bountyAmount') as string | null
  const bountyAmount = bountyRaw ? Number(bountyRaw) : null

  if (!address) {
    return NextResponse.json({ error: 'Property address is required' }, { status: 400 })
  }
  if (photos.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `A maximum of ${MAX_PHOTOS} photos per report is allowed` }, { status: 400 })
  }
  for (const photo of photos) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Each photo must be 10 MB or smaller' }, { status: 400 })
    }
  }

  // Upsert property — find by exact address (case-insensitive, wildcards escaped)
  // or create new.
  const city = inferCity(address)
  let propertyId: string

  const existingRes = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', user.id)
    .ilike('address', escapeLike(address))
    .limit(1)
    .maybeSingle() as { data: Pick<PropertyRow, 'id'> | null; error: { message: string } | null }

  if (existingRes.error) {
    console.error('property lookup failed:', existingRes.error.message)
    return NextResponse.json({ error: 'Could not look up property' }, { status: 500 })
  }

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
      console.error('property create failed:', createdRes.error?.message)
      return NextResponse.json({ error: 'Could not create property' }, { status: 500 })
    }
    propertyId = createdRes.data.id
  }

  // Upload photos via service-role admin client (bypasses storage RLS)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Evidence photos are PRIVATE — create/enforce a non-public bucket so crime-scene
  // images aren't world-readable. We store storage paths (not public URLs) on the
  // incident; a viewer generates short-lived signed URLs gated by ownership.
  await admin.storage.createBucket(BUCKET, { public: false }).catch(() => {})
  await admin.storage.updateBucket(BUCKET, { public: false }).catch(() => {})

  // Validate + sniff each photo (reads bytes once), then upload in parallel.
  const prepared: { path: string; bytes: Uint8Array; type: string }[] = []
  let rejectedPhotos = 0
  for (const photo of photos) {
    const bytes = new Uint8Array(await photo.arrayBuffer())
    const safeType = sniffImageType(bytes)
    if (!safeType) { rejectedPhotos++; continue } // not a recognised raster image — reject
    const ext = EXT_BY_MIME[safeType] ?? 'jpg'
    prepared.push({
      path: `${user.id}/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
      bytes,
      type: safeType,
    })
  }

  const uploadResults = await Promise.all(prepared.map(async p => {
    const { error } = await admin.storage.from(BUCKET).upload(p.path, p.bytes, { contentType: p.type, upsert: false })
    if (error) { console.error('photo upload failed:', error.message); return null }
    return p.path
  }))
  const photoPaths = uploadResults.filter((x): x is string => x !== null)

  // Insert incident record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incidentRes = await (supabase.from('incidents') as any)
    .insert({
      property_id: propertyId,
      reported_by: user.id,
      date,
      cost_nok: cost,
      status: 'new',
      photo_urls: photoPaths,
      gps_lat: geoValid && lat !== null ? lat : null,
      gps_lng: geoValid && lon !== null ? lon : null,
      evidence_hash: hash,
      surface,
      cctv,
    })
    .select('id')
    .single() as { data: Pick<IncidentRow, 'id'> | null; error: { message: string } | null }

  if (incidentRes.error || !incidentRes.data) {
    console.error('incident insert failed:', incidentRes.error?.message)
    // Roll back orphaned storage objects so a failed insert leaves no files behind
    if (photoPaths.length > 0) {
      await admin.storage.from(BUCKET).remove(photoPaths).catch(() => {})
    }
    return NextResponse.json({ error: 'Could not save incident' }, { status: 500 })
  }
  const incidentId = incidentRes.data.id

  // Optionally insert bounty — surface failures instead of silently swallowing
  let bountyPosted = false
  if (bountyAmount && Number.isFinite(bountyAmount) && bountyAmount >= 1000) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bountyRes = await (supabase.from('bounties') as any).insert({
      incident_id: incidentId,
      amount_nok: bountyAmount,
      status: 'open',
      posted_by: user.id,
      city,
    }) as { error: { message: string } | null }
    if (bountyRes.error) {
      console.error('bounty insert failed:', bountyRes.error.message)
    } else {
      bountyPosted = true
    }
  }

  return NextResponse.json({
    incidentId,
    displayId: displayId(incidentId),
    propertyId,
    photoCount: photoPaths.length,
    rejectedPhotos,
    bountyPosted,
  })
}
