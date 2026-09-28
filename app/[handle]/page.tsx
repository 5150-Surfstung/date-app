import { Suspense } from 'react'
import AtClient from '../at/at-client'
import { DEMO_CREW } from '@/lib/demo'

// /maya — the /hey page for a /name. On Vercel any handle renders on
// demand; the static export pre-renders the demo crew only.
export function generateStaticParams() {
  return DEMO_CREW.map((d) => ({ handle: d.handle }))
}

export const dynamicParams = !process.env.STATIC_EXPORT

export default function HandlePage({ params }: { params: { handle: string } }) {
  return (
    <Suspense>
      <AtClient handle={params.handle} />
    </Suspense>
  )
}
