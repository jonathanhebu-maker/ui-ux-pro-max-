import { useEffect, useRef, useState } from 'react'
import { getDB, saveDB } from '../db'
import { useAuth } from '../auth'

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null
  const target = user.role === 'admin' ? 'admin' : user.id
  const items = getDB().notifications.filter((n) => n.target === target)
  const unread = items.filter((n) => !n.read).length

  const markAllRead = () => {
    getDB()
      .notifications.filter((n) => n.target === target)
      .forEach((n) => (n.read = true))
    saveDB()
  }

  return (
    <div className="bell-wrap" ref={ref}>
      <button
        className="cart-btn"
        aria-label={`התראות – ${unread} שלא נקראו`}
        onClick={() => {
          setOpen((v) => !v)
          if (!open && unread > 0) markAllRead()
        }}
      >
        🔔
        {unread > 0 && <span className="cart-badge">{unread}</span>}
      </button>
      {open && (
        <div className="bell-panel" role="dialog" aria-label="התראות">
          <h4>התראות</h4>
          {items.length === 0 ? (
            <p className="unit" style={{ padding: '12px 0' }}>
              אין התראות עדיין.
            </p>
          ) : (
            items.slice(0, 15).map((n) => (
              <div className="bell-item" key={n.id}>
                <b>{n.title}</b>
                <p>{n.body}</p>
                <small>{new Date(n.at).toLocaleString('he-IL')}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
