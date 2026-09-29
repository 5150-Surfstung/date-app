'use client'

// "I'm here." Members check in by location from the app, or by the /date QR on
// a spot's window (the QR carries that spot's door key). Location is only ever
// read when someone taps, or when they've already allowed it; never in the background.
import { authClient } from './auth'

export type Fix = { lat: number; lng: number; acc: number }
export type Near = { slug: string; name: string; area: string | null; m: number }

/** One location reading, or null if it's off, denied or slow. */
export function getFix(timeout = 10000): Promise<Fix | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null)
  return new Promise((done) => {
    navigator.geolocation.getCurrentPosition(
      (p) => done({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      () => done(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    )
  })
}

/** True only if the member already said yes to location, so asking won't pop a prompt. */
export async function locationAllowed(): Promise<boolean> {
  try {
    const s = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
    return s?.state === 'granted'
  } catch {
    return false
  }
}

/** The door key from a window-QR link (?k=), if the member arrived that way. */
export function doorKey(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('k')
}

export async function spotsNear(fix: Fix): Promise<{ state: 'near' | 'none' | 'fuzzy'; spots: Near[] }> {
  const { data } = await authClient()!.rpc('spots_near', { p_lat: fix.lat, p_lng: fix.lng, p_acc: fix.acc })
  return (data as { state: 'near' | 'none' | 'fuzzy'; spots: Near[] }) ?? { state: 'none', spots: [] }
}

export type CheckIn = 'ok' | 'far' | 'fuzzy' | 'no_pin' | 'no_location' | 'login' | 'limit' | 'bad'

/** Check in at a spot: the window QR's key if we have it, otherwise location. */
export async function checkIn(slug: string, opts: { fix?: Fix | null; note?: string } = {}): Promise<CheckIn> {
  const key = doorKey()
  // With a door key, a location reading is a bonus (it helps Val keep the pin
  // right), so only take one if it won't prompt.
  const fix = opts.fix !== undefined ? opts.fix : key ? ((await locationAllowed()) ? await getFix(5000) : null) : await getFix()
  if (!key && !fix) return 'no_location'
  const { data, error } = await authClient()!.rpc('check_in', {
    p_spot: slug, p_lat: fix?.lat ?? null, p_lng: fix?.lng ?? null, p_acc: fix?.acc ?? null, p_key: key, p_note: opts.note ?? null,
  })
  if (error) return 'bad'
  return (data === 'where' ? 'no_location' : data) as CheckIn
}

export async function checkOut(slug: string) {
  await authClient()!.rpc('check_out', { p_spot: slug })
}

export const CHECKIN_SAYS: Record<Exclude<CheckIn, 'ok'>, string> = {
  far: 'Your phone says you’re not there yet. Try again inside, or scan the /date QR on the window.',
  fuzzy: 'Your location’s too fuzzy right now. Try again in a sec, or scan the /date QR on the window.',
  no_pin: 'Scan the /date QR on the window to check in here.',
  no_location: 'Location is off. Turn it on for /date, or scan the /date QR on the window.',
  login: 'Log in first.',
  limit: 'Easy. Try again in a bit.',
  bad: 'Something went wrong. Try again.',
}
