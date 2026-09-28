import { Suspense } from 'react'
import AtClient from './at-client'

export const metadata = { title: '/date — Send a /hey' }

export default function AtPage() {
  return (
    <Suspense>
      <AtClient />
    </Suspense>
  )
}
