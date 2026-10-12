import { Link, useNavigate } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { useCart } from '../cart'
import QtyPicker from '../components/QtyPicker'

export default function CartPage() {
  const { itemsDetailed, subtotal, setQty, remove } = useCart()
  const navigate = useNavigate()

  if (itemsDetailed.length === 0) {
    return (
      <section className="section">
        <div className="container empty-state">
          <span aria-hidden>🛒</span>
          <p>העגלה שלכם ריקה כרגע.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 12 }}>
            התחילו לקנות
          </Link>
        </div>
      </section>
    )
  }

  const { minOrderForDelivery, deliveryFee, freeDeliveryFrom } = site.shipping
  const deliveryEligible = subtotal >= minOrderForDelivery
  const freeDelivery = subtotal >= freeDeliveryFrom
  const remainingForDelivery = minOrderForDelivery - subtotal
  const remainingForFree = freeDeliveryFrom - subtotal

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>עגלת הקניות שלכם</h2>
        </div>
        <div className="cart-layout">
          <div className="cart-list">
            {itemsDetailed.map(({ product, qty, total }) => (
              <div className="cart-line" key={product.id}>
                <Link to={`/product/${product.id}`} className="thumb" aria-hidden>
                  {product.image ? <img src={product.image} alt="" /> : product.emoji}
                </Link>
                <div>
                  <h4>
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                  </h4>
                  <span className="unit">{formatPrice(product.price)} ליחידה</span>
                </div>
                <QtyPicker value={qty} onChange={(v) => setQty(product.id, v)} min={0} />
                <span className="line-total">{formatPrice(total)}</span>
                <button
                  className="remove-btn"
                  aria-label={`הסרת ${product.name} מהעגלה`}
                  onClick={() => remove(product.id)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <h3>סיכום הזמנה</h3>
            <div className="summary-row">
              <span>סכום ביניים</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>משלוח</span>
              <span>{freeDelivery ? 'חינם 🎉' : formatPrice(deliveryFee)}</span>
            </div>
            {!deliveryEligible && (
              <div className="notice warn">
                הוסיפו עוד {formatPrice(remainingForDelivery)} כדי להגיע למינימום ההזמנה
                למשלוח ({formatPrice(minOrderForDelivery)}). איסוף עצמי מהסניף – ללא
                מינימום.
              </div>
            )}
            {deliveryEligible && !freeDelivery && (
              <div className="notice">
                עוד {formatPrice(remainingForFree)} ותקבלו משלוח חינם!
              </div>
            )}
            <div className="summary-row total">
              <span>סה״כ (כולל משלוח)</span>
              <span>{formatPrice(subtotal + (freeDelivery ? 0 : deliveryFee))}</span>
            </div>
            <button
              className="btn btn-accent"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => navigate('/checkout')}
            >
              להשלמת ההזמנה
            </button>
            <Link
              to="/catalog"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: 10 }}
            >
              המשיכו לקנות
            </Link>
          </aside>
        </div>
      </div>
    </section>
  )
}
