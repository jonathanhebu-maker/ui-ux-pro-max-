import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  Users,
  Calendar,
  Phone,
  FileText,
  Clock,
  Mail,
  MessageSquare,
  BarChart3,
  Settings2,
  Bot,
} from 'lucide-react'
import { useInViewReplay, useReducedMotion } from '../hooks'

type Row = { label: string; color: string }
type Module = { key: string; title: string; icon: React.ReactNode; rows: Row[]; area: string }

const G = '#2bd97c'
const B = '#23B7FF'
const P = '#B245FF'
const C = '#20E4FF'

const MODULES: Module[] = [
  { key: 'crm', title: 'CRM', icon: <Users size={15} />, area: 'crm', rows: [
    { label: 'New Lead', color: G }, { label: 'Qualified', color: B }, { label: 'Opportunity', color: P }, { label: 'Customer', color: G },
  ]},
  { key: 'calendar', title: 'Calendar', icon: <Calendar size={15} />, area: 'calendar', rows: [
    { label: 'Team Sync — 10:00', color: B }, { label: 'Client Call — 13:00', color: C }, { label: 'Strategy Meeting — 15:00', color: P },
  ]},
  { key: 'calls', title: 'Calls', icon: <Phone size={15} />, area: 'calls', rows: [
    { label: 'Inbound Call', color: B }, { label: 'AI Agent', color: G }, { label: 'Summary Ready', color: C },
  ]},
  { key: 'forms', title: 'Forms', icon: <FileText size={15} />, area: 'forms', rows: [
    { label: 'New Submission', color: G }, { label: 'Lead Captured', color: B }, { label: 'AI Qualification', color: P },
  ]},
  { key: 'analytics', title: 'Analytics', icon: <BarChart3 size={15} />, area: 'analytics', rows: [
    { label: 'Leads ↑ 42%', color: G }, { label: 'Bookings ↑ 28%', color: B }, { label: 'Revenue ↑ 61%', color: C },
  ]},
  { key: 'messages', title: 'Messages', icon: <MessageSquare size={15} />, area: 'messages', rows: [
    { label: 'WhatsApp — new chat', color: G }, { label: 'SMS — reminder sent', color: B }, { label: 'Slack — team update', color: P },
  ]},
  { key: 'scheduling', title: 'Scheduling', icon: <Clock size={15} />, area: 'scheduling', rows: [
    { label: '09:00 — booked', color: B }, { label: '11:00 — available', color: G }, { label: '14:00 — booked', color: P },
  ]},
  { key: 'automation', title: 'Automation', icon: <Settings2 size={15} />, area: 'automation', rows: [
    { label: 'Trigger', color: C }, { label: 'AI Agent', color: B }, { label: 'Take Action', color: G }, { label: 'Update Systems', color: P },
  ]},
  { key: 'chatbot', title: 'Chatbot', icon: <Bot size={15} />, area: 'chatbot', rows: [
    { label: 'Hi! How can I help you today?', color: B }, { label: 'Book a demo for next week', color: G },
  ]},
  { key: 'email', title: 'Email', icon: <Mail size={15} />, area: 'email', rows: [
    { label: 'New Inquiry', color: B }, { label: 'Follow Up', color: C }, { label: 'Proposal', color: P }, { label: 'Closed Won', color: G },
  ]},
]

type PathInfo = { d: string; el?: SVGPathElement | null }

