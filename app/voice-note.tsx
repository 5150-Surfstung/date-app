'use client'

// A ten-second voice note. Tap to record, tap to stop (or it stops at 10s),
// listen back, keep or redo. iPhone records mp4, everything else webm.
import { useEffect, useRef, useState } from 'react'
import { authClient } from '@/lib/auth'

const MAX = 10

export function VoiceNote({ onChange }: { onChange: (b: Blob | null) => void }) {
  const [state, setState] = useState<'idle' | 'rec' | 'done' | 'denied'>('idle')
  const [secs, setSecs] = useState(0)
  const [url, setUrl] = useState<string | null>(null)
  const rec = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); rec.current?.stream.getTracks().forEach((t) => t.stop()) }, [])

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported?.(t)) ?? ''
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
      const chunks: Blob[] = []
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' })
        setUrl(URL.createObjectURL(blob)); onChange(blob); setState('done')
      }
      rec.current = r; r.start(); setState('rec'); setSecs(0)
      timer.current = setInterval(() => setSecs((s) => { if (s + 1 >= MAX) stop(); return s + 1 }), 1000)
    } catch { setState('denied') }
  }
  function stop() {
    if (timer.current) { clearInterval(timer.current); timer.current = null }
    if (rec.current?.state === 'recording') rec.current.stop()
  }
  function redo() { setUrl(null); onChange(null); setState('idle') }

  if (state === 'denied') return <p className="text-sm text-ob font-semibold">Microphone is off for /date. Turn it on in your phone&rsquo;s settings to send a voice note.</p>
  if (state === 'done' && url) return (
    <div className="flex items-center gap-2">
      <audio src={url} controls className="flex-1 min-w-0 h-10" />
      <button type="button" onClick={redo} className="rounded-full px-3 py-2 text-sm font-semibold">Redo</button>
    </div>
  )
  return (
    <button type="button" onClick={state === 'rec' ? stop : start}
      className={`w-full rounded-full px-4 py-3 text-sm font-extrabold flex items-center justify-center gap-2 ${state === 'rec' ? 'bg-[#141414] text-white' : 'border-2 border-[#141414]'}`}>
      <span className={`w-2.5 h-2.5 rounded-full bg-ob ${state === 'rec' ? 'live-dot' : ''}`} />
      {state === 'rec' ? `Recording… ${MAX - secs}s · tap to stop` : 'Say it instead (10 seconds)'}
    </button>
  )
}

/** Uploads a voice /hey into the sender's own folder; returns its storage key. */
export async function uploadVoiceHey(blob: Blob): Promise<string | null> {
  const c = authClient()
  const { data: { user } } = await c!.auth.getUser()
  if (!user) return null
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'
  const key = `${user.id}/hey-${Date.now()}.${ext}`
  const { error } = await c!.storage.from('date-intake').upload(key, blob, { contentType: blob.type || 'audio/webm', upsert: false })
  return error ? null : key
}
