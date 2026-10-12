/**
 * הגדרות האתר – כל המיתוג והפרטים העסקיים במקום אחד.
 * הלקוח מחליף כאן שם, טלפון, סניפים ותנאי משלוח – בלי לגעת בקוד.
 */
export const site = {
  name: 'חסד סטוק',
  tagline: 'שלהבת חנות המפעל – מהיבואן לצרכן',
  phone: '03-0000000', // TODO: להחליף למספר הטלפון האמיתי של העסק
  whatsapp: '972500000000', // TODO: מספר הוואטסאפ של העסק בפורמט בינלאומי ללא +
  email: 'chesedstock@gmail.com',

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
      address: 'רבי עקיבא 15, אלעד',
      hours: 'א׳–ה׳ 10:00–21:00 · ו׳ 9:00–13:00', // TODO: לאמת שעות פתיחה
    },
    {
      city: 'אבן גבירול',
      address: 'אבן גבירול 33', // TODO: לאמת כתובת מלאה ועיר
      hours: 'א׳–ד׳ 10:00–21:00',
    },
  ],
} as const

export const formatPrice = (n: number) =>
  `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`
