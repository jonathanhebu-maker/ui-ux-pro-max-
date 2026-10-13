/** קטגוריית לקוח – המנהל מגדיר שם, הנחת בסיס והנחות פר־מוצר */
export interface CustomerCategory {
  id: string
  name: string
  /** אחוז הנחה בסיסי לכל המוצרים */
  baseDiscount: number
  /** הנחות ספציפיות למוצר (מפתח = מזהה מוצר, ערך = אחוז) – גובר על הבסיס */
  productDiscounts: Record<string, number>
}

export type UserRole = 'admin' | 'customer'
export type UserStatus = 'pending' | 'active' | 'blocked'

export interface User {
  id: string
  name: string
  phone: string
  email: string
  username: string
  /** דמו בלבד – באפליקציה אמיתית הסיסמה מאוחסנת מוצפנת בשרת */
  password: string
  role: UserRole
  status: UserStatus
  categoryId: string | null
  likes: string[]
  createdAt: number
}

export type PaymentMethod = 'cash' | 'credit' | 'check'
export type OrderStatus = 'awaiting_payment' | 'paid' | 'confirmed' | 'cancelled'

export interface OrderLine {
  productId: string
  sku: string
  name: string
  qty: number
  /** מחיר מחירון ליחידה (כולל מע"מ) */
  unitPrice: number
  /** מחיר ליחידה אחרי הנחת הלקוח (כולל מע"מ) */
  unitPriceAfter: number
}

export interface Order {
  id: string
  userId: string
  lines: OrderLine[]
  /** סכום מחירון לפני הנחה */
  listTotal: number
  /** סכום ההנחה */
  discountTotal: number
  shipping: number
  /** סה"כ לתשלום כולל מע"מ */
  total: number
  vatRate: number
  /** רכיב המע"מ מתוך הסה"כ */
  vatAmount: number
  method: 'delivery' | 'pickup'
  paymentMethod: PaymentMethod
  status: OrderStatus
  customerName: string
  customerPhone: string
  address: string
  notes: string
  createdAt: number
}

export type EventType =
  | 'product_view'
  | 'add_to_cart'
  | 'like'
  | 'checkout_started'
  | 'checkout_abandoned'
  | 'cart_reminder_sent'
  | 'order_placed'

export interface EventRecord {
  id: string
  type: EventType
  userId: string | null
  productId?: string
  at: number
}

export interface Message {
  id: string
  channel: 'whatsapp' | 'email'
  to: string
  subject: string
  body: string
  userId: string | null
  at: number
}

export interface AppNotification {
  id: string
  /** מזהה משתמש, או 'admin' להתראות מנהל */
  target: string
  title: string
  body: string
  read: boolean
  at: number
}

export interface Settings {
  /** אחוז מע"מ */
  vatRate: number
  /** אחרי כמה דקות עגלה נחשבת נטושה ונשלחת תזכורת (דמו – בפרודקשן שעות) */
  abandonedCartMinutes: number
  /** אחרי כמה דקות לייק ללא רכישה מקבל תזכורת */
  likeReminderMinutes: number
}
