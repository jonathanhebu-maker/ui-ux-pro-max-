import { useState } from 'react'
import { formatPrice } from '../../config'
import { getDB, saveDB, getSku } from '../../db'
import { products, categories as productCategories } from '../../data/products'
import { showToast } from '../../components/Toast'

/**
 * ניהול מוצרים: מק"ט (מוצג למנהל בלבד) + מטריצת הנחות –
 * לכל קטגוריית לקוח: הנחת בסיס, ואפשרות להנחה ספציפית פר מוצר.
 */
export default function AdminProducts() {
  const [, force] = useState(0)
  const db = getDB()
  const refresh = () => force((v) => v + 1)

  function setSku(productId: string, sku: string) {
    db.skuOverrides[productId] = sku
    saveDB()
  }

  function setProductDiscount(catId: string, productId: string, raw: string) {
    const cat = db.categories.find((c) => c.id === catId)
    if (!cat) return
    const v = raw.trim()
    if (v === '') {
      delete cat.productDiscounts[productId]
    } else {
      const n = Math.min(100, Math.max(0, Number(v)))
      if (Number.isNaN(n)) return
      cat.productDiscounts[productId] = n
    }
    saveDB()
    refresh()
  }

  return (
    <div>
      <div className="notice" style={{ marginBottom: 20 }}>
        המק"ט מוצג למנהל בלבד ולא נחשף ללקוח – הוא נשמר בכל הזמנה לאימות המוצרים.
        בעמודות הקטגוריות: תא ריק = הנחת הבסיס של הקטגוריה; ערך = הנחה ספציפית למוצר.
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>מוצר</th>
              <th>מק"ט</th>
              <th>מחיר מחירון</th>
              {db.categories.map((c) => (
                <th key={c.id}>
                  {c.name}
                  <br />
                  <small className="unit">בסיס {c.baseDiscount}%</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.emoji} {p.name}
                  <br />
                  <small className="unit">{productCategories.find((c) => c.id === p.categoryId)?.name}</small>
                </td>
                <td>
                  <input
                    className="sku-input"
                    dir="ltr"
                    defaultValue={getSku(p.id, p.sku)}
                    onBlur={(e) => {
                      setSku(p.id, e.target.value.trim())
                      showToast('מק"ט נשמר')
                    }}
                    aria-label={`מק"ט עבור ${p.name}`}
                  />
                </td>
                <td>{formatPrice(p.price)}</td>
                {db.categories.map((c) => {
                  const specific = c.productDiscounts[p.id]
                  const effective = specific !== undefined ? specific : c.baseDiscount
                  return (
                    <td key={c.id}>
                      <input
                        className="pct-input"
                        type="number"
                        min={0}
                        max={100}
                        placeholder={String(c.baseDiscount)}
                        defaultValue={specific !== undefined ? specific : ''}
                        onBlur={(e) => setProductDiscount(c.id, p.id, e.target.value)}
                        aria-label={`הנחה עבור ${p.name} לקטגוריה ${c.name}`}
                      />
                      <small className="unit"> ← {formatPrice(p.price * (1 - effective / 100))}</small>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
