import { Link } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { useAuth } from '../auth'
import NotificationBell from './NotificationBell'

/** כותרת אפליקציה קומפקטית – לוגו, התראות וכניסה */
export default function Header() {
  const { user, logout } = useAuth()

  return (
    <>
      <div className="topbar">
        משלוח <strong>{formatPrice(site.shipping.deliveryFee)}</strong> לכל הארץ · חינם מעל{' '}
        <strong>{formatPrice(site.shipping.freeDeliveryFrom)}</strong>
      </div>
      <header className="header">
        <div className="app-container header-inner">
          <Link to="/" className="logo">
            {site.logo ? (
              <img className="logo-img" src={site.logo} alt={site.name} />
            ) : (
              <span className="logo-mark" aria-hidden>
                🛒
              </span>
            )}
            <span>
              {site.name}
              <small>{site.tagline}</small>
            </span>
          </Link>
          <div className="header-actions">
            {user ? (
              <>
                <NotificationBell />
                <button
                  className="user-exit"
                  onClick={logout}
                  aria-label="התנתקות"
                  title="התנתקות"
                >
                  יציאה
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-ghost btn-sm">
                התחברות
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
