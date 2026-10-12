/**
 * רכיבי גרפים קלים ב-SVG, מותאמים ל-RTL ולעברית.
 * פלטה קטגוריאלית בסדר קבוע שעברה בדיקת נגישות לעיוורון צבעים.
 */
import { useState } from 'react'

/** פלטה קטגוריאלית מאומתת – הסדר קבוע, לעולם לא ממוחזר */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6']
const SEQ = '#0e5e4a' // גוון יחיד לעוצמה (סדרה אחת)

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

interface BarDatum {
  label: string
  value: number
  hint?: string
}

/** גרף עמודות אופקי (סדרה אחת – גוון יחיד), ערכים בקצה העמודה */
export function HBarChart({ data, format = (v: number) => String(v) }: { data: BarDatum[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="hbar" role="img" aria-label={data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')}>
      {data.map((d) => (
        <div className="hbar-row" key={d.label} title={d.hint ?? `${d.label}: ${format(d.value)}`}>
          <span className="hbar-label">{d.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: SEQ }} />
          </span>
          <span className="hbar-value">{format(d.value)}</span>
        </div>
      ))}
      {data.length === 0 && <p className="unit">אין נתונים עדיין</p>}
    </div>
  )
}

interface StackKey {
  key: string
  label: string
}

interface StackDatum {
  label: string
  values: Record<string, number>
}

/** עמודות אופקיות מוערמות – פילוח לפי קטגוריית לקוח, עם מקרא */
export function StackedHBar({ data, keys, format = (v: number) => String(v) }: { data: StackDatum[]; keys: StackKey[]; format?: (v: number) => string }) {
  const totals = data.map((d) => keys.reduce((s, k) => s + (d.values[k.key] || 0), 0))
  const max = Math.max(1, ...totals)
  return (
    <div>
      <div className="legend">
        {keys.map((k, i) => (
          <span key={k.key} className="legend-item">
            <span className="legend-swatch" style={{ background: SERIES[i % SERIES.length] }} />
            {k.label}
          </span>
        ))}
      </div>
      <div className="hbar">
        {data.map((d, di) => (
          <div className="hbar-row" key={d.label}>
            <span className="hbar-label">{d.label}</span>
            <span className="hbar-track">
              {keys.map((k, i) => {
                const v = d.values[k.key] || 0
                if (v === 0) return null
                return (
                  <span
                    key={k.key}
                    className="hbar-fill seg"
                    style={{ width: `${(v / max) * 100}%`, background: SERIES[i % SERIES.length] }}
                    title={`${d.label} – ${k.label}: ${format(v)}`}
                  />
                )
              })}
            </span>
            <span className="hbar-value">{format(totals[di])}</span>
          </div>
        ))}
        {data.length === 0 && <p className="unit">אין נתונים עדיין</p>}
      </div>
    </div>
  )
}

interface DonutSegment {
  label: string
  value: number
}

/** דונאט – התפלגות (למשל אמצעי תשלום), עם מקרא וערכים */
export function Donut({ data, format = (v: number) => String(v) }: { data: DonutSegment[]; format?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="unit">אין נתונים עדיין</p>
  const R = 56
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label={data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')}>
        <g transform="rotate(-90 80 80)">
          {data.map((d, i) => {
            const frac = d.value / total
            const seg = (
              <circle
                key={d.label}
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={SERIES[i % SERIES.length]}
                strokeWidth={hover === i ? 26 : 22}
                strokeDasharray={`${Math.max(0, frac * C - 2)} ${C - Math.max(0, frac * C - 2)}`}
                strokeDashoffset={-offset * C}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{`${d.label}: ${format(d.value)} (${Math.round(frac * 100)}%)`}</title>
              </circle>
            )
            offset += frac
            return seg
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--ink)">
          {format(total)}
        </text>
        <text x="80" y="94" textAnchor="middle" fontSize="10" fill="var(--muted)">
          סה"כ
        </text>
      </svg>
      <div className="legend" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        {data.map((d, i) => (
          <span key={d.label} className="legend-item">
            <span className="legend-swatch" style={{ background: SERIES[i % SERIES.length] }} />
            {d.label} – {format(d.value)} ({Math.round((d.value / total) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  )
}
