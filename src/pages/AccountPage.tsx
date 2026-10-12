import { Link, Navigate } from 'react-router-dom'
import { formatPrice } from '../config'
import { useAuth } from '../auth'
import { getDB, getCategory } from '../db'
import { getProduct } from '../data/products'
import ProductCard from '../components/ProductCard'

const statusLabel: Record<string, string> = {
  awaiting_payment: 'ממתין לתשלום',
  paid: 'שולם',
  confirmed: 'אושר',
  cancelled: 'בוטל',
}

export default function AccountPage() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  const orders = getDB().orders.filter((o) => o.userId === user.id)
  const likedProducts = user.likes.map(getProduct).filter((p) => !!p)
  const category = getCategory(user.categoryId)

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>שלום, {user.name} 👋</h2>
            <p>
              {category ? (
                <>
                  סוג לקוח: <b>{category.name}</b>
                  {category.baseDiscount > 0 && <> · הנחת חברים קבועה: {category.baseDiscount}%</>}
                </>
              ) : (
                'האזור האישי שלך'
              )}
            </p>
          </div>
        </div>

        <h3 style={{ marginBottom: 12 }}>ההזמנות שלי</h3>
        {orders.length === 0 ? (
          <p className="unit" style={{ marginBottom: 28 }}>
            עדיין אין הזמנות. <Link to="/catalog" style={{ textDecoration: 'underline' }}>התחילו לקנות</Link>
          </p>
        ) : (
          <div className="table-wrap" style={{ marginBottom: 28 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>פריטים</th>
                  <th>סה"כ</th>
                  <th>תשלום</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.createdAt).toLocaleDateString('he-IL')}</td>
                    <td>{o.lines.map((l) => `${l.name} ×${l.qty}`).join(', ')}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td>{o.paymentMethod === 'cash' ? 'מזומן' : o.paymentMethod === 'credit' ? 'אשראי' : "צ'ק"}</td>
                    <td>
                      <span className={`status-chip s-${o.status}`}>{statusLabel[o.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 style={{ marginBottom: 12 }}>המועדפים שלי ❤️</h3>
        {likedProducts.length === 0 ? (
          <p className="unit">עדיין לא סימנתם מוצרים בלייק. לחצו על 🤍 בכל מוצר כדי לשמור אותו כאן.</p>
        ) : (
          <div className="product-grid">
            {likedProducts.map((p) => (
              <ProductCard key={p!.id} product={p!} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
