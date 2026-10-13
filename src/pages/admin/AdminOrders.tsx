import { useState } from 'react'
import { formatPrice } from '../../config'
import { getDB, saveDB, findUser } from '../../db'
import { notifyUser, sendMessage } from '../../notify'
import type { Order, OrderStatus } from '../../types'

const statusLabel: Record<OrderStatus, string> = {
  awaiting_payment: 'ממתין לתשלום',
  paid: 'שולם',
  confirmed: 'אושר',
  cancelled: 'בוטל',
}

const payLabel = { cash: 'מזומן', credit: 'אשראי', check: "צ'ק" } as const

export default function AdminOrders() {
  const [, force] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const db = getDB()

  function setStatus(o: Order, status: OrderStatus) {
    o.status = status
    saveDB()
    const u = findUser(o.userId)
    if (u) {
      notifyUser(u.id, 'עדכון הזמנה', `סטטוס ההזמנה שלך עודכן: ${statusLabel[status]}`)
      sendMessage(u, 'עדכון הזמנה', `שלום ${u.name}, סטטוס הזמנתך עודכן ל: ${statusLabel[status]}.`, ['email', 'whatsapp'])
    }
    force((v) => v + 1)
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>תאריך</th>
            <th>לקוח</th>
            <th>פריטים</th>
            <th>סה"כ (כולל מע"מ)</th>
            <th>תשלום</th>
            <th>אספקה</th>
            <th>סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {db.orders.map((o) => (
            <>
              <tr key={o.id} onClick={() => setOpenId(openId === o.id ? null : o.id)} style={{ cursor: 'pointer' }}>
                <td>{new Date(o.createdAt).toLocaleString('he-IL')}</td>
                <td>
                  {o.customerName}
                  <br />
                  <small className="unit" dir="ltr">{o.customerPhone}</small>
                </td>
                <td>{o.lines.reduce((s, l) => s + l.qty, 0)} פריטים</td>
                <td>
                  {formatPrice(o.total)}
                  <br />
                  <small className="unit">מע"מ ({o.vatRate}%): {formatPrice(o.vatAmount)}</small>
                </td>
                <td>{payLabel[o.paymentMethod]}</td>
                <td>{o.method === 'delivery' ? '🚚 משלוח' : '🏬 איסוף'}</td>
                <td>
                  <select value={o.status} onChange={(e) => setStatus(o, e.target.value as OrderStatus)} onClick={(e) => e.stopPropagation()}>
                    {(Object.keys(statusLabel) as OrderStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {statusLabel[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              {openId === o.id && (
                <tr key={o.id + '-detail'}>
                  <td colSpan={7} style={{ background: 'var(--green-100)' }}>
                    <b>פירוט הזמנה {o.id.slice(0, 8).toUpperCase()}</b> · {o.address}
                    {o.notes && <> · הערות: {o.notes}</>}
                    <table className="data-table" style={{ marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>מק"ט</th>
                          <th>מוצר</th>
                          <th>כמות</th>
                          <th>מחיר מחירון</th>
                          <th>מחיר ללקוח</th>
                          <th>סה"כ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.lines.map((l) => (
                          <tr key={l.productId}>
                            <td dir="ltr">{l.sku}</td>
                            <td>{l.name}</td>
                            <td>{l.qty}</td>
                            <td>{formatPrice(l.unitPrice)}</td>
                            <td>{formatPrice(l.unitPriceAfter)}</td>
                            <td>{formatPrice(l.unitPriceAfter * l.qty)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          ))}
          {db.orders.length === 0 && (
            <tr>
              <td colSpan={7} className="unit">
                אין הזמנות עדיין.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
