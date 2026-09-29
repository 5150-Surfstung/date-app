'use client'

// Story-sized share cards (1080×1920). "My vibe tonight: /tacos" with a QR to
// your /name, or "Someone sent me /tacos" (never who). Straight into the phone's
// share sheet (Instagram Stories included); a download everywhere else.
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { heyUrl, siteUrl } from '@/lib/handles'
import { vibeFor } from '@/lib/vibes'

type Kind = 'mine' | 'got' | 'couple'
export type Couple = { a: string; b: string; spot?: string | null }
const W = 1080, H = 1920

async function draw(canvas: HTMLCanvasElement, vibe: string, handle: string | null, kind: Kind, couple?: Couple) {
  const t = vibeFor(kind === 'couple' ? 'looking' : vibe)
  const ctx = canvas.getContext('2d')!
  canvas.width = W; canvas.height = H
  // The site's display face, whatever name next/font gave it.
  const probe = document.createElement('span'); probe.className = 'font-display'; document.body.appendChild(probe)
  const face = getComputedStyle(probe).fontFamily || 'system-ui, sans-serif'; probe.remove()
  await document.fonts.ready

  ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H)
  // A giant faint slash for texture.
  ctx.fillStyle = t.fg; ctx.globalAlpha = 0.06
  ctx.font = `800 1500px ${face}`; ctx.textBaseline = 'middle'; ctx.fillText('/', 380, 900); ctx.globalAlpha = 1

  ctx.fillStyle = t.fg; ctx.textBaseline = 'alphabetic'
  ctx.font = `800 88px ${face}`; ctx.fillText('/date', 90, 190)

  ctx.globalAlpha = 0.7; ctx.font = `700 46px ${face}`
  ctx.fillText((kind === 'couple' ? 'WE MET ON /DATE' : kind === 'got' ? 'SOMEONE SENT ME' : 'MY VIBE TONIGHT').split('').join(' '), 90, 720)
  ctx.globalAlpha = 1

  if (kind === 'couple' && couple) {
    // Two /names, stacked, as big as they fit.
    const lines = [`/${couple.a}`, `+ /${couple.b}`]
    let cs = 230
    do { ctx.font = `800 ${cs}px ${face}`; cs -= 8 } while (Math.max(...lines.map((l) => ctx.measureText(l).width)) > W - 180 && cs > 80)
    ctx.fillStyle = t.fg
    ctx.fillText(lines[0], 84, 720 + cs + 30)
    ctx.fillText(lines[1], 84, 720 + cs * 2 + 50)
    ctx.globalAlpha = 0.85; ctx.font = `600 50px ${face}`
    ctx.fillText(couple.spot ? `first date at ${couple.spot}` : 'Val introduced us.', 90, 720 + cs * 2 + 160)
    ctx.globalAlpha = 1
    const qrC = await QRCode.toDataURL(`${siteUrl()}/couples/`, { width: 360, margin: 1, color: { dark: '#141414', light: '#FFFFFF' } })
    const im = new Image(); im.src = qrC; await im.decode()
    const qx = 90, qy = H - 560, qs = 400
    ctx.fillStyle = '#FFFFFF'; roundRect(ctx, qx, qy, qs, qs, 36); ctx.fill()
    ctx.drawImage(im, qx + 20, qy + 20, qs - 40, qs - 40)
    ctx.fillStyle = t.fg; ctx.font = `800 56px ${face}`
    ctx.fillText('Your turn.', qx + qs + 50, qy + 150)
    ctx.globalAlpha = 0.75; ctx.font = `600 40px ${face}`
    wrap(ctx, 'Scan to meet Val, your matchmaker.', qx + qs + 50, qy + 220, W - (qx + qs + 50) - 70, 52)
    ctx.globalAlpha = 1
    return
  }

  // The word, as big as it fits.
  const word = `/${vibe}`
  let size = 300
  do { ctx.font = `800 ${size}px ${face}`; size -= 8 } while (ctx.measureText(word).width > W - 180 && size > 90)
  ctx.fillStyle = t.bg === '#FFF3EA' ? '#FF3B2F' : t.fg
  ctx.fillText(word, 84, 720 + size + 40)

  ctx.fillStyle = t.fg; ctx.globalAlpha = 0.85; ctx.font = `600 50px ${face}`
  ctx.fillText(`say it out loud: “slash ${vibe}”`, 90, 720 + size + 150)
  ctx.globalAlpha = 1

  // QR to your /name (or to /date), on a white card.
  const target = handle ? heyUrl(handle) : `${siteUrl()}/claim/`
  const qr = await QRCode.toDataURL(target, { width: 360, margin: 1, color: { dark: '#141414', light: '#FFFFFF' } })
  const img = new Image(); img.src = qr; await img.decode()
  const qx = 90, qy = H - 560, qs = 400
  ctx.fillStyle = '#FFFFFF'; roundRect(ctx, qx, qy, qs, qs, 36); ctx.fill()
  ctx.drawImage(img, qx + 20, qy + 20, qs - 40, qs - 40)
  ctx.fillStyle = t.fg; ctx.font = `800 60px ${face}`
  ctx.fillText(handle ? `/${handle}` : 'Get your /name', qx + qs + 50, qy + 150)
  ctx.globalAlpha = 0.75; ctx.font = `600 40px ${face}`
  wrap(ctx, handle ? 'Scan to send me a /hey on /date.' : 'Scan to join /date, Charleston.', qx + qs + 50, qy + 220, W - (qx + qs + 50) - 70, 52)
  ctx.globalAlpha = 1
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  let line = ''
  for (const w of text.split(' ')) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > max && line) { ctx.fillText(line, x, y); line = w; y += lh } else line = test
  }
  if (line) ctx.fillText(line, x, y)
}

