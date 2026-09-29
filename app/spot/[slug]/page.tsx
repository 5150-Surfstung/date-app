import SpotLoader from './spot-loader'

// /spot/<slug>: what a spot's QR opens. Spots live in the database and only
// approved ones load; on Vercel any slug renders on demand.
export function generateStaticParams() {
  return [{ slug: 'preview' }]
}
export const dynamicParams = !process.env.STATIC_EXPORT

export default function SpotPage({ params }: { params: { slug: string } }) {
  return <SpotLoader slug={params.slug} />
}
