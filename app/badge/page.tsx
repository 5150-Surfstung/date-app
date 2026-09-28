import { Suspense } from 'react'
import BadgeClient from './badge-client'

export const metadata = { title: '/date — Your badge' }

export default function BadgePage() {
  return (
    <Suspense>
      <BadgeClient />
    </Suspense>
  )
}
