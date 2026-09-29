'use client'

// "You're in" moment: get Val's notes on the lock screen. Free, instant, and
// it keeps email (which costs money) for the things that must land.
import { useEffect, useState } from 'react'
import Install from './install'
import Notes from './push'
import { BASE, isStandalone } from './pwa'

export default function LockScreen() {
  const [need, setNeed] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    if (ios && !isStandalone()) { setNeed(true); return }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return
    if (Notification.permission === 'denied') return
    navigator.serviceWorker.getRegistration(`${BASE}/`)
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setNeed(!sub))
      .catch(() => setNeed(true))
  }, [])
  if (!need) return null
  return (
    <section className="mb-8 rounded-[28px] bg-ob text-white p-5 sm:p-6">
      <div className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight">Don&rsquo;t miss a /hey.</div>
      <p className="mt-1 text-white/85">When someone sends you a vibe or says yes, Val tells your lock screen, the second it happens.</p>
      <div className="mt-4 grid gap-3">
        <Install dark />
        <Notes dark />
      </div>
    </section>
  )
}
