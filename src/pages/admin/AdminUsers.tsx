import { useState } from 'react'
import { formatPrice } from '../../config'
import { getDB, saveDB, genPassword } from '../../db'
import { notifyUser, sendCredentials } from '../../notify'
import { useAuth } from '../../auth'
import { showToast } from '../../components/Toast'
import type { User } from '../../types'

export default function AdminUsers() {
  useAuth() // רענון בעת שינוי DB
  const [, force] = useState(0)
  const db = getDB()
  const customers = db.users.filter((u) => u.role === 'customer')
  const pending = customers.filter((u) => u.status === 'pending')
  const active = customers.filter((u) => u.status !== 'pending')

  const refresh = () => force((v) => v + 1)

  function approve(u: User, categoryId: string) {
    u.status = 'active'
    u.categoryId = categoryId
    u.password = genPassword()
    saveDB()
    sendCredentials(u, 'new')
    notifyUser(u.id, `ברוכים הבאים! 🎉`, 'החשבון אושר – פרטי ההתחברות נשלחו ב-SMS ובמייל.')
    showToast(`${u.name} אושר/ה – פרטי התחברות נשלחו ב-SMS ובמייל (דמו)`)
    refresh()
  }

  function resend(u: User) {
    sendCredentials(u, 'resend')
    showToast('פרטי ההתחברות נשלחו שוב ב-SMS ובמייל (דמו)')
  }

  function resetPassword(u: User) {
    u.password = genPassword()
    saveDB()
    sendCredentials(u, 'reset')
    showToast('סיסמה חדשה נוצרה ונשלחה ב-SMS ובמייל (דמו)')
    refresh()
  }

  function setCategory(u: User, categoryId: string) {
    u.categoryId = categoryId
    saveDB()
    refresh()
  }

  function toggleBlock(u: User) {
    u.status = u.status === 'blocked' ? 'active' : 'blocked'
    saveDB()
    refresh()
  }

  const totalsByUser = (id: string) =>
    db.orders.filter((o) => o.userId === id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

  return (
    <div>
      <div className="notice" style={{ marginBottom: 20 }}>
        דמו: הודעות SMS/מייל נרשמות ביומן ההודעות. בפרודקשן יחובר ספק שליחה אמיתי.
      </div>

      <h3 style={{ marginBottom: 12 }}>ממתינים לאישור ({pending.length})</h3>
      {pending.length === 0 ? (
        <p className="unit" style={{ marginBottom: 24 }}>אין בקשות הרשמה חדשות.</p>
      ) : (
        <div className="table-wrap" style={{ marginBottom: 28 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>שם</th>
                <th>טלפון</th>
                <th>אימייל</th>
                <th>נרשם</th>
                <th>שיוך קטגוריה ואישור</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <PendingRow key={u.id} user={u} onApprove={approve} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ marginBottom: 12 }}>לקוחות ({active.length})</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>טלפון</th>
              <th>שם משתמש</th>
              <th>קטגוריה</th>
              <th>סה"כ קניות</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {active.map((u) => (
              <tr key={u.id} style={u.status === 'blocked' ? { opacity: 0.5 } : undefined}>
                <td>
                  {u.name}
                  {u.status === 'blocked' && ' (חסום)'}
                </td>
                <td dir="ltr">{u.phone}</td>
                <td dir="ltr">{u.username}</td>
                <td>
                  <select value={u.categoryId ?? ''} onChange={(e) => setCategory(u, e.target.value)}>
                    {db.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.baseDiscount}%)
                      </option>
                    ))}
                  </select>
                </td>
                <td>{formatPrice(totalsByUser(u.id))}</td>
                <td className="actions-cell">
                  <button className="btn btn-ghost btn-sm" onClick={() => resend(u)}>
                    שליחת פרטים שוב
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => resetPassword(u)}>
                    איפוס סיסמה
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleBlock(u)}>
                    {u.status === 'blocked' ? 'ביטול חסימה' : 'חסימה'}
                  </button>
                </td>
              </tr>
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={6} className="unit">
                  אין עדיין לקוחות מאושרים.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PendingRow({ user, onApprove }: { user: User; onApprove: (u: User, categoryId: string) => void }) {
  const db = getDB()
  const [cat, setCat] = useState(db.categories[0]?.id ?? '')
  return (
    <tr>
      <td>{user.name}</td>
      <td dir="ltr">{user.phone}</td>
      <td dir="ltr">{user.email}</td>
      <td>{new Date(user.createdAt).toLocaleDateString('he-IL')}</td>
      <td className="actions-cell">
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {db.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.baseDiscount}%)
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => onApprove(user, cat)}>
          אישור + שליחת פרטים
        </button>
      </td>
    </tr>
  )
}
