import { Suspense, lazy, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Mic, Play } from 'lucide-react'
import { useInViewReplay, useReducedMotion } from '../hooks'

const HeadScene = lazy(() => import('./HeadScene'))

/* word-by-word headline reveal */
const lineWrap = {
  hidden: {},
  show: (delay: number) => ({
    transition: { staggerChildren: 0.07, delayChildren: delay },
  }),
}
const word = {
  hidden: { opacity: 0, y: '0.4em', filter: 'blur(8px)' },
  show: { opacity: 1, y: '0em', filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 0.61, 0.24, 1] } },
}

function RevealLine({ text, delay, className }: { text: string; delay: number; className?: string }) {
  return (
    <motion.span className="block" variants={lineWrap} initial="hidden" animate="show" custom={delay}>
      {text.split(' ').map((w, i) => (
        // gradient text must sit on the word span itself (background-clip needs
        // the background on the same element as the transparent fill)
        <motion.span
          key={i}
          variants={word}
          className={`inline-block ${className ?? ''}`}
          style={{ marginInlineEnd: '0.22em' }}
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  )
}

const CALLOUTS = [
  { title: 'מנוע חשיבה', text: 'מנתח מידע ומקבל החלטות.', pos: { top: '9%', insetInlineEnd: '68%' } },
  { title: 'הבנת שפה', text: 'מבין שיחות והקשר בזמן אמת.', pos: { top: '30%', insetInlineEnd: '82%' } },
  { title: 'זיכרון AI', text: 'לומד מהנתונים והתהליכים של העסק.', pos: { top: '54%', insetInlineEnd: '83%' } },
  { title: 'אוטומציה', text: 'מבצע פעולות במערכות שלכם.', pos: { top: '76%', insetInlineEnd: '70%' } },
]

const METRICS = [
  { v: '24/7', l: 'סוכן AI שעובד תמיד' },
  { v: '10x', l: 'תגובה מהירה יותר' },
  { v: '80%', l: 'פחות עבודה ידנית' },
  { v: '3x', l: 'יותר טיפול בלידים' },
]

export default function HeroSection() {
  const { ref, inView } = useInViewReplay<HTMLElement>(0.1)
  const reduced = useReducedMotion()
  const bars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        d: `${(i * 0.09) % 1.3}s`,
        h: 0.2 + Math.abs(Math.sin(i * 1.7)) * 0.8,
      })),
    [],
  )

  return (
    <section
      id="hero"
      ref={ref}
      className="relative overflow-hidden"
      style={{ minHeight: '100vh', zIndex: 1 }}
      aria-label="VENA TECH — מערכות AI לעסקים"
    >
      <div
        className="mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-0"
        style={{ maxWidth: 1440, padding: '120px 32px 60px', minHeight: '100vh' }}
      >
        {/* TEXT COLUMN — RTL start (right) */}
        <div className="w-full lg:w-[46%] relative" style={{ zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7 }}
          >
            <span className="pill-label">מערכות AI לעסקים</span>
          </motion.div>

          <h1
            className="font-extrabold mt-6"
            style={{ lineHeight: 0.95, fontSize: 'clamp(44px, 6vw, 100px)' }}
          >
            <RevealLine text="העסק שלך." delay={0.15} />
            <RevealLine text="חכם יותר." delay={0.45} className="grad-text" />
            <RevealLine text="אוטומטי יותר." delay={0.75} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 1.05 }}
            className="mt-7"
            style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.6, maxWidth: 520 }}
          >
            אנחנו בונים מערכות AI, אוטומציות וסוכנים קוליים שמנהלים שיחות, לידים, פגישות ותהליכים גם
            כשאתם לא בעסק.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.25 }}
            className="flex flex-wrap items-center gap-4 mt-9"
          >
            <a href="#cta" className="btn btn-primary">
              <Mic size={18} aria-hidden="true" />
              דברו עם סוכן ה-AI
            </a>
            <a href="#hub" className="btn btn-glass">
              <Play size={17} aria-hidden="true" />
              ראו איך זה עובד
            </a>
          </motion.div>

          {/* waveform */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-9"
          >
            <div className="waveform" aria-hidden="true">
              {bars.map((b, i) => (
                <span key={i} style={{ '--d': b.d, '--h': b.h } as React.CSSProperties} />
              ))}
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              פשוט תגידו מה אתם צריכים. ה-AI מתחיל לעבוד.
            </p>
          </motion.div>

          {/* metrics — plain text with thin dividers */}
          <motion.ul
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.7 }}
            className="flex flex-wrap items-stretch mt-10 list-none"
            style={{ gap: 0 }}
          >
            {METRICS.map((m, i) => (
              <li
                key={m.v}
                className="flex flex-col justify-center"
                style={{
                  paddingInline: 22,
                  paddingInlineStart: i === 0 ? 0 : 22,
                  borderInlineStart: i === 0 ? 'none' : '1px solid rgba(255,255,255,.12)',
                }}
              >
                <span className="font-extrabold" style={{ fontSize: 26, lineHeight: 1.1 }}>
                  {m.v}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{m.l}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* 3D HEAD COLUMN */}
        <div className="w-full lg:w-[54%] relative" style={{ minHeight: 'min(78vh, 720px)' }}>
          {/* ambient glow behind the head */}
          <div
            className="absolute pointer-events-none"
            aria-hidden="true"
            style={{
              inset: '8%',
              background:
                'radial-gradient(45% 45% at 50% 46%, rgba(54,120,255,.22), transparent 70%), radial-gradient(30% 30% at 38% 60%, rgba(150,70,255,.16), transparent 70%)',
              filter: 'blur(10px)',
            }}
          />
          <Suspense
            fallback={
              <div
                className="absolute inset-0 m-auto rounded-full"
                style={{
                  width: 320,
                  height: 320,
                  background: 'radial-gradient(circle, rgba(54,120,255,.25), transparent 70%)',
                  filter: 'blur(30px)',
                }}
                aria-hidden="true"
              />
            }
          >
            <div className="absolute inset-0">
              <HeadScene active={inView} />
            </div>
          </Suspense>

          {/* connector lines to brain parts (decorative) */}
          <svg
            className="absolute inset-0 hidden lg:block pointer-events-none"
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ direction: 'ltr' }}
          >
            <defs>
              <linearGradient id="calloutLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#20E4FF" stopOpacity="0.8" />
                <stop offset="1" stopColor="#7B4DFF" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {[
              'M 30 15 Q 37 19 41 28',
              'M 17 36 Q 26 38 33 41',
              'M 16 60 Q 26 58 33 56',
              'M 29 80 Q 37 75 41 67',
            ].map((d, i) => (
              <path
                key={i}
                d={d}
                stroke="url(#calloutLine)"
                strokeWidth="1.2"
                fill="none"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
            ))}
          </svg>

          {/* compact glass callout cards */}
          {CALLOUTS.map((c, i) => (
            <motion.div
              key={c.title}
              className="glass absolute hidden lg:block"
              style={{ ...c.pos, width: 200, padding: '12px 14px', zIndex: 3 }}
              initial={{ opacity: 0, x: 24, filter: 'blur(8px)' }}
              animate={reduced ? { opacity: 1, x: 0, filter: 'blur(0px)' } : inView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.8, delay: 1.3 + i * 0.18 }}
            >
              <div className="font-bold text-sm" style={{ color: 'var(--cyan)' }}>
                {c.title}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                {c.text}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
