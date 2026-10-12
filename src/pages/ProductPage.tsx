import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { byCategory, getCategory, getProduct } from '../data/products'
import { useCart } from '../cart'
import { showToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import QtyPicker from '../components/QtyPicker'

export default function ProductPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const [qty, setQty] = useState(1)

  const product = productId ? getProduct(productId) : undefined
  if (!product) {
    return (
      <section className="section">
        <div className="container empty-state">
          <span aria-hidden>😕</span>
          <p>המוצר לא נמצא.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 12 }}>
            לכל המוצרים
          </Link>
        </div>
      </section>
    )
  }

  const category = getCategory(product.categoryId)
  const related = byCategory(product.categoryId)
    .filter((p) => p.id !== product.id)
    .slice(0, 4)

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumbs" aria-label="פירורי לחם">
          <Link to="/">דף הבית</Link> / <Link to="/catalog">כל המוצרים</Link>
          {category && (
            <>
              {' '}
              / <Link to={`/catalog/${category.id}`}>{category.name}</Link>
            </>
          )}{' '}
          / {product.name}
        </nav>

        <div className="product-page">
          <div className="product-media">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <span aria-hidden>{product.emoji}</span>
            )}
          </div>
          <div className="product-info">
            {product.badge && <span className="product-badge" style={{ position: 'static' }}>{product.badge}</span>}
            <h1>{product.name}</h1>
            <p className="desc">{product.description}</p>
            <div className="price-row">
              <span className="price">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <span className="old-price">{formatPrice(product.oldPrice)}</span>
              )}
              {product.unit && <span className="unit">ל{product.unit}</span>}
            </div>
            <div className="buy-row">
              <QtyPicker value={qty} onChange={setQty} />
              <button
                className="btn btn-primary"
                onClick={() => {
                  add(product.id, qty)
                  showToast('המוצר נוסף לעגלה ✓')
                }}
              >
                הוסיפו לעגלה
              </button>
              <button
                className="btn btn-accent"
                onClick={() => {
                  add(product.id, qty)
                  navigate('/cart')
                }}
              >
                קנו עכשיו
              </button>
            </div>
            <div className="info-list">
              <div>
                🚚 <b>משלוח עד הבית:</b> {formatPrice(site.shipping.deliveryFee)} ·{' '}
                {site.shipping.eta}
              </div>
              <div>
                🏬 <b>איסוף עצמי חינם</b> מהסניפים – ללא מינימום הזמנה
              </div>
              <div>
                💰 <b>מינימום הזמנה למשלוח:</b> {formatPrice(site.shipping.minOrderForDelivery)}
                {' '}· משלוח חינם מעל {formatPrice(site.shipping.freeDeliveryFrom)}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: 56 }}>
              <h2>אולי יעניין אתכם גם</h2>
            </div>
            <div className="product-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
