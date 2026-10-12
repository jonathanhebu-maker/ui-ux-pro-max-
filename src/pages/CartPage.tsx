import { Link, useNavigate } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { useCart } from '../cart'
import { useAuth } from '../auth'
import { priceFor, vatPortion, vatRate } from '../pricing'
import QtyPicker from '../components/QtyPicker'

export default function CartPage() {
  const { itemsDetailed, setQty, remove } = useCart()
  const { user } = useAuth()
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

  // חישוב לפי מחירי הלקוח (עם הנחת קטגוריה אם יש)
  const listTotal = itemsDetailed.reduce((s, i) => s + i.product.price * i.qty, 0)
  const subtotal = itemsDetailed.reduce((s, i) => s + priceFor(user, i.product) * i.qty, 0)
  const discountTotal = listTotal - subtotal

  const { minOrderForDelivery, deliveryFee, freeDeliveryFrom } = site.shipping
  const deliveryEligible = subtotal >= minOrderForDelivery
  const freeDelivery = subtotal >= freeDeliveryFrom
  const shipping = freeDelivery ? 0 : deliveryFee
  const total = subtotal + shipping
  const vat = vatPortion(total)

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>עגלת הקניות שלכם</h2>
        </div>
        <div className="cart-layout">
          <div className="cart-list">
            {itemsDetailed.map(({ product, qty }) => {
              const myPrice = priceFor(user, product)
              return (
                <div className="cart-line" key={product.id}>
                  <Link to={`/product/${product.id}`} className="thumb" aria-hidden>
                    {product.image ? <img src={product.image} alt="" /> : product.emoji}
                  </Link>
                  <div>
                    <h4>
                      <Link to={`/product/${product.id}`}>{product.name}</Link>
                    </h4>
                    <span className="unit">
                      {myPrice < product.price ? (
                        <>
                          <s>{formatPrice(product.price)}</s> {formatPrice(myPrice)} ליחידה
                        </>
                      ) : (
                        <>{formatPrice(product.price)} ליחידה</>
                      )}
                    </span>
                  </div>
                  <QtyPicker value={qty} onChange={(v) => setQty(product.id, v)} min={0} />
                  <span className="line-total">{formatPrice(myPrice * qty)}</span>
                  <button
                    className="remove-btn"
                    aria-label={`הסרת ${product.name} מהעגלה`}
                    onClick={() => remove(product.id)}
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>

          <aside className="summary-card">
            <h3>סיכום הזמנה</h3>
            <div className="summary-row">
              <span>מחיר מחירון</span>
              <span>{formatPrice(listTotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="summary-row" style={{ color: 'var(--green-700)', fontWeight: 700 }}>
                <span>הנחת לקוח</span>
                <span>-{formatPrice(discountTotal)}</span>
              </div>
            )}
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
                הוסיפו עוד {formatPrice(minOrderForDelivery - subtotal)} כדי להגיע למינימום
                ההזמנה למשלוח ({formatPrice(minOrderForDelivery)}). איסוף עצמי – ללא מינימום.
              </div>
            )}
            {deliveryEligible && !freeDelivery && (
              <div className="notice">עוד {formatPrice(freeDeliveryFrom - subtotal)} ותקבלו משלוח חינם!</div>
            )}
            <div className="summary-row total">
              <span>סה"כ כולל מע"מ ({vatRate()}%)</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="summary-row" style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              <span>מתוכו מע"מ</span>
              <span>{formatPrice(vat)}</span>
            </div>
            {!user && (
              <div className="notice">
                <Link to="/login" style={{ textDecoration: 'underline', fontWeight: 700 }}>
                  התחברו
                </Link>{' '}
                כדי לקבל את המחירים שלכם ולהשלים הזמנה.
              </div>
            )}
            <button
              className="btn btn-accent"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => navigate(user ? '/checkout' : '/login')}
            >
              להשלמת ההזמנה
            </button>
            <Link to="/catalog" className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10 }}>
              המשיכו לקנות
            </Link>
          </aside>
        </div>
      </div>
    </section>
  )
}
