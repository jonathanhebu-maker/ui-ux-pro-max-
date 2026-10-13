import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { getProduct } from '../data/products'
import ProductCard from '../components/ProductCard'

export default function FavoritesPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <section className="section">
        <div className="container empty-state">
          <span aria-hidden>❤️</span>
          <p>התחברו כדי לשמור ולראות מוצרים שאהבתם.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 12 }}>
            התחברות
          </Link>
        </div>
      </section>
    )
  }

  const liked = user.likes.map(getProduct).filter((p) => !!p)

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>המועדפים שלי ❤️</h2>
            <p>{liked.length > 0 ? `${liked.length} מוצרים שמורים` : 'עדיין אין מוצרים שמורים'}</p>
          </div>
        </div>
        {liked.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden>🤍</span>
            <p>לחצו על הלב בכל מוצר כדי לשמור אותו כאן.</p>
            <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 12 }}>
              לקטלוג
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {liked.map((p) => (
              <ProductCard key={p!.id} product={p!} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
