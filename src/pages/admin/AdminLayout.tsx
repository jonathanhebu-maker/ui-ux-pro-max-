import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth'
import { getDB } from '../../db'

const tabs = [
  { to: '/admin', label: '📊 אנליטיקות', end: true },
  { to: '/admin/users', label: '👥 לקוחות' },
  { to: '/admin/products', label: '📦 מוצרים והנחות' },
  { to: '/admin/orders', label: '🧾 הזמנות' },
  { to: '/admin/messages', label: '✉️ יומן הודעות' },
  { to: '/admin/settings', label: '⚙️ הגדרות' },
]

export default function AdminLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  const pending = getDB().users.filter((u) => u.status === 'pending').length

  return (
    <section className="section" style={{ paddingTop: 28 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <h2>פאנל ניהול</h2>
            <p>ניהול לקוחות, מוצרים, הזמנות ואנליטיקות</p>
          </div>
        </div>
        <nav className="admin-tabs" aria-label="ניווט ניהול">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `chip${isActive ? ' active' : ''}`}>
              {t.label}
              {t.to === '/admin/users' && pending > 0 && <span className="pending-dot">{pending}</span>}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </section>
  )
}
