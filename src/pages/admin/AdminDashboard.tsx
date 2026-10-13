import { useState } from 'react'
import { formatPrice } from '../../config'
import { getDB, findUser } from '../../db'
import { getProducts, getProduct } from '../../db'
import { StatTile, HBarChart, StackedHBar, Donut } from '../../components/charts'
import { seedDemoData } from '../../demoData'
import { showToast } from '../../components/Toast'

const payLabel = { cash: 'מזומן', credit: 'אשראי', check: "צ'ק" } as const

export default function AdminDashboard() {
  const [, force] = useState(0)
  const [productFilter, setProductFilter] = useState<string>('')
  const db = getDB()
  const orders = db.orders.filter((o) => o.status !== 'cancelled')

  /* ===== חישובי אנליטיקה ===== */
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const totalUnits = orders.reduce((s, o) => s + o.lines.reduce((x, l) => x + l.qty, 0), 0)
  const totalVat = orders.reduce((s, o) => s + o.vatAmount, 0)

  // כמות שנמכרה מכל מוצר, מפולח לפי קטגוריית לקוח
  const perProduct = new Map<string, Record<string, number>>()
  for (const o of orders) {
    const user = findUser(o.userId)
    const catId = user?.categoryId ?? 'unknown'
    for (const l of o.lines) {
      const rec = perProduct.get(l.productId) ?? {}
      rec[catId] = (rec[catId] || 0) + l.qty
      perProduct.set(l.productId, rec)
    }
  }
  const catKeys = db.categories.map((c) => ({ key: c.id, label: c.name }))
  const productStack = [...perProduct.entries()]
    .map(([pid, values]) => ({
      label: getProduct(pid)?.name ?? pid,
      values,
      total: Object.values(values).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // הכנסות לפי קטגוריית לקוח
  const revenueByCat = db.categories.map((c) => ({
    label: c.name,
    value: Math.round(
      orders.filter((o) => findUser(o.userId)?.categoryId === c.id).reduce((s, o) => s + o.total, 0),
    ),
  }))

  // אמצעי תשלום
  const payData = (['cash', 'credit', 'check'] as const).map((pm) => ({
    label: payLabel[pm],
    value: orders.filter((o) => o.paymentMethod === pm).length,
  })).filter((d) => d.value > 0)

  // לקוחות מובילים (אפשר לסנן לפי מוצר ספציפי)
  const customerTotals = new Map<string, number>()
  for (const o of orders) {
    if (productFilter) {
      const line = o.lines.find((l) => l.productId === productFilter)
      if (!line) continue
      customerTotals.set(o.userId, (customerTotals.get(o.userId) || 0) + line.qty)
    } else {
      customerTotals.set(o.userId, (customerTotals.get(o.userId) || 0) + o.total)
    }
  }
  const topCustomers = [...customerTotals.entries()]
    .map(([userId, value]) => ({ label: findUser(userId)?.name ?? 'לא ידוע', value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // סטטוס לקוחות: עגלות נטושות, לייקים, תשלומים שלא הושלמו, צפיות ללא רכישה
  const statusRows = db.users
    .filter((u) => u.role === 'customer' && u.status === 'active')
    .map((u) => {
      const liked = u.likes.length
      const abandonedCheckout = db.events.some((e) => e.type === 'checkout_abandoned' && e.userId === u.id)
      const cartReminder = db.events.some((e) => e.type === 'cart_reminder_sent' && e.userId === u.id)
      const views = db.events.filter((e) => e.type === 'product_view' && e.userId === u.id).length
      const orderCount = orders.filter((o) => o.userId === u.id).length
      return { u, liked, abandonedCheckout, cartReminder, views, orderCount }
    })
    .filter((r) => r.liked || r.abandonedCheckout || r.cartReminder || r.views > 0 || r.orderCount > 0)

  return (
    <div>
      {orders.length === 0 && (
        <div className="notice warn" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          אין עדיין נתוני מכירה. אפשר ליצור נתוני דמו כדי לראות את כל האנליטיקות בפעולה:
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              seedDemoData()
              showToast('נתוני דמו נוצרו')
              force((v) => v + 1)
            }}
          >
            יצירת נתוני דמו
          </button>
        </div>
      )}

      <div className="stat-grid">
        <StatTile label='סה"כ מכירות (כולל מע"מ)' value={formatPrice(totalRevenue)} sub={`מתוכו מע"מ: ${formatPrice(totalVat)}`} />
        <StatTile label="הזמנות" value={String(orders.length)} sub={orders.length ? `ממוצע להזמנה: ${formatPrice(totalRevenue / orders.length)}` : undefined} />
        <StatTile label="מוצרים שנמכרו" value={String(totalUnits)} sub="סך כל היחידות" />
        <StatTile label="לקוחות פעילים" value={String(db.users.filter((u) => u.role === 'customer' && u.status === 'active').length)} sub={`${db.users.filter((u) => u.status === 'pending').length} ממתינים לאישור`} />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>מכירות לפי מוצר ולפי קטגוריית לקוח</h3>
          <p className="unit">10 המוצרים הנמכרים ביותר (יחידות), צבע = סוג הלקוח שקנה</p>
          <StackedHBar data={productStack.map(({ label, values }) => ({ label, values }))} keys={catKeys} />
        </div>
        <div className="chart-card">
          <h3>הכנסות לפי קטגוריית לקוח</h3>
          <HBarChart data={revenueByCat} format={(v) => formatPrice(v)} />
        </div>
        <div className="chart-card">
          <h3>אמצעי תשלום</h3>
          <p className="unit">התפלגות ההזמנות לפי צורת התשלום</p>
          <Donut data={payData} />
        </div>
        <div className="chart-card">
          <h3>לקוחות מובילים</h3>
          <div className="field" style={{ marginBottom: 10 }}>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} aria-label="סינון לפי מוצר">
              <option value="">לפי סך קניות (₪)</option>
              {getProducts().map((p) => (
                <option key={p.id} value={p.id}>
                  לפי מוצר: {p.name} (יחידות)
                </option>
              ))}
            </select>
          </div>
          <HBarChart data={topCustomers} format={(v) => (productFilter ? `${v} יח׳` : formatPrice(v))} />
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 18 }}>
        <h3>סטטוס לקוחות ותזכורות</h3>
        <p className="unit">עגלות נטושות, לייקים, תשלומים שלא הושלמו וצפיות – עם שם הלקוח והסטטוס</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>לקוח</th>
                <th>הזמנות</th>
                <th>צפיות במוצרים</th>
                <th>לייקים</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.map(({ u, liked, abandonedCheckout, cartReminder, views, orderCount }) => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    <br />
                    <small className="unit" dir="ltr">{u.phone}</small>
                  </td>
                  <td>{orderCount}</td>
                  <td>{views}</td>
                  <td>{liked > 0 ? `❤️ ${liked}` : '—'}</td>
                  <td className="actions-cell">
                    {cartReminder && <span className="status-chip s-awaiting_payment">🛒 עגלה נטושה – נשלחה תזכורת</span>}
                    {abandonedCheckout && <span className="status-chip s-awaiting_payment">💳 תשלום לא הושלם</span>}
                    {!cartReminder && !abandonedCheckout && orderCount > 0 && <span className="status-chip s-paid">לקוח פעיל</span>}
                    {!cartReminder && !abandonedCheckout && orderCount === 0 && <span className="status-chip">מתעניין</span>}
                  </td>
                </tr>
              ))}
              {statusRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="unit">
                    אין פעילות לקוחות עדיין.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 18 }}>
        <h3>מה קנה כל לקוח</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>לקוח</th>
                <th>קטגוריה</th>
                <th>מוצרים שנרכשו</th>
                <th>סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {db.users
                .filter((u) => u.role === 'customer' && orders.some((o) => o.userId === u.id))
                .map((u) => {
                  const userOrders = orders.filter((o) => o.userId === u.id)
                  const items = new Map<string, number>()
                  userOrders.forEach((o) => o.lines.forEach((l) => items.set(l.name, (items.get(l.name) || 0) + l.qty)))
                  return (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{db.categories.find((c) => c.id === u.categoryId)?.name ?? '—'}</td>
                      <td>{[...items.entries()].map(([n, q]) => `${n} ×${q}`).join(', ')}</td>
                      <td>{formatPrice(userOrders.reduce((s, o) => s + o.total, 0))}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
