import { useState, type ChangeEvent } from 'react'
import { formatPrice } from '../../config'
import { getDB, saveDB, uid, getAllProducts } from '../../db'
import { categories as productCategories, type Product } from '../../data/products'
import { showToast } from '../../components/Toast'

/**
 * ניהול מוצרים מלא: הוספה, עריכה, מחיקה, תמונה, מלאי, הסתרה –
 * וגם מק"ט (למנהל בלבד) והנחות פר קטגוריית לקוח.
 * כל שינוי מתעדכן מיידית אצל הלקוחות.
 */
export default function AdminProducts() {
  const [, force] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const refresh = () => force((v) => v + 1)
  const products = getAllProducts()

  function addProduct() {
    const p: Product = {
      id: uid(),
      sku: '',
      categoryId: productCategories[0].id,
      name: 'מוצר חדש',
      description: '',
      price: 0,
      emoji: '🛒',
      active: false, // מתחיל מוסתר עד שממלאים פרטים
    }
    getDB().products.unshift(p)
    saveDB()
    setEditingId(p.id)
    refresh()
  }

  function removeProduct(id: string) {
    const db = getDB()
    db.products = db.products.filter((p) => p.id !== id)
    saveDB()
    showToast('המוצר נמחק')
    setEditingId(null)
    refresh()
  }

  return (
    <div>
      <div className="catalog-tools" style={{ alignItems: 'center' }}>
        <button className="btn btn-primary btn-sm" onClick={addProduct}>
          + מוצר חדש
        </button>
        <span className="unit">
          {products.length} מוצרים · המק"ט מוצג למנהל בלבד · שינויים נשמרים ומתעדכנים
          מיידית אצל הלקוחות
        </span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>מוצר</th>
              <th>מק"ט</th>
              <th>מחיר</th>
              <th>מלאי</th>
              <th>מוצג</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                open={editingId === p.id}
                onToggle={() => setEditingId(editingId === p.id ? null : p.id)}
                onDelete={() => removeProduct(p.id)}
                onChanged={refresh}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductRow({
  product: p,
  open,
  onToggle,
  onDelete,
  onChanged,
}: {
  product: Product
  open: boolean
  onToggle: () => void
  onDelete: () => void
  onChanged: () => void
}) {
  const db = getDB()

  function save(patch: Partial<Product>) {
    Object.assign(p, patch)
    saveDB()
    onChanged()
  }

  function onImageFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 400 * 1024) {
      showToast('בדמו – עד 400KB לתמונה (בשרת אמיתי ללא מגבלה)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      save({ image: String(reader.result) })
      showToast('התמונה נשמרה')
    }
    reader.readAsDataURL(file)
  }

  function setDiscount(catId: string, raw: string) {
    const cat = db.categories.find((c) => c.id === catId)
    if (!cat) return
    const v = raw.trim()
    if (v === '') delete cat.productDiscounts[p.id]
    else {
      const n = Math.min(100, Math.max(0, Number(v)))
      if (Number.isNaN(n)) return
      cat.productDiscounts[p.id] = n
    }
    saveDB()
    onChanged()
  }

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer', opacity: p.active === false ? 0.55 : 1 }}>
        <td style={{ fontSize: '1.4rem' }}>
          {p.image ? (
            <img src={p.image} alt="" style={{ width: 40, height: 32, objectFit: 'cover', borderRadius: 6 }} />
          ) : (
            p.emoji
          )}
        </td>
        <td>
          {p.name}
          <br />
          <small className="unit">{productCategories.find((c) => c.id === p.categoryId)?.name}</small>
        </td>
        <td dir="ltr">{p.sku || '—'}</td>
        <td>
          {formatPrice(p.price)}
          {p.oldPrice && (
            <>
              {' '}
              <s className="unit">{formatPrice(p.oldPrice)}</s>
            </>
          )}
        </td>
        <td>{p.stock === undefined ? '∞' : p.stock === 0 ? <b style={{ color: 'var(--red-600)' }}>אזל</b> : p.stock}</td>
        <td>
          <input
            type="checkbox"
            checked={p.active !== false}
            onChange={(e) => save({ active: e.target.checked })}
            onClick={(e) => e.stopPropagation()}
            aria-label="מוצג בחנות"
          />
        </td>
        <td>{open ? '▲' : 'עריכה ▼'}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: 'var(--green-100)' }}>
            <div className="form-grid" style={{ padding: '8px 0' }}>
              <div className="field">
                <label>שם המוצר</label>
                <input defaultValue={p.name} onBlur={(e) => save({ name: e.target.value })} />
              </div>
              <div className="field">
                <label>קטגוריה</label>
                <select value={p.categoryId} onChange={(e) => save({ categoryId: e.target.value })}>
                  {productCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label>תיאור</label>
                <textarea rows={2} defaultValue={p.description} onBlur={(e) => save({ description: e.target.value })} />
              </div>
              <div className="field">
                <label>מחיר (₪)</label>
                <input type="number" min={0} step="0.1" defaultValue={p.price} onBlur={(e) => save({ price: Math.max(0, Number(e.target.value) || 0) })} />
              </div>
              <div className="field">
                <label>מחיר קודם (למבצע, ריק = אין)</label>
                <input type="number" min={0} step="0.1" defaultValue={p.oldPrice ?? ''} onBlur={(e) => save({ oldPrice: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value) || 0) })} />
              </div>
              <div className="field">
                <label>מק"ט (למנהל בלבד)</label>
                <input dir="ltr" defaultValue={p.sku} onBlur={(e) => save({ sku: e.target.value.trim() })} />
              </div>
              <div className="field">
                <label>מלאי (ריק = ללא מעקב)</label>
                <input type="number" min={0} defaultValue={p.stock ?? ''} onBlur={(e) => save({ stock: e.target.value === '' ? undefined : Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
              </div>
              <div className="field">
                <label>תגית (למשל: מבצע חג)</label>
                <input defaultValue={p.badge ?? ''} onBlur={(e) => save({ badge: e.target.value.trim() || undefined })} />
              </div>
              <div className="field">
                <label>יחידה (למשל: מארז)</label>
                <input defaultValue={p.unit ?? ''} onBlur={(e) => save({ unit: e.target.value.trim() || undefined })} />
              </div>
              <div className="field">
                <label>תמונה – קובץ מהמחשב</label>
                <input type="file" accept="image/*" onChange={onImageFile} />
              </div>
              <div className="field">
                <label>או כתובת תמונה (URL)</label>
                <input dir="ltr" defaultValue={p.image?.startsWith('data:') ? '' : (p.image ?? '')} placeholder="https://..." onBlur={(e) => { const v = e.target.value.trim(); if (v || !p.image?.startsWith('data:')) save({ image: v || undefined }) }} />
              </div>
              <div className="field full">
                <label>הנחה ללקוחות לפי קטגוריה (ריק = הנחת הבסיס של הקטגוריה)</label>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {db.categories.map((c) => {
                    const specific = c.productDiscounts[p.id]
                    const effective = specific !== undefined ? specific : c.baseDiscount
                    return (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                        {c.name}:
                        <input className="pct-input" type="number" min={0} max={100} placeholder={String(c.baseDiscount)} defaultValue={specific ?? ''} onBlur={(e) => setDiscount(c.id, e.target.value)} />
                        % <span className="unit">← {formatPrice(p.price * (1 - effective / 100))}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="field full" style={{ flexDirection: 'row', display: 'flex', gap: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={onToggle}>
                  סגירה ✓
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: 'var(--red-600)', color: 'var(--red-600)' }}
                  onClick={() => {
                    if (confirm(`למחוק את "${p.name}"? פעולה זו אינה הפיכה.`)) onDelete()
                  }}
                >
                  🗑️ מחיקת מוצר
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
