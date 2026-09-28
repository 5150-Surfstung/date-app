'use client'

// "Put /date on your phone." Android gets the real install prompt; iPhone
// gets the two-tap instruction. Hidden once installed or dismissed.
import { useEffect, useState } from 'react'
import { isStandalone } from './pwa'

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
const KEY = 'date:install-dismissed'

export default function Install({ dark }: { dark?: boolean }) {
  const [evt, setEvt] = useState<BeforeInstall | null>(null)
  const [ios, setIos] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    try { if (localStorage.getItem(KEY)) return } catch {}
    const ua = navigator.userAgent
    const isIos = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua)
    setIos(isIos)
    if (isIos) setShow(true)
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstall); setShow(true) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setShow(false))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!show) return null
  const dismiss = () => { try { localStorage.setItem(KEY, '1') } catch {}; setShow(false) }
  const install = async () => {
    if (!evt) return
    await evt.prompt()
    const { outcome } = await evt.userChoice
    if (outcome === 'accepted') setShow(false)
  }
  const box = dark ? 'bg-[#141414] text-white' : 'bg-white text-ob'
  const sub = dark ? 'text-white/60' : 'text-ob/70'

  return (
    <div className={`${box} rounded-3xl p-5 flex items-start gap-4 max-w-md`}>
      <div className="w-12 h-12 rounded-2xl bg-ob text-white font-display font-extrabold text-2xl grid place-items-center shrink-0">/</div>
      <div className="min-w-0 flex-1">
        <div className="font-extrabold text-lg leading-tight">Put /date on your phone.</div>
        <p className={`text-sm mt-1 ${sub}`}>
          {ios
            ? <>Tap <span className="font-bold">Share</span>, then <span className="font-bold">Add to Home Screen</span>. Your /heys land on your lock screen.</>
            : <>One tap. Your /heys land on your lock screen.</>}
        </p>
        <div className="flex gap-3 mt-3">
          {!ios && evt && <button onClick={install} className="bg-ob text-white rounded-full px-5 py-2.5 text-sm font-extrabold">Add /date</button>}
          <button onClick={dismiss} className={`text-sm font-semibold ${sub} px-2 py-2.5`}>Not now</button>
        </div>
      </div>
    </div>
  )
}
