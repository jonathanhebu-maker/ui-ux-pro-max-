/**
 * הגדרות האתר – כל המיתוג והפרטים העסקיים במקום אחד.
 * הלקוח מחליף כאן שם, טלפון, סניפים ותנאי משלוח – בלי לגעת בקוד.
 */
export const site = {
  name: 'סטוק פלוס',
  tagline: 'חנות המפעל – ישירות מהיבואן לצרכן',
  phone: '03-0000000',
  whatsapp: '972500000000', // מספר בפורמט בינלאומי ללא +
  email: 'info@example.com',

  shipping: {
    /** סכום מינימום להזמנה עם משלוח (₪) */
    minOrderForDelivery: 100,
    /** דמי משלוח (₪) */
    deliveryFee: 35,
    /** משלוח חינם מעל סכום (₪) */
    freeDeliveryFrom: 400,
    /** זמן אספקה משוער */
    eta: 'עד 7 ימי עסקים (בערים גדולות כ־3 ימים)',
  },

  branches: [
    {
      city: 'אלעד',
      address: 'רחוב הדוגמה 15, אלעד',
      hours: 'א׳–ה׳ 10:00–21:00 · ו׳ 9:00–13:00',
    },
    {
      city: 'בני ברק',
      address: 'רחוב הדוגמה 33, בני ברק',
      hours: 'א׳–ד׳ 10:00–21:00 · ה׳ 10:00–22:00',
    },
  ],
} as const

export const formatPrice = (n: number) =>
  `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`
