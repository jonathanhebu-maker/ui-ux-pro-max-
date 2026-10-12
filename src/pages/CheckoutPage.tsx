import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { useCart } from '../cart'
import { useAuth } from '../auth'
import { getDB, saveDB, uid, getSku } from '../db'
import { priceFor, vatPortion, vatRate } from '../pricing'
import { notifyAdmin, notifyUser, sendMessage, track } from '../notify'
import type { Order, PaymentMethod } from '../types'

type Method = 'delivery' | 'pickup'
type Step = 'details' | 'credit' | 'done'

const payLabels: Record<PaymentMethod, string> = {
  cash: '💵 מזומן במשלוח/באיסוף',
  credit: '💳 כרטיס אשראי',
  check: "📝 צ'ק",
}

export default function CheckoutPage() {
  const { itemsDetailed, clear } = useCart()
  const { user } = useAuth()
  const [method, setMethod] = useState<Method>('delivery')
  const [payment, setPayment] = useState<PaymentMethod>('cash')
  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState({
    city: '',
    address: '',
    notes: '',
    branch: (site.branches[0]?.city ?? '') as string,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const orderRef = useRef<Order | null>(null)

  // מעקב: לקוח שהגיע לשלב תשלום אשראי ויצא בלי לשלם
  const creditPendingRef = useRef(false)
  useEffect(() => {
    return () => {
      if (creditPendingRef.current && user) {
        track('checkout_abandoned', user.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) return <Navigate to="/login" replace />

  if (step === 'done') {
    return (
      <section className="section">
        <div className="container">
          <div className="success-box">
            <div className="big" aria-hidden>🎉</div>
            <h2>ההזמנה התקבלה!</h2>
            <p>
              מספר הזמנה: <b>{orderRef.current?.id.slice(0, 8).toUpperCase()}</b>
              <br />
              שלחנו אישור ב-SMS ובמייל. ניצור קשר לתיאום{' '}
              {method === 'delivery' ? 'המשלוח' : 'האיסוף'}.
            </p>
            <Link to="/account" className="btn btn-primary">
              לצפייה בהזמנות שלי
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

  const listTotal = itemsDetailed.reduce((s, i) => s + i.product.price * i.qty, 0)
  const subtotal = itemsDetailed.reduce((s, i) => s + priceFor(user, i.product) * i.qty, 0)
  const discountTotal = listTotal - subtotal
  const { minOrderForDelivery, deliveryFee, freeDeliveryFrom } = site.shipping
  const freeDelivery = subtotal >= freeDeliveryFrom
  const shipping = method === 'delivery' && !freeDelivery ? deliveryFee : 0
  const total = subtotal + shipping
  const vat = vatPortion(total)
  const deliveryBlocked = method === 'delivery' && subtotal < minOrderForDelivery

  function createOrder(status: Order['status']): Order {
    const order: Order = {
      id: uid(),
      userId: user!.id,
      lines: itemsDetailed.map(({ product, qty }) => ({
        productId: product.id,
        sku: getSku(product.id, product.sku),
        name: product.name,
        qty,
        unitPrice: product.price,
        unitPriceAfter: priceFor(user, product),
      })),
      listTotal,
      discountTotal,
      shipping,
      total,
      vatRate: vatRate(),
      vatAmount: vat,
      method,
      paymentMethod: payment,
      status,
      customerName: user!.name,
      customerPhone: user!.phone,
      address: method === 'delivery' ? `${form.address}, ${form.city}` : `איסוף מסניף ${form.branch}`,
      notes: form.notes,
      createdAt: Date.now(),
    }
    getDB().orders.unshift(order)
    saveDB()
    return order
  }

  function finalizeOrder(order: Order) {
    track('order_placed', user!.id)
    notifyAdmin(
      'הזמנה חדשה 🛒',
      `${user!.name} – ${formatPrice(order.total)} (${payLabels[order.paymentMethod]}), ${order.lines.length} פריטים.`,
    )
    notifyUser(user!.id, 'ההזמנה התקבלה ✓', `הזמנה על סך ${formatPrice(order.total)} נקלטה. ניצור קשר לתיאום.`)
    sendMessage(
      user!,
      `${site.name} – אישור הזמנה`,
      `שלום ${user!.name}, הזמנתך על סך ${formatPrice(order.total)} (כולל מע"מ ${order.vatRate}%) התקבלה. תודה שקניתם אצלנו!`,
    )
    clear()
    orderRef.current = order
    creditPendingRef.current = false
    setStep('done')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (method === 'delivery') {
      if (!form.city.trim()) next.city = 'נא למלא עיר'
      if (!form.address.trim()) next.address = 'נא למלא כתובת למשלוח'
    }
    setErrors(next)
    if (Object.keys(next).length > 0 || deliveryBlocked) return

    track('checkout_started', user!.id)
    if (payment === 'credit') {
      creditPendingRef.current = true
      setStep('credit')
      return
    }
    finalizeOrder(createOrder('confirmed'))
  }

  if (step === 'credit') {
    return (
      <section className="section">
        <div className="container auth-box">
          <h2>תשלום מאובטח 💳</h2>
          <div className="notice warn" style={{ marginBlock: 14 }}>
            דמו: כאן יחובר דף סליקה אמיתי (Grow / Tranzila / משולם). לא נגבה תשלום.
          </div>
          <div className="summary-row total" style={{ marginBottom: 18 }}>
            <span>לתשלום כולל מע"מ ({vatRate()}%)</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button
            className="btn btn-accent"
            style={{ width: '100%' }}
            onClick={() => finalizeOrder(createOrder('paid'))}
          >
            אישור תשלום (דמו)
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', marginTop: 10 }}
            onClick={() => {
              creditPendingRef.current = false
              track('checkout_abandoned', user!.id)
              setStep('details')
            }}
          >
            חזרה לפרטי ההזמנה
          </button>
        </div>
      </section>
    )
  }

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
                <small>{freeDelivery ? 'חינם בהזמנה זו 🎉' : `${formatPrice(deliveryFee)} · ${site.shipping.eta}`}</small>
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
                משלוח אפשרי בהזמנה מעל {formatPrice(minOrderForDelivery)}. הוסיפו מוצרים או בחרו איסוף עצמי.
              </div>
            )}

            <h3 style={{ marginBottom: 14 }}>אמצעי תשלום</h3>
            <div className="radio-cards" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {(Object.keys(payLabels) as PaymentMethod[]).map((pm) => (
                <div
                  key={pm}
                  className={`radio-card${payment === pm ? ' selected' : ''}`}
                  role="radio"
                  aria-checked={payment === pm}
                  tabIndex={0}
                  onClick={() => setPayment(pm)}
                  onKeyDown={(e) => e.key === 'Enter' && setPayment(pm)}
                >
                  <b>{payLabels[pm]}</b>
                  <small>{pm === 'credit' ? 'תשלום מיידי באתר' : 'תשלום מול נציג'}</small>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: 14 }}>פרטי {method === 'delivery' ? 'משלוח' : 'איסוף'}</h3>
            <div className="form-grid">
              <div className="field">
                <label>שם מלא</label>
                <input value={user.name} disabled />
              </div>
              <div className="field">
                <label>טלפון</label>
                <input value={user.phone} disabled dir="ltr" style={{ textAlign: 'end' }} />
              </div>
              {method === 'delivery' ? (
                <>
                  <div className="field">
                    <label htmlFor="city">עיר *</label>
                    <input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} autoComplete="address-level2" />
                    {errors.city && <span className="error">{errors.city}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="address">רחוב ומספר בית *</label>
                    <input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} autoComplete="street-address" />
                    {errors.address && <span className="error">{errors.address}</span>}
                  </div>
                </>
              ) : (
                <div className="field full">
                  <label htmlFor="branch">סניף לאיסוף</label>
                  <select id="branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
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
                <textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="קומה, קוד כניסה, שעות נוחות…" />
              </div>
            </div>

            <button type="submit" className="btn btn-accent" style={{ marginTop: 24, width: '100%' }} disabled={deliveryBlocked}>
              {payment === 'credit' ? 'המשך לתשלום מאובטח' : 'אישור ושליחת ההזמנה'}
            </button>
          </form>

          <aside className="summary-card">
            <h3>ההזמנה שלכם</h3>
            {itemsDetailed.map(({ product, qty }) => (
              <div className="summary-row" key={product.id}>
                <span>
                  {product.name} ×{qty}
                </span>
                <span>{formatPrice(priceFor(user, product) * qty)}</span>
              </div>
            ))}
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
              <span>משלוח</span>
              <span>{shipping === 0 ? 'חינם' : formatPrice(shipping)}</span>
            </div>
            <div className="summary-row total">
              <span>סה"כ כולל מע"מ ({vatRate()}%)</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="summary-row" style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              <span>מתוכו מע"מ</span>
              <span>{formatPrice(vat)}</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
