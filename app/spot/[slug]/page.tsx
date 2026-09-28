import { notFound } from 'next/navigation'
import { VENUES, getVenue } from '@/lib/venues'
import SpotClient from './spot-client'

export function generateStaticParams() {
  return VENUES.map((v) => ({ slug: v.slug }))
}

export const dynamicParams = false

export default function SpotPage({ params }: { params: { slug: string } }) {
  const venue = getVenue(params.slug)
  if (!venue) notFound()
  return <SpotClient venue={venue} />
}
