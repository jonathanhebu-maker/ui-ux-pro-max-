import { useEffect, useState } from 'react'

let notify: ((msg: string) => void) | null = null

export function showToast(msg: string) {
  notify?.(msg)
}

export default function Toast() {
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    notify = (m: string) => {
      setMsg(m)
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(null), 2200)
    }
    return () => {
      notify = null
      clearTimeout(timer)
    }
  }, [])

  if (!msg) return null
  return (
    <div className="toast" role="status">
      {msg}
    </div>
  )
}
