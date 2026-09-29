'use client'

// /date spots live in the database now. Venues apply (or a rep sends them),
// Val approves every one, and only approved spots are ever public.
import { useEffect, useState } from 'react'
import { rpc } from './rest'

export type Venue = {
  slug: string
  name: string
  area: string | null
  kind: string | null
  perk: string | null
  about?: string | null
  address?: string | null
  hours?: string | null
  phone?: string | null
  website?: string | null
  instagram?: string | null
  tiktok?: string | null
  photo?: string | null
  lat?: number | null
  lng?: number | null
  // Next /night at this spot, if one is scheduled.
  night?: { when: string; detail: string } | null
}

export const SPOT_KINDS: [string, string][] = [
  ['bar', 'Bar'], ['coffee', 'Coffee shop'], ['restaurant', 'Restaurant'], ['gym', 'Gym or fitness'],
  ['studio', 'Studio or class'], ['bookstore', 'Bookstore'], ['outdoor', 'Outdoor or park'], ['other', 'Something else'],
]

let cache: Venue[] | null = null
let pending: Promise<Venue[]> | null = null

/** Every approved spot. Cached for the page's life. */
export function fetchSpots(): Promise<Venue[]> {
  if (cache) return Promise.resolve(cache)
  if (!pending) pending = rpc<Venue[]>('public_spots').then(({ data }) => (cache = data ?? []))
  return pending
}

/** One approved spot, or null if it isn't one (yet). */
export async function fetchSpot(slug: string): Promise<Venue | null> {
  const { data } = await rpc<Venue | null>('public_spot', { p_slug: slug })
  return data ?? null
}

/** Approved spots; null while loading. */
export function useSpots(): Venue[] | null {
  const [spots, setSpots] = useState<Venue[] | null>(cache)
  useEffect(() => { if (!cache) fetchSpots().then(setSpots) }, [])
  return spots
}

/** One spot by slug; undefined while loading, null if it isn't approved. */
export function useSpot(slug: string | null | undefined): Venue | null | undefined {
  const [spot, setSpot] = useState<Venue | null | undefined>(slug ? undefined : null)
  useEffect(() => {
    if (!slug) { setSpot(null); return }
    let live = true
    fetchSpot(slug).then((s) => { if (live) setSpot(s) })
    return () => { live = false }
  }, [slug])
  return spot
}

/** Google Maps directions to a spot: its name and address finds the real listing. */
export function directionsUrl(v: Venue): string | null {
  const dest = v.address ? `${v.name}, ${v.address}` : v.lat != null && v.lng != null ? `${v.lat},${v.lng}` : null
  return dest ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}` : null
}

export const siteUrl = (w: string) => (/^https?:\/\//i.test(w) ? w : `https://${w}`)
