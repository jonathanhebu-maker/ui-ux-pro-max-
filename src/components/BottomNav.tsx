import { NavLink } from 'react-router-dom'
import { useCart } from '../cart'
import { useAuth } from '../auth'

/** סרגל ניווט תחתון – כמו באפליקציה נייטיבית */
export default function BottomNav() {
  const { count } = useCart()
  const { user } = useAuth()

  const tabs = [
    { to: '/', label: 'בית', icon: '🏠', end: true },
    { to: '/catalog', label: 'קטגוריות', icon: '🛍️' },
    { to: '/cart', label: 'עגלה', icon: '🛒', badge: count },
    { to: '/favorites', label: 'מועדפים', icon: '❤️' },
    user?.role === 'admin'
      ? { to: '/admin', label: 'ניהול', icon: '🛠️' }
      : { to: user ? '/account' : '/login', label: 'אני', icon: '👤' },
  ]

  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {tabs.map((t) => (
        <NavLink
          key={t.label}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}
        >
          <span className="tab-icon" aria-hidden>
            {t.icon}
            {!!t.badge && t.badge > 0 && <span className="cart-badge">{t.badge}</span>}
          </span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
