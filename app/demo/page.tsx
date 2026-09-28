import Link from 'next/link'
import { DEMO_CREW, demoPhoto } from '@/lib/demo'

export const metadata = { title: '/date — Demo crew' }

const VIS_LABEL = { public: 'Public', tonight: 'Tonight only', private: 'Private' }

export default function DemoPage() {
  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-12 pb-16">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-chalk-2 font-medium">demo</span>
      </header>

      <section className="max-w-3xl">
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em]">
          The demo crew.
        </h1>
        <p className="mt-5 text-xl text-chalk-2 font-medium leading-snug max-w-xl">
          Twelve /names to try the whole thing with. Not real people. Open a /hey page,
          print a badge, see what &ldquo;tonight only&rdquo; and &ldquo;private&rdquo; look like.
        </p>
      </section>

      <section className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
        {DEMO_CREW.map((d) => (
          <div key={d.handle} className="border-2 border-white rounded-2xl overflow-hidden flex flex-col">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demoPhoto(d.handle)}
              alt={`${d.name}, ${d.age}`}
              className="w-full aspect-[4/5] object-cover bg-ob-1"
            />
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-display font-extrabold text-3xl tracking-tight">
                  /{d.handle} <span className="text-chalk-2 text-xl">/{d.tag}</span>
                </div>
                <span className="text-xs tracking-[0.18em] uppercase font-semibold whitespace-nowrap">{VIS_LABEL[d.visibility]}</span>
              </div>
              <div className="text-base font-semibold">{d.name}, {d.age} · {d.hood}</div>
              <p className="text-base text-chalk-2 leading-relaxed">{d.vibe}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <Link href={`/${d.handle}`} className="bg-white text-ob text-sm font-extrabold rounded-full px-5 py-2.5 hover:scale-[1.02] transition-transform">
                  /hey page
                </Link>
                <Link href={`/badge/?h=${d.handle}`} className="border-2 border-white text-sm font-extrabold rounded-full px-5 py-2.5 hover:bg-gold-faint transition-colors">
                  Badge
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      <p className="mt-12 text-sm text-chalk-3">
        To send a /hey to one of them, use another crew member&rsquo;s email: demo-theo@date.demo, etc.
        Photos are generated. Nobody here is real.
      </p>
    </main>
  )
}
