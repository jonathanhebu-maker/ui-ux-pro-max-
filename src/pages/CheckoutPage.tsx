import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { useCart } from '../cart'

type Method = 'delivery' | 'pickup'

interface FormState {
  name: string
  phone: string
  city: string
  address: string
  notes: string
  branch: string
}

export default function CheckoutPage() {
  const { itemsDetailed, subtotal, clear } = useCart()
  const [method, setMethod] = useState<Method>('delivery')
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
    branch: site.branches[0]?.city ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [sent, setSent] = useState(false)

  const { minOrderForDelivery, deliveryFee, freeDeliveryFrom } = site.shipping
  const freeDelivery = subtotal >= freeDeliveryFrom
  const shippingCost = method === 'delivery' && !freeDelivery ? deliveryFee : 0
  const total = subtotal + shippingCost
  const deliveryBlocked = method === 'delivery' && subtotal < minOrderForDelivery

  if (sent) {
    return (
      <section className="section">
        <div className="container">
          <div className="success-box">
            <div className="big" aria-hidden>
              🎉
            </div>
            <h2>ההזמנה נשלחה!</h2>
            <p>
              פרטי ההזמנה נפתחו בוואטסאפ – שלחו את ההודעה ואנחנו נחזור אליכם עם אישור
              ותיאום {method === 'delivery' ? 'משלוח' : 'איסוף'}.
            </p>
            <Link to="/" className="btn btn-primary">
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (itemsDetailed.length === 0) {
    return (
      <section className="section">
        <div className="container empty-state">
          <span aria-hidden>🛒</span>
          <p>אין פריטים בעגלה – אי אפשר להשלים הזמנה.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 12 }}>
            לכל המוצרים
          </Link>
        </div>
      </section>
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'נא למלא שם מלא'
    if (!/^0\d{1,2}-?\d{7}$/.test(form.phone.replace(/\s/g, '')))
      next.phone = 'נא למלא מספר טלפון ישראלי תקין'
    if (method === 'delivery') {
      if (!form.city.trim()) next.city = 'נא למלא עיר'
      if (!form.address.trim()) next.address = 'נא למלא כתובת למשלוח'
    }
    setErrors(next)
    if (Object.keys(next).length > 0 || deliveryBlocked) return

    const lines = itemsDetailed
      .map(({ product, qty, total }) => `• ${product.name} ×${qty} – ${formatPrice(total)}`)
      .join('\n')
    const dest =
      method === 'delivery'
        ? `משלוח לכתובת: ${form.address}, ${form.city}`
        : `איסוף עצמי מסניף ${form.branch}`
    const msg = [
      `הזמנה חדשה מהאתר 🛒`,
      `שם: ${form.name}`,
      `טלפון: ${form.phone}`,
      dest,
      form.notes ? `הערות: ${form.notes}` : '',
      '',
      lines,
      '',
      `סכום ביניים: ${formatPrice(subtotal)}`,
      `משלוח: ${shippingCost === 0 ? 'חינם' : formatPrice(shippingCost)}`,
      `סה״כ לתשלום: ${formatPrice(total)}`,
    ]
      .filter(Boolean)
      .join('\n')

    window.open(
      `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener',
    )
    clear()
    setSent(true)
  }

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumbs" aria-label="פירורי לחם">
          <Link to="/">דף הבית</Link> / <Link to="/cart">עגלת קניות</Link> / השלמת הזמנה
        </nav>
        <div className="section-head">
          <h2>השלמת הזמנה</h2>
        </div>
        <div className="cart-layout">
          <form onSubmit={submit} noValidate>
            <h3 style={{ marginBottom: 14 }}>איך תרצו לקבל את ההזמנה?</h3>
            <div className="radio-cards" style={{ marginBottom: 24 }}>
              <div
                className={`radio-card${method === 'delivery' ? ' selected' : ''}`}
                role="radio"
                aria-checked={method === 'delivery'}
                tabIndex={0}
                onClick={() => setMethod('delivery')}
                onKeyDown={(e) => e.key === 'Enter' && setMethod('delivery')}
              >
                <b>🚚 משלוח עד הבית</b>
                <small>
                  {freeDelivery ? 'חינם בהזמנה זו 🎉' : `${formatPrice(deliveryFee)} · ${site.shipping.eta}`}
                </small>
              </div>
              <div
                className={`radio-card${method === 'pickup' ? ' selected' : ''}`}
                role="radio"
                aria-checked={method === 'pickup'}
                tabIndex={0}
                onClick={() => setMethod('pickup')}
                onKeyDown={(e) => e.key === 'Enter' && setMethod('pickup')}
              >
                <b>🏬 איסוף עצמי מהסניף</b>
                <small>חינם · ללא מינימום הזמנה</small>
              </div>
            </div>

            {deliveryBlocked && (
              <div className="notice warn" role="alert" style={{ marginBottom: 20 }}>
                משלוח אפשרי בהזמנה מעל {formatPrice(minOrderForDelivery)}. הוסיפו מוצרים
                לעגלה או בחרו איסוף עצמי.
              </div>
            )}

            <h3 style={{ marginBottom: 14 }}>פרטים ליצירת קשר</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">שם מלא *</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name')(e.target.value)}
                  autoComplete="name"
                />
                {errors.name && <span className="error">{errors.name}</span>}
              </div>
              <div className="field">
                <label htmlFor="phone">טלפון *</label>
                <input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  style={{ textAlign: 'end' }}
                  value={form.phone}
                  onChange={(e) => set('phone')(e.target.value)}
                  autoComplete="tel"
                  placeholder="050-1234567"
                />
                {errors.phone && <span className="error">{errors.phone}</span>}
              </div>

              {method === 'delivery' ? (
                <>
                  <div className="field">
                    <label htmlFor="city">עיר *</label>
                    <input
                      id="city"
                      value={form.city}
                      onChange={(e) => set('city')(e.target.value)}
                      autoComplete="address-level2"
                    />
                    {errors.city && <span className="error">{errors.city}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="address">רחוב ומספר בית *</label>
                    <input
                      id="address"
                      value={form.address}
                      onChange={(e) => set('address')(e.target.value)}
                      autoComplete="street-address"
                    />
                    {errors.address && <span className="error">{errors.address}</span>}
                  </div>
                </>
              ) : (
                <div className="field full">
                  <label htmlFor="branch">סניף לאיסוף</label>
                  <select
                    id="branch"
                    value={form.branch}
                    onChange={(e) => set('branch')(e.target.value)}
                  >
                    {site.branches.map((b) => (
                      <option key={b.city} value={b.city}>
                        {b.city} – {b.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field full">
                <label htmlFor="notes">הערות להזמנה</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set('notes')(e.target.value)}
                  placeholder="קומה, קוד כניסה, שעות נוחות…"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent"
              style={{ marginTop: 24, width: '100%' }}
              disabled={deliveryBlocked}
            >
              שליחת ההזמנה בוואטסאפ
            </button>
            <p className="unit" style={{ marginTop: 10, textAlign: 'center' }}>
              ההזמנה נשלחת אלינו בוואטסאפ לאישור – התשלום מתבצע מול נציג, בטלפון או
              בסניף.
            </p>
          </form>

          <aside className="summary-card">
            <h3>ההזמנה שלכם</h3>
            {itemsDetailed.map(({ product, qty, total }) => (
              <div className="summary-row" key={product.id}>
                <span>
                  {product.name} ×{qty}
                </span>
                <span>{formatPrice(total)}</span>
              </div>
            ))}
            <div className="summary-row">
              <span>משלוח</span>
              <span>{shippingCost === 0 ? 'חינם' : formatPrice(shippingCost)}</span>
            </div>
            <div className="summary-row total">
              <span>סה״כ לתשלום</span>
              <span>{formatPrice(total)}</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
