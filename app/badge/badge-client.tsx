'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import { heyUrl, normalizeHandle } from '@/lib/handles'
import { getSupabase } from '@/lib/supabase'
import Install from '../install'

export default function BadgeClient() {
  const params = useSearchParams()
  const handle = normalizeHandle(params.get('h') ?? '')
  const [qr, setQr] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [founding, setFounding] = useState<number | null>(null)

  useEffect(() => {
    if (!handle) return
    getSupabase()?.rpc('handle_wall', { p_handle: handle }).then(({ data }) => { setTags(data?.tags?.length ? data.tags : data?.tag ? [data.tag] : []); setFounding(data?.founding ?? null) })
    QRCode.toDataURL(heyUrl(handle), {
      margin: 0, width: 512, color: { dark: '#FF3B2F', light: '#FFFFFF' },
    }).then(setQr)
  }, [handle])

  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-12 pb-12">
      <header className="flex items-center justify-between pt-8 pb-10 print:hidden">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-chalk-2 font-medium">badge</span>
      </header>

      <section className="flex flex-col items-start gap-8">
        <div className="badge bg-white text-ob rounded-[28px] p-8 w-[340px] aspect-[3/4] flex flex-col shadow-2xl print:shadow-none">
          <div className="text-xs tracking-[0.22em] uppercase font-semibold">Hi, I&rsquo;m</div>
          <div className="font-display font-extrabold leading-[0.9] tracking-[-0.04em] mt-2 break-all"
            style={{ fontSize: handle.length > 8 ? 48 : 64 }}>
            /{handle || 'name'}
          </div>
          {tags.length > 0 && <div className="font-display font-extrabold tracking-tight mt-2"><span className="text-3xl">/{tags[0]}</span>{tags.slice(1).map((t) => <span key={t} className="text-xl opacity-60 ml-2">/{t}</span>)}</div>}
          <div className="mt-auto flex items-end justify-between gap-4">
            <div>
              <div className="font-extrabold text-lg leading-tight">Send me a /hey.</div>
              <div className="text-sm font-medium mt-1">on /date · Charleston{founding ? ` · #${String(founding).padStart(3, '0')}` : ''}</div>
            </div>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt={`QR to /at?h=${handle}`} className="w-24 h-24" />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 print:hidden">
          <button onClick={() => window.print()}
            className="bg-white text-ob text-base font-extrabold rounded-full px-9 py-4 hover:scale-[1.02] transition-transform">
            Print
          </button>
          <Link href={`/at/?h=${handle}`} className="border-2 border-white text-base font-extrabold rounded-full px-9 py-4 text-center hover:bg-gold-faint transition-colors">
            See my /hey page
          </Link>
        </div>
        <p className="text-sm text-chalk-3 max-w-md print:hidden">
          Card stock, cut it out, lanyard it. Or just hold it up. Scanning the code
          sends you a /hey &mdash; they never see anything until you say yes.
        </p>
        <div className="print:hidden"><Install /></div>
      </section>

      <style>{`
        @media print {
          body { background: #fff !important; }
          main { padding: 0 !important; min-height: auto !important; }
          .badge { box-shadow: none !important; border: 1px solid #ddd; }
        }
      `}</style>
    </main>
  )
}
