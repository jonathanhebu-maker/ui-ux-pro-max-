/**
 * שכבת נתונים מקומית (localStorage) – דמו מלא של האפליקציה.
 * המבנה בנוי כך שבהמשך מחליפים את המימוש בקריאות לשרת אמיתי
 * (Supabase / Firebase / API) בלי לשנות את שאר הקוד.
 */
import type {
  AppNotification,
  CustomerCategory,
  EventRecord,
  Message,
  Order,
  Settings,
  User,
} from './types'
import { seedProducts, type Product } from './data/products'

const KEY = 'store-db-v1'

interface DB {
  users: User[]
  categories: CustomerCategory[]
  /** קטלוג המוצרים – מנוהל במלואו על ידי המנהל מהפאנל */
  products: Product[]
  orders: Order[]
  events: EventRecord[]
  messages: Message[]
  notifications: AppNotification[]
  settings: Settings
  /** מק"טים שהמנהל ערך (גובר על המק"ט שבקוד) */
  skuOverrides: Record<string, string>
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function seed(): DB {
  return {
    users: [
      {
        id: 'admin',
        name: 'מנהל המערכת',
        phone: '050-0000000',
        email: 'admin@example.com',
        username: 'admin',
        password: 'admin1234',
        role: 'admin',
        status: 'active',
        categoryId: null,
        likes: [],
        createdAt: Date.now(),
      },
    ],
    categories: [
      { id: 'regular', name: 'לקוח רגיל', baseDiscount: 0, productDiscounts: {} },
    ],
    products: seedProducts.map((p) => ({ ...p })),
    orders: [],
    events: [],
    messages: [],
    notifications: [],
    settings: { vatRate: 18, abandonedCartMinutes: 30, likeReminderMinutes: 60 },
    skuOverrides: {},
  }
}

let cache: DB | null = null
const listeners = new Set<() => void>()

export function getDB(): DB {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cache = { ...seed(), ...(JSON.parse(raw) as Partial<DB>) }
      return cache
    }
  } catch {
    /* localStorage לא זמין */
  }
  cache = seed()
  return cache
}

export function saveDB() {
  try {
    localStorage.setItem(KEY, JSON.stringify(getDB()))
  } catch {
    /* דמו – ממשיכים בזיכרון */
  }
  listeners.forEach((l) => l())
}

/** הרשמה לשינויים – ל-hooks של React */
export function subscribeDB(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export const findUser = (id: string) => getDB().users.find((u) => u.id === id)

export const findUserByLogin = (login: string) => {
  const l = login.trim().toLowerCase()
  return getDB().users.find(
    (u) =>
      u.username.toLowerCase() === l ||
      u.email.toLowerCase() === l ||
      u.phone.replace(/-/g, '') === l.replace(/-/g, ''),
  )
}

export const getCategory = (id: string | null) =>
  getDB().categories.find((c) => c.id === id)

export const getSku = (productId: string, codeSku: string) =>
  getDB().skuOverrides[productId] ?? codeSku

/* ===== קטלוג המוצרים (מנוהל מהפאנל) ===== */

/** כל המוצרים כולל מוסתרים – לפאנל הניהול */
export const getAllProducts = (): Product[] => getDB().products

/** המוצרים המוצגים בחנות */
export const getProducts = (): Product[] =>
  getDB().products.filter((p) => p.active !== false)

export const getProduct = (id: string) => getDB().products.find((p) => p.id === id)

export const byCategory = (categoryId: string) =>
  getProducts().filter((p) => p.categoryId === categoryId)
