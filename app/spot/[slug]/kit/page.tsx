import KitClient from './kit-client'

export const metadata = { title: '/date — Spot kit' }

export function generateStaticParams() {
  return [{ slug: 'preview' }]
}
export const dynamicParams = !process.env.STATIC_EXPORT

export default function KitPage({ params }: { params: { slug: string } }) {
  return <KitClient slug={params.slug} />
}
