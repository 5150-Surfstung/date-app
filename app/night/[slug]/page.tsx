import NightLoader from './night-loader'

export function generateStaticParams() {
  return [{ slug: 'preview' }]
}
export const dynamicParams = !process.env.STATIC_EXPORT

export default function NightPage({ params }: { params: { slug: string } }) {
  return <NightLoader slug={params.slug} />
}
