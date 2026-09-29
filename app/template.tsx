'use client'

// Every page but the homepage (which runs its own scenes) comes in with a short,
// staggered rise. Pure CSS; see .enter in globals.css.
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  if (path === '/' || path === '') return <>{children}</>
  return <div className="enter">{children}</div>
}
