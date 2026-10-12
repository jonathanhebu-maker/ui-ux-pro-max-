import { getDB, getCategory } from './db'
import type { Product } from './data/products'
import type { User } from './types'

/** אחוז ההנחה של משתמש על מוצר מסוים – לפי קטגוריית הלקוח שלו */
export function discountFor(user: User | null, product: Product): number {
  if (!user || user.role === 'admin') return 0
  const cat = getCategory(user.categoryId)
  if (!cat) return 0
  const specific = cat.productDiscounts[product.id]
  return specific !== undefined ? specific : cat.baseDiscount
}

/** מחיר ליחידה אחרי הנחת הלקוח (כולל מע"מ) */
export function priceFor(user: User | null, product: Product): number {
  const d = discountFor(user, product)
  return Math.round(product.price * (1 - d / 100) * 100) / 100
}

/** רכיב המע"מ מתוך סכום הכולל מע"מ */
export function vatPortion(totalInclVat: number): number {
  const rate = getDB().settings.vatRate
  return Math.round(((totalInclVat * rate) / (100 + rate)) * 100) / 100
}

export const vatRate = () => getDB().settings.vatRate
