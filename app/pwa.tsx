'use client'

// Registers the service worker and swaps in new versions quietly.
import { useEffect } from 'react'

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

export default function Pwa() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (location.hostname === 'localhost' && !location.search.includes('sw=1')) return
    let refreshed = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return
      refreshed = true
      location.reload()
    })
    navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).then((reg) => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) w.postMessage('skip-waiting')
        })
      })
    }).catch(() => {})
  }, [])
  return null
}