export function ShareButton({ vibe, handle, kind = 'mine', label, className, couple }: { vibe: string; handle: string | null; kind?: Kind; label?: string; className?: string; couple?: Couple }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? 'rounded-full border-2 border-current px-5 py-2.5 text-sm font-extrabold'}>
        {label ?? (kind === 'got' ? 'Share it' : 'Share my vibe')}
      </button>
      {open && <ShareSheet vibe={vibe} handle={handle} kind={kind} couple={couple} onClose={() => setOpen(false)} />}
    </>
  )
}

function ShareSheet({ vibe, handle, kind, couple, onClose }: { vibe: string; handle: string | null; kind: Kind; couple?: Couple; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    draw(c, vibe, handle, kind, couple).then(() => c.toBlob((b) => setBlob(b), 'image/png'))
  }, [vibe, handle, kind, couple])

  const file = blob ? new File([blob], `date-${vibe}.png`, { type: 'image/png' }) : null
  const canShare = typeof navigator !== 'undefined' && !!file && !!navigator.canShare?.({ files: [file] })

  async function share() {
    if (!file) return
    try {
      await navigator.share({ files: [file], text: kind === 'couple' && couple ? `/${couple.a} + /${couple.b}. We met on /date.` : kind === 'got' ? `Someone sent me /${vibe} on /date` : `My vibe tonight: /${vibe}` })
      onClose()
    } catch { /* they closed the sheet */ }
  }
  function save() {
    if (!blob) return
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `date-${vibe}.png`; a.click()
    setMsg('Saved. Post it to your story.')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-5" role="dialog" aria-modal onClick={onClose}>
      <div className="w-full max-w-sm grid gap-4" onClick={(e) => e.stopPropagation()}>
        <canvas ref={ref} className="w-full aspect-[9/16] rounded-3xl shadow-2xl bg-[#141414]" />
        <div className="grid grid-cols-2 gap-2">
          {canShare
            ? <button onClick={share} disabled={!blob} className="col-span-2 bg-ob text-white rounded-full px-6 py-4 font-extrabold disabled:opacity-50">Share to your story</button>
            : null}
          <button onClick={save} disabled={!blob} className={`${canShare ? '' : 'col-span-2 bg-ob text-white'} rounded-full px-6 py-3.5 font-extrabold ${canShare ? 'bg-white text-[#141414]' : ''} disabled:opacity-50`}>Save image</button>
          <button onClick={onClose} className={`${canShare ? '' : 'col-span-2'} rounded-full px-6 py-3.5 font-extrabold text-white`}>Close</button>
        </div>
        {msg && <p className="text-center text-sm text-white font-semibold">{msg}</p>}
      </div>
    </div>
  )
}
