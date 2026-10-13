/**
 * הודעות (SMS/מייל – דמו), התראות באפליקציה, מעקב אירועים ותזכורות.
 * בדמו ההודעות נרשמות ביומן ההודעות של המנהל; בפרודקשן מחליפים את
 * sendMessage בקריאה לספק אמיתי (SMS4Free / Twilio / שירות מייל).
 */
import { getDB, saveDB, uid, findUser } from './db'
import { site } from './config'
import type { EventType, User } from './types'

/* ===== שליחת הודעות (דמו – נרשם ביומן) =====
 * מדיניות הערוצים:
 * - סיסמאות ופרטי התחברות: מייל + וואטסאפ
 * - אישורי הזמנה ועדכוני סטטוס: מייל + וואטסאפ (+התראה באפליקציה)
 * - תזכורות (עגלה נטושה, לייק, תשלום): מייל בלבד
 * בפרודקשן: מייל דרך Resend/SendGrid, וואטסאפ דרך WhatsApp Business API.
 */
type Channel = 'whatsapp' | 'email'

export function sendMessage(
  user: User,
  subject: string,
  body: string,
  channels: Channel[] = ['email'],
) {
  const db = getDB()
  const at = Date.now()
  for (const channel of channels) {
    db.messages.unshift({
      id: uid(),
      channel,
      to: channel === 'whatsapp' ? user.phone : user.email,
      subject,
      body,
      userId: user.id,
      at,
    })
  }
  saveDB()
}

export function sendCredentials(user: User, kind: 'new' | 'resend' | 'reset') {
  const title =
    kind === 'new'
      ? `ברוכים הבאים ל${site.name}!`
      : kind === 'reset'
        ? `${site.name} – איפוס סיסמה`
        : `${site.name} – פרטי ההתחברות שלך`
  sendMessage(
    user,
    title,
    `שלום ${user.name},\nפרטי ההתחברות שלך לאפליקציה:\nשם משתמש: ${user.username}\nסיסמה: ${user.password}`,
    ['email', 'whatsapp'],
  )
}

/* ===== התראות באפליקציה ===== */
export function notifyUser(target: string, title: string, body: string) {
  const db = getDB()
  db.notifications.unshift({ id: uid(), target, title, body, read: false, at: Date.now() })
  if (db.notifications.length > 200) db.notifications.length = 200
  saveDB()
}

export const notifyAdmin = (title: string, body: string) => notifyUser('admin', title, body)

/* ===== מעקב אירועים ===== */
export function track(type: EventType, userId: string | null, productId?: string) {
  const db = getDB()
  db.events.unshift({ id: uid(), type, userId, productId, at: Date.now() })
  if (db.events.length > 2000) db.events.length = 2000
  saveDB()
}

/* ===== מנוע תזכורות =====
 * רץ בעליית האפליקציה וכל דקה: עגלה נטושה, לייק ללא רכישה,
 * תשלום באשראי שנעצר. דגלים ב-localStorage מונעים כפילויות.
 */
const FLAGS_KEY = 'store-reminder-flags-v1'

function flags(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(FLAGS_KEY) || '{}')
  } catch {
    return {}
  }
}

function setFlag(key: string) {
  const f = flags()
  f[key] = Date.now()
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(f))
  } catch {
    /* דמו */
  }
}

export function runReminderScan(currentUserId: string | null, cartCount: number, cartUpdatedAt: number | null) {
  const db = getDB()
  const now = Date.now()
  const user = currentUserId ? findUser(currentUserId) : undefined
  if (!user || user.role === 'admin') return

  // עגלה נטושה
  if (cartCount > 0 && cartUpdatedAt) {
    const ageMin = (now - cartUpdatedAt) / 60000
    const key = `cart-${user.id}-${cartUpdatedAt}`
    if (ageMin >= db.settings.abandonedCartMinutes && !flags()[key]) {
      setFlag(key)
      notifyUser(user.id, 'שכחת משהו בעגלה? 🛒', `יש לך ${cartCount} פריטים שמחכים לך בעגלה. השלימו את ההזמנה לפני שהמלאי נגמר!`)
      sendMessage(user, `${site.name} – העגלה שלך מחכה`, `שלום ${user.name}, יש לך ${cartCount} פריטים בעגלה. נשמח להשלים את ההזמנה!`)
      notifyAdmin('עגלה נטושה', `${user.name} השאיר/ה ${cartCount} פריטים בעגלה – נשלחה תזכורת.`)
      track('cart_reminder_sent', user.id)
    }
  }

  // לייקים ללא רכישה
  const likeEvents = db.events.filter((e) => e.type === 'like' && e.userId === user.id)
  for (const ev of likeEvents) {
    const key = `like-${user.id}-${ev.productId}-${ev.at}`
    const ageMin = (now - ev.at) / 60000
    const bought = db.orders.some(
      (o) => o.userId === user.id && o.createdAt > ev.at && o.lines.some((l) => l.productId === ev.productId),
    )
    if (ageMin >= db.settings.likeReminderMinutes && !bought && !flags()[key] && user.likes.includes(ev.productId!)) {
      setFlag(key)
      notifyUser(user.id, 'המוצר שאהבת עדיין כאן ❤️', 'מוצר שסימנת בלייק מחכה לך – אל תפספסו את המחיר.')
      sendMessage(user, `${site.name} – המוצר שאהבת`, `שלום ${user.name}, המוצר שסימנת בלייק עדיין זמין במלאי. מוזמנים להשלים את הרכישה!`)
    }
  }

  // תשלום באשראי שנעצר
  const abandonedCheckout = db.events.find((e) => e.type === 'checkout_abandoned' && e.userId === user.id)
  if (abandonedCheckout) {
    const key = `co-${user.id}-${abandonedCheckout.at}`
    if (!flags()[key]) {
      setFlag(key)
      notifyUser(user.id, 'ההזמנה שלך כמעט הושלמה 💳', 'עצרת רגע לפני התשלום – ההזמנה שמורה ואפשר להשלים אותה בכל רגע.')
      sendMessage(user, `${site.name} – השלמת הזמנה`, `שלום ${user.name}, ההזמנה שלך ממתינה להשלמת תשלום. נשמח לעזור בכל שאלה!`)
      notifyAdmin('תשלום שלא הושלם', `${user.name} התחיל/ה תשלום באשראי ולא השלים/ה – נשלחה תזכורת.`)
    }
  }
}
