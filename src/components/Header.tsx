import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { useCart } from '../cart'

const links = [
  { to: '/', label: 'דף הבית' },
  { to: '/catalog', label: 'כל המוצרים' },
  { to: '/branches', label: 'סניפים ומשלוחים' },
  { to: '/faq', label: 'שאלות נפוצות' },
]

export default function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="topbar">
        משלוח <strong>{formatPrice(site.shipping.deliveryFee)}</strong> לכל הארץ · חינם בקנייה
        מעל <strong>{formatPrice(site.shipping.freeDeliveryFrom)}</strong> · מינימום הזמנה
        למשלוח {formatPrice(site.shipping.minOrderForDelivery)}
      </div>
      <header className="header">
        <div className="container header-inner">
          <button
            className="menu-toggle"
            aria-label={open ? 'סגירת תפריט' : 'פתיחת תפריט'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
          <Link to="/" className="logo" onClick={() => setOpen(false)}>
            <span className="logo-mark" aria-hidden>
              🛒
            </span>
            <span>
              {site.name}
              <small>{site.tagline}</small>
            </span>
          </Link>
          <nav className={`nav${open ? ' open' : ''}`} aria-label="ניווט ראשי">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/cart" className="cart-btn" aria-label={`עגלת קניות – ${count} פריטים`}>
            🛒
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>
        </div>
      </header>
    </>
  )
}
