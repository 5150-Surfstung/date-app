'use client'

// Lock-screen notes from Val. One button: ask permission, subscribe, save.
// iPhone only allows this once /date is on the home screen; the Install
// card above handles that.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'
import { BASE, isStandalone } from './pwa'

const KEY = 'date:push-dismissed'

function toKey(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export default function Notes({ dark }: { dark?: boolean }) {
  const [state, setState] = useState<'hidden' | 'off' | 'on' | 'busy' | 'blocked'>('hidden')

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    if (ios && !isStandalone()) return
    try { if (localStorage.getItem(KEY)) return } catch {}
    if (Notification.permission === 'denied') { setState('blocked'); return }
    navigator.serviceWorker.getRegistration(`${BASE}/`).then((reg) => reg?.pushManager.getSubscription()).then((sub) => setState(sub ? 'on' : 'off')).catch(() => setState('off'))
  }, [])

  async function turnOn() {
    setState('busy')
    try {
      const c = authClient()
      if (!c) throw new Error('no client')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState('blocked'); return }
      const reg = await navigator.serviceWorker.ready
      const { data: key } = await c.rpc('date_push_key')
      if (!key) throw new Error('no key')
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) })
      const j = sub.toJSON()
      const { data } = await c.rpc('date_save_push', { p_endpoint: sub.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth, p_ua: navigator.userAgent })
      if (data !== 'ok') throw new Error(String(data))
      setState('on')
    } catch {
      setState('off')
    }
  }

  if (state === 'hidden' || state === 'blocked' || state === 'on') return null
  const box = dark ? 'bg-[#141414] text-white' : 'bg-white text-ob'
  const sub = dark ? 'text-white/60' : 'text-ob/70'
  return (
    <div className={`${box} rounded-3xl p-5 flex items-start gap-4 max-w-md`}>
      <div className="w-12 h-12 rounded-2xl bg-ob text-white grid place-items-center shrink-0" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-extrabold text-lg leading-tight">Notes from Val, on your lock screen.</div>
        <p className={`text-sm mt-1 ${sub}`}>A /hey, a yes, a check-in. Nothing else, ever.</p>
        <div className="flex gap-3 mt-3">
          <button onClick={turnOn} disabled={state === 'busy'} className="bg-ob text-white rounded-full px-5 py-2.5 text-sm font-extrabold disabled:opacity-50">{state === 'busy' ? 'One sec…' : 'Turn on'}</button>
          <button onClick={() => { try { localStorage.setItem(KEY, '1') } catch {}; setState('hidden') }} className={`text-sm font-semibold ${sub} px-2 py-2.5`}>Not now</button>
        </div>
      </div>
    </div>
  )
}