export default function HubSection() {
  const { ref, inView } = useInViewReplay<HTMLElement>(0.25)
  const reduced = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const pathRefs = useRef<(SVGPathElement | null)[]>([])
  const boltRefs = useRef<(SVGCircleElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])
  const [paths, setPaths] = useState<PathInfo[]>([])
  const [box, setBox] = useState({ w: 1200, h: 700 })

  /* measure card & core positions -> build curved connector paths */
  const measure = () => {
    const stage = stageRef.current
    const core = coreRef.current
    if (!stage || !core) return
    const sb = stage.getBoundingClientRect()
    const cb = core.getBoundingClientRect()
    const cx = cb.left + cb.width / 2 - sb.left
    const cy = cb.top + cb.height / 2 - sb.top
    const next: PathInfo[] = MODULES.map((_, i) => {
      const el = cardRefs.current[i]
      if (!el) return { d: '' }
      const r = el.getBoundingClientRect()
      const ex = r.left + r.width / 2 - sb.left
      const ey = r.top + r.height / 2 - sb.top
      // elegant curve: bend midway, perpendicular-ish offset
      const mx = (cx + ex) / 2
      const my = (cy + ey) / 2
      const dx = ex - cx
      const dy = ey - cy
      const norm = Math.hypot(dx, dy) || 1
      const off = Math.min(46, norm * 0.16)
      const bx = mx + (-dy / norm) * off
      const by = my + (dx / norm) * off
      return { d: `M ${cx.toFixed(1)} ${cy.toFixed(1)} Q ${bx.toFixed(1)} ${by.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}` }
    })
    setBox({ w: sb.width, h: sb.height })
    setPaths(next)
  }

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (stageRef.current) ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [])

  /* ambient slow particles drifting along every connector */
  useEffect(() => {
    if (reduced || !inView || paths.length === 0) return
    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      const t = (performance.now() - t0) / 1000
      for (let i = 0; i < MODULES.length; i++) {
        const path = pathRefs.current[i]
        const dot = dotRefs.current[i]
        if (!path || !dot) continue
        const len = path.getTotalLength()
        if (!len) continue
        const u = (t / (4 + (i % 4) * 0.7) + i * 0.13) % 1
        const p = path.getPointAtLength(u * len)
        dot.setAttribute('cx', String(p.x))
        dot.setAttribute('cy', String(p.y))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, paths, reduced])

  /* master loop: lightning bolt from AI -> card, then rows slide in RTL */
  useEffect(() => {
    if (reduced) return
    const stage = stageRef.current
    if (!stage) return
    const rows = (i: number) => cardRefs.current[i]?.querySelectorAll<HTMLElement>('.hub-row')

    if (!inView) {
      // leave rows visible in their final state when out of view
      return
    }

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 })
    MODULES.forEach((_, i) => {
      const at = i * 0.42
      // hide rows just before their bolt arrives
      tl.set(rows(i) ?? [], { opacity: 0, x: 40 }, at)
      // lightning bolt travels center -> card
      tl.call(
        () => {
          const path = pathRefs.current[i]
          const bolt = boltRefs.current[i]
          const card = cardRefs.current[i]
          if (!path || !bolt) return
          const len = path.getTotalLength()
          if (!len) return
          const proxy = { u: 0 }
          gsap.set(bolt, { attr: { r: 5 }, opacity: 1 })
          gsap.to(proxy, {
            u: 1,
            duration: 0.5,
            ease: 'power2.in',
            onUpdate: () => {
              const p = path.getPointAtLength(proxy.u * len)
              bolt.setAttribute('cx', String(p.x))
              bolt.setAttribute('cy', String(p.y))
            },
            onComplete: () => {
              gsap.to(bolt, { opacity: 0, duration: 0.25 })
              if (card) {
                card.classList.add('flash')
                setTimeout(() => card.classList.remove('flash'), 450)
              }
            },
          })
          gsap.fromTo(path, { opacity: 1 }, { opacity: 0.45, duration: 0.6, delay: 0.4 })
        },
        [],
        at,
      )
      // rows enter from the right, settle left (RTL slide), staggered
      tl.to(
        rows(i) ?? [],
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out' },
        at + 0.45,
      )
    })

    return () => {
      tl.kill()
      // settle everything to final visible state
      MODULES.forEach((_, i) => gsap.set(rows(i) ?? [], { opacity: 1, x: 0 }))
      boltRefs.current.forEach((b) => b && gsap.set(b, { opacity: 0 }))
    }
  }, [inView, reduced, paths.length])

  return (
    <section
      id="hub"
      ref={ref}
      className="relative flex items-center"
      style={{ minHeight: '100vh', zIndex: 1, padding: '110px 20px 70px' }}
      aria-label="מרכז הבקרה של ה-AI — כל המערכות מחוברות"
    >
      <div className="mx-auto w-full" style={{ maxWidth: 1280 }}>
        <div className="text-center mb-10">
          <span className="pill-label">הכל מחובר. הכל אוטומטי.</span>
          <h2 className="font-extrabold mt-5" style={{ fontSize: 'clamp(30px, 3.6vw, 52px)', lineHeight: 1.1 }}>
            מוח <span className="grad-text">AI אחד</span> שמפעיל את כל העסק
          </h2>
          <p className="mt-4 mx-auto" style={{ color: 'var(--muted)', maxWidth: 560, fontSize: 16, lineHeight: 1.6 }}>
            ה-AI מתחבר ל-CRM, ליומן, לטלפון, לטפסים ולדוא״ל — ומזרים נתונים ופעולות לכל מערכת בזמן אמת.
          </p>
        </div>

        <div ref={stageRef} className="relative hub-stage">
          {/* connectors layer */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            viewBox={`0 0 ${box.w} ${box.h}`}
            aria-hidden="true"
            style={{ direction: 'ltr', zIndex: 0 }}
          >
            <defs>
              <linearGradient id="hubLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={C} stopOpacity="0.7" />
                <stop offset="0.5" stopColor={B} stopOpacity="0.5" />
                <stop offset="1" stopColor={P} stopOpacity="0.6" />
              </linearGradient>
              <filter id="boltGlow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {paths.map((p, i) => (
              <g key={i}>
                <path
                  ref={(el) => (pathRefs.current[i] = el)}
                  d={p.d}
                  fill="none"
                  stroke="url(#hubLine)"
                  strokeWidth="1.4"
                  opacity="0.5"
                />
                {/* ambient drifting particle */}
                <circle ref={(el) => (dotRefs.current[i] = el)} r="2.2" fill={C} opacity="0.55" />
                {/* lightning bolt */}
                <circle
                  ref={(el) => (boltRefs.current[i] = el)}
                  r="5"
                  fill="#eaffff"
                  opacity="0"
                  filter="url(#boltGlow)"
                />
              </g>
            ))}
          </svg>

          {/* cards grid with AI core in the middle */}
          <div className="hub-grid" style={{ position: 'relative', zIndex: 1 }}>
            {MODULES.map((m, i) => (
              <div
                key={m.key}
                ref={(el) => (cardRefs.current[i] = el)}
                className="hub-card"
                style={{ gridArea: m.area }}
              >
                <div className="hub-card-head">
                  <span className="hub-ic">{m.icon}</span>
                  {m.title}
                </div>
                <div className="hub-rows">
                  {m.rows.map((r) => (
                    <div key={r.label} className="hub-row">
                      <span className="dot" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                      {r.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* central AI node */}
            <div className="flex items-center justify-center" style={{ gridArea: 'core' }}>
              <div ref={coreRef} className="ai-core" role="img" aria-label="ליבת AI מרכזית">
                <div className="diamond" />
                <span className="label">AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hub-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(4, 1fr);
          grid-template-areas:
            'crm calendar calls forms'
            'analytics core core messages'
            'scheduling automation chatbot email';
          align-items: stretch;
        }
        @media (max-width: 1023px) {
          .hub-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            grid-template-areas:
              'crm calendar'
              'calls forms'
              'core core'
              'analytics messages'
              'scheduling automation'
              'chatbot email';
          }
        }
      `}</style>
    </section>
  )
}
