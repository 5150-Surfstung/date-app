import { notFound } from 'next/navigation'
import { VENUES, getVenue } from '@/lib/venues'
import NightClient from './night-client'

export function generateStaticParams() {
  return VENUES.map((v) => ({ slug: v.slug }))
}
export const dynamicParams = false

export default function NightPage({ params }: { params: { slug: string } }) {
  const venue = getVenue(params.slug)
  if (!venue) notFound()
  return <NightClient venue={venue} />
}
