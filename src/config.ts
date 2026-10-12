/**
 * הגדרות האתר – כל המיתוג והפרטים העסקיים במקום אחד.
 * הלקוח מחליף כאן שם, טלפון, סניפים ותנאי משלוח – בלי לגעת בקוד.
 */
export const site = {
  name: 'חסד סטוק',
  tagline: 'יודאיקה ומתנות מהיבואן לצרכן',
  /** לוגו העסק (מה-CDN של האתר הקיים) */
  logo: 'https://files.cdn-files-a.com/uploads/9432875/400_6a4e40198cf20.png',
  phone: '03-0000000', // TODO: להחליף למספר הטלפון האמיתי של העסק
  whatsapp: '972500000000', // TODO: מספר הוואטסאפ של העסק בפורמט בינלאומי ללא +
  email: 'chesedstock15@gmail.com',
  facebook: 'https://www.facebook.com/people/%D7%A9%D7%9C%D7%94%D7%91%D7%AA/61592112755226/',

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
      address: 'רבי עקיבא 15, אלעד, ישראל',
      hours: 'א׳–ה׳ 10:00–21:00 · ו׳ 9:00–13:00', // TODO: לאמת שעות פתיחה
    },
  ],
} as const

export const formatPrice = (n: number) =>
  `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`
