import { Suspense } from 'react'
import IntakeFlow from './intake-flow'

export const metadata = {
  title: '/date — Apply',
}

export default function ApplyPage() {
  return (
    <Suspense>
      <IntakeFlow />
    </Suspense>
  )
}
