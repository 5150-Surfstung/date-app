import { Suspense } from 'react'
import LandingContent from './landing-content'

export default function Landing() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  )
}
