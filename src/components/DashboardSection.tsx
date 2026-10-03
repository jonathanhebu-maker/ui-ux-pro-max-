import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import {
  Home, Zap, MessageSquare, Users, Calendar, BarChart3, Boxes, Settings,
  Search, SquarePen, Database, Bot, Send, TrendingUp,
} from 'lucide-react'
import { countUp, useInViewReplay, useIsTouch, useReducedMotion } from '../hooks'

/* ------------------------------------------------------------------ */

const SIDEBAR = [
  { icon: <Home size={15} />, label: 'Dashboard', active: true },
  { icon: <Zap size={15} />, label: 'Automations' },
  { icon: <MessageSquare size={15} />, label: 'Conversations' },
  { icon: <Users size={15} />, label: 'Leads' },
  { icon: <Calendar size={15} />, label: 'Calendar' },
  { icon: <BarChart3 size={15} />, label: 'Analytics' },
  { icon: <Boxes size={15} />, label: 'Integrations' },
  { icon: <Settings size={15} />, label: 'Settings' },
]

const METRICS = [
  { label: 'Total Leads', value: 2541, delta: 68, color: '#2bd97c', spark: 'M0 26 L12 22 L24 24 L36 17 L48 19 L60 12 L72 14 L84 7 L100 4' },
  { label: 'Conversations', value: 1892, delta: 52, color: '#B245FF', spark: 'M0 27 L14 24 L28 25 L42 18 L56 20 L70 13 L84 15 L100 6' },
  { label: 'Meetings Booked', value: 428, delta: 74, color: '#23B7FF', spark: 'M0 28 L15 25 L30 26 L45 19 L60 21 L75 12 L100 5' },
  { label: 'Conversion Rate', value: 16.8, decimals: 1, suffix: '%', delta: 3.2, deltaDecimals: 1, color: '#20E4FF', spark: 'M0 26 L16 23 L32 24 L48 16 L64 18 L80 10 L100 5' },
]

const DONUT = [
  { label: 'Website Forms', pct: 38, color: '#23B7FF' },
  { label: 'Inbound Calls', pct: 24, color: '#20E4FF' },
  { label: 'Chatbot', pct: 18, color: '#3678FF' },
  { label: 'Referrals', pct: 12, color: '#B245FF' },
  { label: 'Email Campaigns', pct: 8, color: '#7B4DFF' },
]

const BARS = [14, 18, 24, 22, 32, 40, 38, 55, 70, 100]
const BAR_LABELS = ['Oct 1', 'Oct 8', 'Oct 15', 'Oct 22', 'Oct 31']

const CONVERSATIONS = [
  { name: 'Sarah Chen', msg: 'Interested in automation for our agency…', time: '2m ago', tag: 'Qualified', tagBg: 'rgba(43,217,124,.16)', tagColor: '#2bd97c', av: 'SC', avBg: 'linear-gradient(135deg,#23B7FF,#7B4DFF)' },
  { name: 'Mike Rodriguez', msg: 'Can you show me pricing?', time: '12m ago', tag: 'Demo Booked', tagBg: 'rgba(54,120,255,.18)', tagColor: '#7fb0ff', av: 'MR', avBg: 'linear-gradient(135deg,#3678FF,#B245FF)' },
  { name: 'Jessica Taylor', msg: "What's included in the setup?", time: '28m ago', tag: 'In Discussion', tagBg: 'rgba(178,69,255,.16)', tagColor: '#cf9bff', av: 'JT', avBg: 'linear-gradient(135deg,#B245FF,#20E4FF)' },
]

