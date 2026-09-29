'use client'

// Registers the service worker and swaps in new versions quietly.
import { useEffect } from 'react'

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

// Every crash on a member's phone lands in the console's Health tab.
function useErrorLog() {
  useEffect(() => {
    const seen = new Set<string>()
    const log = (message: string, stack?: string) => {
      if (!message || seen.has(message) || seen.size >= 5) return
      seen.add(message)
      import('@/lib/auth').then(({ authClient }) => authClient()?.rpc('date_log_error', {
        p_message: message, p_stack: stack ?? null, p_url: location.pathname + location.search, p_ua: navigator.userAgent,
      })).catch(() => {})
    }
    const onErr = (e: ErrorEvent) => log(e.message, e.error?.stack)
    const onRej = (e: PromiseRejectionEvent) => log(String(e.reason?.message ?? e.reason ?? 'unhandled rejection'), e.reason?.stack)
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    return () => { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onRej) }
  }, [])
}

export default function Pwa() {
  useErrorLog()
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
