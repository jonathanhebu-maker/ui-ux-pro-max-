import { useEffect, useMemo, useRef, useState } from 'react'

/** prefers-reduced-motion */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setReduced(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

/** coarse pointer = touch device */
export function useIsTouch(): boolean {
  return useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    [],
  )
}

/**
 * Re-triggering viewport observer: `inView` flips true/false every time the
 * element enters/leaves, so sections can replay their sequences.
 */
export function useInViewReplay<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/** true while the browser tab is visible */
export function useTabVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )
  useEffect(() => {
    const fn = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  }, [])
  return visible
}

/** rAF count-up writing directly into a DOM node */
export function countUp(
  el: HTMLElement | null,
  to: number,
  opts: { decimals?: number; duration?: number; prefix?: string; suffix?: string } = {},
) {
  if (!el) return
  const { decimals = 0, duration = 1.2, prefix = '', suffix = '' } = opts
  const start = performance.now()
  const fmt = (v: number) =>
    prefix + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / (duration * 1000))
    const eased = 1 - Math.pow(1 - t, 3)
    el.textContent = fmt(to * eased)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
