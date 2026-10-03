import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

/**
 * Brand badge — chip-style VENA TECH mark.
 * NOTE: replace with the real uploaded chip image at /public/brand/vena-chip.webp
 * (keep aspect ratio, do not distort) and swap the <BrandChip /> below for an <img>.
 */
export function BrandChip({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="VENA TECH — תג מותג">
      <defs>
        <linearGradient id="chipG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#23B7FF" />
          <stop offset="1" stopColor="#B245FF" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="84" height="84" rx="16" fill="#050812" stroke="url(#chipG)" strokeWidth="2.5" />
      <g stroke="url(#chipG)" strokeWidth="2" opacity="0.6" fill="none">
        <path d="M20 28h14M20 48h11M20 68h14M76 28H62M76 48h-11M76 68H62" />
        <circle cx="20" cy="28" r="2.5" fill="#20E4FF" stroke="none" />
        <circle cx="20" cy="68" r="2.5" fill="#B245FF" stroke="none" />
        <circle cx="76" cy="28" r="2.5" fill="#7B4DFF" stroke="none" />
        <circle cx="76" cy="68" r="2.5" fill="#23B7FF" stroke="none" />
      </g>
      <rect x="34" y="30" width="28" height="36" rx="6" fill="none" stroke="url(#chipG)" strokeWidth="2.5" />
      <text
        x="48"
        y="51"
        textAnchor="middle"
        fontFamily="Heebo, sans-serif"
        fontWeight="800"
        fontSize="9"
        fill="#fff"
        letterSpacing="0.5"
      >
        VENA
      </text>
      <text
        x="48"
        y="61"
        textAnchor="middle"
        fontFamily="Heebo, sans-serif"
        fontWeight="800"
        fontSize="9"
        fill="#9fdcff"
        letterSpacing="0.5"
      >
        TECH
      </text>
    </svg>
  )
}

export default function FinalCTA() {
  return (
    <section
      id="cta"
      className="relative flex flex-col items-center justify-center text-center"
      style={{ padding: '140px 24px 80px', zIndex: 1 }}
      aria-label="צרו קשר — הכניסו AI לעסק"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 0.61, 0.24, 1] }}
        className="flex flex-col items-center"
      >
        <h2 className="font-extrabold" style={{ fontSize: 'clamp(34px, 4.5vw, 64px)', lineHeight: 1.08 }}>
          מוכנים להכניס <span className="grad-text">AI</span> לעסק?
        </h2>
        <p className="mt-5" style={{ color: 'var(--muted)', fontSize: 17, maxWidth: 520, lineHeight: 1.6 }}>
          בואו נבנה מערכת שעובדת בשבילכם גם כשאתם לא עובדים.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
          <a href="#cta" className="btn btn-primary">
            קבעו שיחת אסטרטגיה
          </a>
          <a href="#hero" className="btn btn-glass">
            <Mic size={17} aria-hidden="true" />
            דברו עם סוכן ה-AI
          </a>
        </div>
      </motion.div>

      <footer className="flex flex-col items-center gap-3 mt-20" style={{ color: 'var(--muted)', fontSize: 13 }}>
        <BrandChip size={52} />
        <div className="font-bold" style={{ color: '#fff', letterSpacing: '.05em' }}>
          VENA TECH
        </div>
        <div>מערכות AI · אוטומציות · סוכנים קוליים</div>
      </footer>
    </section>
  )
}
