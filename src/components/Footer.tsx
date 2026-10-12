import { Link } from 'react-router-dom'
import { site } from '../config'
import { categories } from '../data/products'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>{site.name}</h4>
            <p style={{ fontSize: '0.92rem', maxWidth: '36ch' }}>
              חנות המפעל – מוצרים לבית במחירי מפעל, ישירות מהיבואן לצרכן. איכות גבוהה,
              מחירים נמוכים, שירות אישי.
            </p>
          </div>
          <div>
            <h4>קטגוריות</h4>
            {categories.slice(0, 5).map((c) => (
              <Link key={c.id} to={`/catalog/${c.id}`}>
                {c.name}
              </Link>
            ))}
          </div>
          <div>
            <h4>מידע</h4>
            <Link to="/branches">סניפים ומשלוחים</Link>
            <Link to="/faq">שאלות נפוצות</Link>
            <Link to="/cart">עגלת קניות</Link>
          </div>
          <div>
            <h4>יצירת קשר</h4>
            <a href={`tel:${site.phone.replace(/-/g, '')}`}>טלפון: {site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              וואטסאפ
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.name} – כל הזכויות שמורות
          </span>
          <span>האתר נבנה באהבה ❤️</span>
        </div>
      </div>
    </footer>
  )
}
