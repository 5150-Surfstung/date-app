import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const MAX_VOICE_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const basicsRaw = form.get('basics')
  const answersRaw = form.get('answers')
  if (typeof basicsRaw !== 'string' || typeof answersRaw !== 'string') {
    return NextResponse.json({ error: 'Missing profile data' }, { status: 400 })
  }

  let basics: Record<string, string>
  let answers: Record<string, string>
  try {
    basics = JSON.parse(basicsRaw)
    answers = JSON.parse(answersRaw)
  } catch {
    return NextResponse.json({ error: 'Malformed profile data' }, { status: 400 })
  }

  if (!basics.name?.trim() || !/.+@.+\..+/.test(basics.email ?? '')) {
    return NextResponse.json({ error: 'Name and a valid email are required' }, { status: 400 })
  }
  if (Number(basics.age) < 18) {
    return NextResponse.json({ error: '/date is for adults — 18 and over' }, { status: 400 })
  }

  const venue = typeof form.get('venue') === 'string' ? (form.get('venue') as string) : null
  const photos = form.getAll('photos').filter((p): p is File => p instanceof File)
  const voice = form.get('voice')
  const voiceFile = voice instanceof File ? voice : null

  for (const p of photos) {
    if (p.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: `Photo ${p.name} is over 10MB` }, { status: 400 })
    }
  }
  if (voiceFile && voiceFile.size > MAX_VOICE_BYTES) {
    return NextResponse.json({ error: 'Voice note is too large' }, { status: 400 })
  }

  const id = randomUUID()
  const record = {
    id,
    created_at: new Date().toISOString(),
    venue_slug: venue,
    name: basics.name.trim(),
    age: Number(basics.age),
    email: basics.email.trim().toLowerCase(),
    phone: basics.phone?.trim() || null,
    neighborhood: basics.neighborhood?.trim() || null,
    identity: basics.identity,
    seeking: basics.seeking,
    answers,
    photo_count: photos.length,
    has_voice_note: Boolean(voiceFile),
    status: 'pending_review',
  }

  const supabase = getSupabase()

  if (supabase) {
    const uploads: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i]
      const ext = (p.name.split('.').pop() || 'jpg').toLowerCase()
      const key = `${id}/photo-${i}.${ext}`
      const { error } = await supabase.storage
        .from('intake')
        .upload(key, await p.arrayBuffer(), { contentType: p.type })
      if (error) {
        return NextResponse.json({ error: 'Photo upload failed' }, { status: 502 })
      }
      uploads.push(key)
    }

    let voiceKey: string | null = null
    if (voiceFile) {
      voiceKey = `${id}/voice-note.webm`
      const { error } = await supabase.storage
        .from('intake')
        .upload(voiceKey, await voiceFile.arrayBuffer(), { contentType: voiceFile.type })
      if (error) {
        return NextResponse.json({ error: 'Voice upload failed' }, { status: 502 })
      }
    }

    const { error } = await supabase.from('applications').insert({
      ...record,
      photo_keys: uploads,
      voice_key: voiceKey,
    })
    if (error) {
      // Duplicate email lands here via the unique constraint.
      const duplicate = error.code === '23505'
      return NextResponse.json(
        { error: duplicate ? 'This email has already applied' : 'Could not save application' },
        { status: duplicate ? 409 : 502 }
      )
    }
    return NextResponse.json({ ok: true, id })
  }

  // Dev fallback: write everything under .data/ (gitignored).
  const dir = path.join(process.cwd(), '.data', 'applications', id)
  await mkdir(dir, { recursive: true })
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    const ext = (p.name.split('.').pop() || 'jpg').toLowerCase()
    await writeFile(path.join(dir, `photo-${i}.${ext}`), Buffer.from(await p.arrayBuffer()))
  }
  if (voiceFile) {
    await writeFile(path.join(dir, 'voice-note.webm'), Buffer.from(await voiceFile.arrayBuffer()))
  }
  await writeFile(path.join(dir, 'application.json'), JSON.stringify(record, null, 2))

  return NextResponse.json({ ok: true, id, storage: 'local' })
}
