import { useState } from 'react'
import { getDB, saveDB, uid } from '../../db'
import { showToast } from '../../components/Toast'

/** הגדרות: מע"מ, זמני תזכורות, וניהול קטגוריות הלקוח */
export default function AdminSettings() {
  const [, force] = useState(0)
  const db = getDB()
  const refresh = () => force((v) => v + 1)
  const [newCat, setNewCat] = useState({ name: '', discount: '' })

  function saveSetting<K extends keyof typeof db.settings>(key: K, raw: string) {
    const n = Number(raw)
    if (Number.isNaN(n) || n < 0) return
    db.settings[key] = n
    saveDB()
    showToast('ההגדרה נשמרה')
    refresh()
  }

  function addCategory() {
    const name = newCat.name.trim()
    const discount = Number(newCat.discount || 0)
    if (!name) return
    db.categories.push({ id: uid(), name, baseDiscount: Math.min(100, Math.max(0, discount)), productDiscounts: {} })
    saveDB()
    setNewCat({ name: '', discount: '' })
    showToast('קטגוריית לקוח נוספה')
    refresh()
  }

  function removeCategory(id: string) {
    if (db.categories.length <= 1) {
      showToast('חייבת להישאר לפחות קטגוריה אחת')
      return
    }
    const fallback = db.categories.find((c) => c.id !== id)!
    db.users.forEach((u) => {
      if (u.categoryId === id) u.categoryId = fallback.id
    })
    db.categories = db.categories.filter((c) => c.id !== id)
    saveDB()
    showToast('הקטגוריה הוסרה – הלקוחות הועברו לקטגוריה אחרת')
    refresh()
  }

  function updateCategory(id: string, field: 'name' | 'baseDiscount', raw: string) {
    const cat = db.categories.find((c) => c.id === id)
    if (!cat) return
    if (field === 'name') {
      if (!raw.trim()) return
      cat.name = raw.trim()
    } else {
      const n = Number(raw)
      if (Number.isNaN(n)) return
      cat.baseDiscount = Math.min(100, Math.max(0, n))
    }
    saveDB()
    refresh()
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h3 style={{ marginBottom: 12 }}>הגדרות כלליות</h3>
      <div className="form-grid" style={{ marginBottom: 32 }}>
        <div className="field">
          <label>אחוז מע"מ (%)</label>
          <input type="number" min={0} defaultValue={db.settings.vatRate} onBlur={(e) => saveSetting('vatRate', e.target.value)} />
        </div>
        <div className="field">
          <label>תזכורת עגלה נטושה אחרי (דקות)</label>
          <input type="number" min={1} defaultValue={db.settings.abandonedCartMinutes} onBlur={(e) => saveSetting('abandonedCartMinutes', e.target.value)} />
        </div>
        <div className="field">
          <label>תזכורת לייק ללא רכישה אחרי (דקות)</label>
          <input type="number" min={1} defaultValue={db.settings.likeReminderMinutes} onBlur={(e) => saveSetting('likeReminderMinutes', e.target.value)} />
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>קטגוריות לקוח</h3>
      <p className="unit" style={{ marginBottom: 12 }}>
        כאן מגדירים את סוגי הלקוחות ואת הנחת הבסיס של כל סוג. הנחות ספציפיות
        פר־מוצר נקבעות בטאב "מוצרים והנחות".
      </p>
      <div className="table-wrap" style={{ marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>שם הקטגוריה</th>
              <th>הנחת בסיס (%)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {db.categories.map((c) => (
              <tr key={c.id}>
                <td>
                  <input defaultValue={c.name} onBlur={(e) => updateCategory(c.id, 'name', e.target.value)} aria-label="שם קטגוריה" />
                </td>
                <td>
                  <input className="pct-input" type="number" min={0} max={100} defaultValue={c.baseDiscount} onBlur={(e) => updateCategory(c.id, 'baseDiscount', e.target.value)} aria-label="הנחת בסיס" />
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeCategory(c.id)}>
                    הסרה
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="catalog-tools">
        <input placeholder="שם קטגוריה חדשה (למשל: לקוח מועדף)" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)' }} />
        <input className="pct-input" type="number" placeholder="% הנחה" value={newCat.discount} onChange={(e) => setNewCat({ ...newCat, discount: e.target.value })} />
        <button className="btn btn-primary btn-sm" onClick={addCategory}>
          הוספת קטגוריה
        </button>
      </div>
    </div>
  )
}