/* small straight connector between workflow nodes */
function Conn({ innerRef }: { innerRef: (el: SVGPathElement | null) => void }) {
  return (
    <svg width="46" height="12" viewBox="0 0 46 12" aria-hidden="true" className="wf-conn" style={{ flex: 'none' }}>
      <path d="M2 6 H44" stroke="rgba(54,120,255,.25)" strokeWidth="2" fill="none" />
      <path ref={innerRef} d="M2 6 H44" stroke="#20E4FF" strokeWidth="2" fill="none" pathLength={100}
        style={{ strokeDasharray: 100, filter: 'drop-shadow(0 0 4px rgba(32,228,255,.8))' }} />
      <circle className="wf-dot" r="2.4" cy="6" fill="#9fdcff" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */

export default function DashboardSection() {
  const { ref, inView } = useInViewReplay<HTMLElement>(0.3)
  const reduced = useReducedMotion()
  const isTouch = useIsTouch()

  const shellRef = useRef<HTMLDivElement>(null)
  const connRefs = useRef<(SVGPathElement | null)[]>([])
  const branchRefs = useRef<(SVGPathElement | null)[]>([])
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const metricValRefs = useRef<(HTMLSpanElement | null)[]>([])
  const metricDeltaRefs = useRef<(HTMLSpanElement | null)[]>([])
  const sparkRefs = useRef<(SVGPathElement | null)[]>([])
  const donutRefs = useRef<(SVGCircleElement | null)[]>([])
  const donutCenterRef = useRef<HTMLSpanElement>(null)
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const revRef = useRef<HTMLSpanElement>(null)
  const revDeltaRef = useRef<HTMLSpanElement>(null)
  const convRefs = useRef<(HTMLDivElement | null)[]>([])

  /* subtle mouse-driven perspective shift */
  useEffect(() => {
    if (reduced || isTouch) return
    const section = ref.current
    const shell = shellRef.current
    if (!section || !shell) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = section.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        shell.style.transform = `perspective(1600px) rotateX(${(3 - ny * 4).toFixed(2)}deg) rotateY(${(-nx * 5).toFixed(2)}deg)`
      })
    }
    const onLeave = () => {
      shell.style.transform = 'perspective(1600px) rotateX(3deg) rotateY(0deg)'
    }
    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
    }
  }, [reduced, isTouch, ref])

  /* cinematic entry sequence — replays on every viewport entry */
  useEffect(() => {
    if (!inView || reduced) return

    const tl = gsap.timeline()

    /* 1) workflow connectors draw in sequence; nodes light up */
    const lit = (i: number) => () => nodeRefs.current[i]?.classList.add('lit')
    nodeRefs.current.forEach((n) => n?.classList.remove('lit'))

    tl.call(lit(0), [], 0)
    connRefs.current.forEach((c, i) => {
      if (!c) return
      tl.fromTo(c, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.35, ease: 'power1.inOut' }, 0.15 + i * 0.4)
      tl.call(lit(i + 1), [], 0.5 + i * 0.4)
    })
    const branchStart = 0.15 + connRefs.current.length * 0.4
    branchRefs.current.forEach((b, i) => {
      if (!b) return
      tl.fromTo(b, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.4, ease: 'power1.inOut' }, branchStart + i * 0.18)
      tl.call(lit(3 + i), [], branchStart + 0.35 + i * 0.18)
    })

    /* 2) metric numbers count up  +  3) sparklines draw */
    METRICS.forEach((m, i) => {
      tl.call(
        () => {
          countUp(metricValRefs.current[i], m.value, { decimals: m.decimals ?? 0, duration: 1.2, suffix: m.suffix ?? '' })
          countUp(metricDeltaRefs.current[i], m.delta, { decimals: m.deltaDecimals ?? 0, duration: 1.2, suffix: '%' })
        },
        [],
        0.55 + i * 0.12,
      )
      const s = sparkRefs.current[i]
      if (s) tl.fromTo(s, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.out' }, 0.55 + i * 0.12)
    })

    /* 4) donut sweeps in segment by segment + center count */
    let acc = 0
    DONUT.forEach((seg, i) => {
      const c = donutRefs.current[i]
      if (!c) return
      tl.fromTo(
        c,
        { attr: { 'stroke-dasharray': `0 100` } },
        { attr: { 'stroke-dasharray': `${seg.pct} ${100 - seg.pct}` }, duration: 0.5, ease: 'power1.inOut' },
        1.15 + i * 0.22,
      )
      acc += seg.pct
    })
    tl.call(() => countUp(donutCenterRef.current, 2541, { duration: 1.3 }), [], 1.15)

    /* 5) revenue bars grow left -> right */
    barRefs.current.forEach((b, i) => {
      if (!b) return
      tl.fromTo(b, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: 'power3.out' }, 1.3 + i * 0.08)
    })
    tl.call(
      () => {
        countUp(revRef.current, 128.4, { decimals: 1, duration: 1.2, prefix: '$', suffix: 'K' })
        countUp(revDeltaRef.current, 62, { duration: 1.2, suffix: '%' })
      },
      [],
      1.3,
    )

    /* 6) recent conversations slide in right -> left */
    tl.fromTo(
      convRefs.current.filter(Boolean),
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 0.55, stagger: 0.15, ease: 'power3.out' },
      1.5,
    )

    return () => {
      tl.kill()
      /* settle to final state */
      gsap.set(convRefs.current.filter(Boolean), { opacity: 1, x: 0 })
      barRefs.current.forEach((b) => b && gsap.set(b, { scaleY: 1 }))
      sparkRefs.current.forEach((s) => s && gsap.set(s, { strokeDashoffset: 0 }))
      connRefs.current.forEach((c) => c && gsap.set(c, { strokeDashoffset: 0 }))
      branchRefs.current.forEach((b) => b && gsap.set(b, { strokeDashoffset: 0 }))
      nodeRefs.current.forEach((n) => n?.classList.add('lit'))
    }
  }, [inView, reduced])

  let nodeIdx = -1
  const nodeRef = () => {
    nodeIdx += 1
    const i = nodeIdx
    return (el: HTMLDivElement | null) => {
      nodeRefs.current[i] = el
    }
  }

  return (
    <section
      id="dashboard"
      ref={ref}
      className="relative flex items-center justify-center"
      style={{ minHeight: '100vh', zIndex: 1, padding: '110px 18px 70px' }}
      aria-label="דאשבורד אוטומציה — סוכן קולי ו-AI בפעולה"
    >
      <div className="w-full dash-scroll" style={{ maxWidth: 1240 }}>
        <div
          ref={shellRef}
          className="dash-shell neon-frame"
          style={{ transform: 'perspective(1600px) rotateX(3deg)', minWidth: 980 }}
        >
          <div className="flex">
            {/* sidebar */}
            <aside className="hidden md:block" style={{ width: 196, borderRight: '1px solid rgba(255,255,255,.07)', padding: '20px 12px', flex: 'none' }}>
              <div className="font-extrabold mb-6 px-2" style={{ fontSize: 16, letterSpacing: '.04em' }}>
                VENA<span style={{ color: 'var(--blue)' }}> TECH</span>
              </div>
              <nav className="flex flex-col gap-1" aria-label="Dashboard navigation">
                {SIDEBAR.map((s) => (
                  <div key={s.label} className={`sidebar-item ${s.active ? 'active' : ''}`}>
                    {s.icon}
                    {s.label}
                  </div>
                ))}
              </nav>
            </aside>

            {/* main */}
            <div className="flex-1" style={{ padding: '18px 22px 22px', minWidth: 0 }}>
              {/* topbar */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <label
                  className="flex items-center gap-2 flex-1"
                  style={{
                    maxWidth: 420, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)',
                    borderRadius: 12, padding: '9px 14px', color: 'var(--muted)', fontSize: 13,
                  }}
                >
                  <Search size={14} aria-hidden="true" />
                  <input
                    readOnly
                    placeholder="Search automations, leads, or anything…"
                    aria-label="Search"
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#cdd6ea', width: '100%', fontSize: 13, fontFamily: 'inherit' }}
                  />
                </label>
                <div
                  className="flex items-center gap-2"
                  style={{ border: '1px solid rgba(43,217,124,.35)', background: 'rgba(43,217,124,.08)', borderRadius: 999, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#2bd97c' }}
                >
                  <span className="live-dot" />
                  Live
                </div>
              </div>

              {/* title row */}
              <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h2 className="font-extrabold" style={{ fontSize: 24 }}>Automation Workflow</h2>
                  <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Visualize and manage your entire growth system</p>
                </div>
                <div
                  className="flex items-center gap-2"
                  style={{ border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#dfe7f5' }}
                >
                  <SquarePen size={13} aria-hidden="true" />
                  Edit Workflow
                </div>
              </div>

              {/* workflow */}
              <div className="flex items-center gap-1 mb-5" style={{ minHeight: 150 }}>
                <div ref={nodeRef()} className="dash-node" style={{ borderColor: 'rgba(43,217,124,.4)' }}>
                  <div className="wf-ic" style={{ background: 'rgba(43,217,124,.14)', color: '#2bd97c' }}><Zap size={15} /></div>
                  <div className="wf-title">Trigger</div>
                  <div className="wf-sub">New Lead · Form Submission</div>
                </div>
                <Conn innerRef={(el) => (connRefs.current[0] = el)} />
                <div ref={nodeRef()} className="dash-node">
                  <div className="wf-ic" style={{ background: 'rgba(123,77,255,.16)', color: '#b79bff' }}><Database size={15} /></div>
                  <div className="wf-title">Enrich Lead</div>
                  <div className="wf-sub">Find Contact Info</div>
                </div>
                <Conn innerRef={(el) => (connRefs.current[1] = el)} />
                <div ref={nodeRef()} className="dash-node" style={{ borderColor: 'rgba(54,120,255,.45)' }}>
                  <div className="wf-ic" style={{ background: 'rgba(54,120,255,.18)', color: '#7fb0ff' }}><Bot size={15} /></div>
                  <div className="wf-title">AI Agent</div>
                  <div className="wf-sub">Qualify &amp; Respond</div>
                </div>

                {/* branch */}
                <svg width="58" height="150" viewBox="0 0 58 150" aria-hidden="true" style={{ flex: 'none' }}>
                  {[
                    'M2 75 C 26 75 30 25 56 25',
                    'M2 75 H 56',
                    'M2 75 C 26 75 30 125 56 125',
                  ].map((d, i) => (
                    <g key={i}>
                      <path d={d} stroke="rgba(54,120,255,.25)" strokeWidth="2" fill="none" />
                      <path
                        ref={(el) => (branchRefs.current[i] = el)}
                        d={d}
                        stroke="#20E4FF"
                        strokeWidth="2"
                        fill="none"
                        pathLength={100}
                        style={{ strokeDasharray: 100, filter: 'drop-shadow(0 0 4px rgba(32,228,255,.7))' }}
                      />
                    </g>
                  ))}
                </svg>
                <div className="flex flex-col gap-2.5">
                  <div ref={nodeRef()} className="dash-node wf-branch">
                    <div className="wf-ic" style={{ background: 'rgba(35,183,255,.16)', color: '#7fd8ff' }}><Calendar size={14} /></div>
                    <div>
                      <div className="wf-title">Book Meeting</div>
                      <div className="wf-sub">Add to Calendar</div>
                    </div>
                  </div>
                  <div ref={nodeRef()} className="dash-node wf-branch">
                    <div className="wf-ic" style={{ background: 'rgba(43,217,124,.14)', color: '#2bd97c' }}><Users size={14} /></div>
                    <div>
                      <div className="wf-title">Update CRM</div>
                      <div className="wf-sub">Add / Update Contact</div>
                    </div>
                  </div>
                  <div ref={nodeRef()} className="dash-node wf-branch">
                    <div className="wf-ic" style={{ background: 'rgba(178,69,255,.16)', color: '#cf9bff' }}><Send size={14} /></div>
                    <div>
                      <div className="wf-title">Send Follow-up</div>
                      <div className="wf-sub">Multi-Channel</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* metric cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {METRICS.map((m, i) => (
                  <div key={m.label} className="metric-card">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{m.label}</span>
                      <TrendingUp size={13} style={{ color: m.color }} aria-hidden="true" />
                    </div>
                    <div className="font-extrabold" style={{ fontSize: 25, lineHeight: 1.15 }}>
                      <span ref={(el) => (metricValRefs.current[i] = el)}>
                        {m.value.toLocaleString('en-US', { minimumFractionDigits: m.decimals ?? 0 })}{m.suffix ?? ''}
                      </span>
                    </div>
                    <div style={{ color: m.color, fontSize: 12.5, fontWeight: 600 }}>
                      ↑ <span ref={(el) => (metricDeltaRefs.current[i] = el)}>{m.delta}{'%'}</span>
                    </div>
                    <svg width="100%" height="32" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true" className="mt-1">
                      <path
                        ref={(el) => (sparkRefs.current[i] = el)}
                        d={m.spark}
                        fill="none"
                        stroke={m.color}
                        strokeWidth="2"
                        pathLength={100}
                        className="spark-live"
                        style={{ strokeDasharray: 100, color: m.color, vectorEffect: 'non-scaling-stroke' }}
                      />
                    </svg>
                  </div>
                ))}
              </div>

              {/* bottom row */}
              <div className="grid gap-3" style={{ gridTemplateColumns: '1.25fr 1fr 1fr' }}>
                {/* recent conversations */}
                <div className="metric-card">
                  <div className="font-bold mb-3" style={{ fontSize: 14.5 }}>Recent Conversations</div>
                  <div className="flex flex-col gap-2.5">
                    {CONVERSATIONS.map((c, i) => (
                      <div
                        key={c.name}
                        ref={(el) => (convRefs.current[i] = el)}
                        className="flex items-center gap-3"
                        style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 12, padding: '8px 10px' }}
                      >
                        <span
                          className="grid place-items-center font-bold"
                          style={{ width: 34, height: 34, borderRadius: '50%', background: c.avBg, fontSize: 12, flex: 'none' }}
                          aria-hidden="true"
                        >
                          {c.av}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ fontSize: 13 }}>{c.name}</span>
                            <span style={{ color: 'var(--muted)', fontSize: 11 }}>{c.time}</span>
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.msg}
                          </div>
                        </div>
                        <span style={{ background: c.tagBg, color: c.tagColor, fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '4px 10px', flex: 'none' }}>
                          {c.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* lead source donut */}
                <div className="metric-card">
                  <div className="font-bold mb-2" style={{ fontSize: 14.5 }}>Lead Source</div>
                  <div className="flex items-center gap-4">
                    <div className="relative" style={{ width: 118, height: 118, flex: 'none' }}>
                      <svg width="118" height="118" viewBox="0 0 118 118" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
                        {(() => {
                          let start = 0
                          return DONUT.map((seg, i) => {
                            const el = (
                              <circle
                                key={seg.label}
                                ref={(node) => (donutRefs.current[i] = node)}
                                cx="59" cy="59" r="46"
                                fill="none"
                                stroke={seg.color}
                                strokeWidth="13"
                                pathLength={100}
                                strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                                strokeDashoffset={-start}
                                strokeLinecap="butt"
                              />
                            )
                            start += seg.pct
                            return el
                          })
                        })()}
                      </svg>
                      <div className="absolute inset-0 grid place-items-center text-center">
                        <div>
                          <div className="font-extrabold" style={{ fontSize: 18, lineHeight: 1 }}>
                            <span ref={donutCenterRef}>2,541</span>
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: 9.5 }}>Total Leads</div>
                        </div>
                      </div>
                    </div>
                    <ul className="flex flex-col gap-1.5 list-none" style={{ fontSize: 11.5 }}>
                      {DONUT.map((seg) => (
                        <li key={seg.label} className="flex items-center gap-2">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flex: 'none' }} />
                          <span style={{ color: '#cdd6ea' }}>{seg.label}</span>
                          <span className="font-bold" style={{ marginLeft: 'auto' }}>{seg.pct}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* revenue pipeline */}
                <div className="metric-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold" style={{ fontSize: 14.5 }}>Revenue Pipeline</span>
                    <span style={{ color: 'var(--muted)', fontSize: 11, border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '3px 8px' }}>
                      This Month
                    </span>
                  </div>
                  <div className="font-extrabold" style={{ fontSize: 24 }}>
                    <span ref={revRef}>$128.4K</span>
                  </div>
                  <div style={{ color: '#2bd97c', fontSize: 12.5, fontWeight: 600 }}>
                    ↑ <span ref={revDeltaRef}>62%</span> this month
                  </div>
                  <div className="flex items-end gap-1.5 mt-3" style={{ height: 74 }} aria-hidden="true">
                    {BARS.map((h, i) => (
                      <div
                        key={i}
                        ref={(el) => (barRefs.current[i] = el)}
                        className={i === BARS.length - 1 ? 'bar-glow' : undefined}
                        style={{
                          flex: 1,
                          height: `${h}%`,
                          transformOrigin: 'bottom',
                          borderRadius: 4,
                          background: 'linear-gradient(180deg, #2bd97c, rgba(43,217,124,.25))',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1" style={{ color: 'var(--muted)', fontSize: 9.5 }}>
                    {BAR_LABELS.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dash-scroll { overflow-x: auto; scrollbar-width: thin; direction: ltr; }
        .dash-scroll::-webkit-scrollbar { height: 6px; }
        .dash-scroll::-webkit-scrollbar-thumb { background: rgba(54,120,255,.3); border-radius: 3px; }
        .wf-ic { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; margin-bottom: 8px; }
        .wf-title { font-weight: 700; font-size: 13.5px; }
        .wf-sub { color: var(--muted); font-size: 11px; margin-top: 2px; white-space: nowrap; }
        .wf-branch { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
        .wf-branch .wf-ic { margin-bottom: 0; width: 28px; height: 28px; flex: none; }
        .wf-conn .wf-dot { animation: wfDot 2.4s linear infinite; }
        @keyframes wfDot { 0% { cx: 2; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { cx: 44; opacity: 0; } }
        .dash-node { position: relative; }
      `}</style>
    </section>
  )
}
