/**
 * יצירת נתוני דמו – לקוחות, הזמנות ואירועים – כדי להדגים את האנליטיקות.
 * מופעל ידנית מכפתור בלוח הניהול בלבד.
 */
import { getDB, saveDB, uid, genPassword, getSku } from './db'
import { products } from './data/products'
import type { Order, PaymentMethod, User } from './types'

const demoNames = [
  ['אבי כהן', '050-1111111'],
  ['שרה לוי', '052-2222222'],
  ['יוסי מזרחי', '053-3333333'],
  ['רחל פרץ', '054-4444444'],
  ['דוד ביטון', '055-5555555'],
  ['מרים אזולאי', '058-6666666'],
] as const

export function seedDemoData() {
  const db = getDB()

  // קטגוריית דמו נוספת אם יש רק אחת
  if (db.categories.length === 1) {
    db.categories.push({ id: uid(), name: 'לקוח מועדף (דמו)', baseDiscount: 10, productDiscounts: {} })
  }

  const cats = db.categories
  const users: User[] = demoNames.map(([name, phone], i) => ({
    id: uid(),
    name,
    phone,
    email: `demo${i + 1}@example.com`,
    username: phone.replace(/-/g, ''),
    password: genPassword(),
    role: 'customer',
    status: 'active',
    categoryId: cats[i % cats.length].id,
    likes: [products[(i * 3) % products.length].id, products[(i * 5 + 2) % products.length].id],
    createdAt: Date.now() - (30 - i) * 86400000,
  }))
  db.users.push(...users)

  const payments: PaymentMethod[] = ['cash', 'credit', 'check']
  const vatRate = db.settings.vatRate

  users.forEach((u, ui) => {
    const orderCount = 1 + ((ui * 7) % 4)
    for (let k = 0; k < orderCount; k++) {
      const lineCount = 1 + ((ui + k) % 4)
      const lines = Array.from({ length: lineCount }, (_, li) => {
        const p = products[(ui * 5 + k * 3 + li * 7) % products.length]
        const qty = 1 + ((ui + k + li) % 5)
        const cat = cats.find((c) => c.id === u.categoryId)!
        const disc = cat.productDiscounts[p.id] ?? cat.baseDiscount
        return {
          productId: p.id,
          sku: getSku(p.id, p.sku),
          name: p.name,
          qty,
          unitPrice: p.price,
          unitPriceAfter: Math.round(p.price * (1 - disc / 100) * 100) / 100,
        }
      })
      const listTotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
      const subtotal = lines.reduce((s, l) => s + l.unitPriceAfter * l.qty, 0)
      const shipping = subtotal >= 400 ? 0 : 35
      const total = Math.round((subtotal + shipping) * 100) / 100
      const order: Order = {
        id: uid(),
        userId: u.id,
        lines,
        listTotal,
        discountTotal: Math.round((listTotal - subtotal) * 100) / 100,
        shipping,
        total,
        vatRate,
        vatAmount: Math.round(((total * vatRate) / (100 + vatRate)) * 100) / 100,
        method: k % 2 === 0 ? 'delivery' : 'pickup',
        paymentMethod: payments[(ui + k) % payments.length],
        status: 'confirmed',
        customerName: u.name,
        customerPhone: u.phone,
        address: 'כתובת דמו 1, עיר דמו',
        notes: '',
        createdAt: Date.now() - (20 - k * 4 - ui) * 86400000,
      }
      db.orders.unshift(order)
      db.events.unshift({ id: uid(), type: 'order_placed', userId: u.id, at: order.createdAt })
    }

    // אירועי צפייה ולייקים
    u.likes.forEach((pid) => db.events.unshift({ id: uid(), type: 'like', userId: u.id, productId: pid, at: Date.now() - 3600000 }))
    for (let v = 0; v < 3 + (ui % 5); v++) {
      db.events.unshift({ id: uid(), type: 'product_view', userId: u.id, productId: products[(ui + v * 2) % products.length].id, at: Date.now() - v * 7200000 })
    }
  })

  // דוגמה לעגלה נטושה ותשלום שלא הושלם
  db.events.unshift({ id: uid(), type: 'cart_reminder_sent', userId: users[0].id, at: Date.now() - 1800000 })
  db.events.unshift({ id: uid(), type: 'checkout_abandoned', userId: users[1].id, at: Date.now() - 900000 })

  saveDB()
}
