export interface Category {
  id: string
  name: string
  emoji: string
  blurb: string
}

export interface Product {
  id: string
  /** מק"ט פנימי – מוצג למנהל בלבד, לא ללקוח */
  sku: string
  categoryId: string
  name: string
  description: string
  price: number
  /** מחיר קודם – להצגת "מחיר מבצע" */
  oldPrice?: number
  unit?: string
  emoji: string
  /** נתיב לתמונה אמיתית – כשיש, מוצג במקום האייקון */
  image?: string
  badge?: string
}

export const categories: Category[] = [
  { id: 'disposables', name: 'חד־פעמי', emoji: '🥤', blurb: 'כלי הגשה חד־פעמיים בזול שאין בשום מקום' },
  { id: 'candles', name: 'נרות הבדלה', emoji: '🕯️', blurb: 'נרות שבת, נשמה והבדלה מעוצבים' },
  { id: 'home', name: 'כלי בית', emoji: '🍳', blurb: 'כל מה שצריך למטבח ולבית' },
  { id: 'electric', name: 'מוצרי חשמל', emoji: '💡', blurb: 'מוצרי חשמל ותאורה במחירי מפעל' },
  { id: 'tools', name: 'כלי עבודה', emoji: '🛠️', blurb: 'כלים לבית ולבעלי מקצוע' },
  { id: 'judaica', name: 'יודאיקה ומתנות', emoji: '✡️', blurb: 'יודאיקה מהודרת מהיבואן לצרכן' },
  { id: 'plants', name: 'משתלת אלעד', emoji: '🪴', blurb: 'צמחייה טבעית לבית ולגינה' },
  { id: 'seasonal', name: 'מוצרי קיץ וחג', emoji: '🎉', blurb: 'מתחדשים כל עונה – קיץ, חנוכה וחגים' },
]

export const products: Product[] = [
  // חד־פעמי
  { id: 'p1', sku: 'MK-1001', categoryId: 'disposables', name: 'מארז 50 צלחות מהודרות', description: 'צלחות חד־פעמיות קשיחות בגימור מהודר, מתאימות לאירועים ולשבת.', price: 12.9, oldPrice: 19.9, unit: 'מארז', emoji: '🍽️', badge: 'הכי נמכר' },
  { id: 'p2', sku: 'MK-1002', categoryId: 'disposables', name: 'כוסות שתייה קרה 100 יח׳', description: 'כוסות פלסטיק שקופות וחזקות, 200 מ״ל.', price: 7.9, unit: 'מארז', emoji: '🥤' },
  { id: 'p3', sku: 'MK-1003', categoryId: 'disposables', name: 'סכו״ם מהודר 60 יח׳', description: 'סט סכו״ם חד־פעמי בצבע כסוף מט – נראה כמו אמיתי.', price: 10.9, oldPrice: 14.9, unit: 'סט', emoji: '🍴' },
  { id: 'p4', sku: 'MK-1004', categoryId: 'disposables', name: 'מפות שולחן חד־פעמיות', description: 'גליל מפות איכותי, 20 מטר, לבן קלאסי.', price: 15.9, unit: 'גליל', emoji: '🧻' },
  // נרות
  { id: 'p5', sku: 'MK-1005', categoryId: 'candles', name: 'נרות שבת 72 יח׳', description: 'נרות שבת איכותיים בבעירה נקייה, כ־3 שעות בעירה.', price: 11.9, unit: 'קופסה', emoji: '🕯️', badge: 'מחיר מפעל' },
  { id: 'p6', sku: 'MK-1006', categoryId: 'candles', name: 'נר הבדלה קלוע מעוצב', description: 'נר הבדלה קלוע בעבודת יד, שעווה איכותית.', price: 9.9, oldPrice: 16.9, emoji: '🕯️' },
  { id: 'p7', sku: 'MK-1007', categoryId: 'candles', name: 'נרונים 50 יח׳', description: 'נרונים בכוסית אלומיניום, כ־4 שעות בעירה.', price: 8.9, unit: 'מארז', emoji: '✨' },
  // כלי בית
  { id: 'p8', sku: 'MK-1008', categoryId: 'home', name: 'סט סירים 7 חלקים', description: 'סט סירים גרניט עם ציפוי נון־סטיק, מתאים לכל הכיריים.', price: 199, oldPrice: 349, emoji: '🍲', badge: 'מציאה' },
  { id: 'p9', sku: 'MK-1009', categoryId: 'home', name: 'מחבת גרניט 28 ס״מ', description: 'מחבת קלה ועמידה עם ציפוי שאינו נדבק.', price: 39.9, oldPrice: 69.9, emoji: '🍳' },
  { id: 'p10', sku: 'MK-1010', categoryId: 'home', name: 'סט אחסון 10 קופסאות', description: 'קופסאות אחסון שקופות עם סגירה הרמטית.', price: 29.9, emoji: '📦' },
  { id: 'p11', sku: 'MK-1011', categoryId: 'home', name: 'מגש הגשה מעוצב', description: 'מגש מלמין מעוצב, עמיד וקל לניקוי.', price: 14.9, emoji: '🫕' },
  // חשמל ותאורה
  { id: 'p12', sku: 'MK-1012', categoryId: 'electric', name: 'קומקום נירוסטה 1.8 ל׳', description: 'קומקום חשמלי מהיר עם כיבוי אוטומטי.', price: 49.9, oldPrice: 89.9, emoji: '🫖' },
  { id: 'p13', sku: 'MK-1013', categoryId: 'electric', name: 'פלטת שבת גדולה', description: 'פלטת שבת איכותית עם משטח נירוסטה.', price: 119, emoji: '♨️', badge: 'הכי נמכר' },
  { id: 'p14', sku: 'MK-1014', categoryId: 'electric', name: 'מנורת לילה LED', description: 'מנורת לילה עם עמעום מגע ושלוש עוצמות תאורה.', price: 24.9, emoji: '💡' },
  { id: 'p15', sku: 'MK-1015', categoryId: 'electric', name: 'מאוורר עמוד 16״', description: 'מאוורר שקט עם 3 מהירויות וראש מסתובב.', price: 99, oldPrice: 149, emoji: '🌀' },
  // כלי עבודה
  { id: 'p16', sku: 'MK-1016', categoryId: 'tools', name: 'סט מברגים 32 חלקים', description: 'סט מברגים וביטים במזוודה קומפקטית.', price: 34.9, emoji: '🪛' },
  { id: 'p17', sku: 'MK-1017', categoryId: 'tools', name: 'ארגז כלים 19״', description: 'ארגז כלים חזק עם מגש פנימי נשלף.', price: 44.9, oldPrice: 69, emoji: '🧰' },
  { id: 'p18', sku: 'MK-1018', categoryId: 'tools', name: 'פנס עבודה נטען', description: 'פנס LED נטען USB עם תאורה חזקה במיוחד.', price: 29.9, emoji: '🔦' },
  // יודאיקה
  { id: 'p19', sku: 'MK-1019', categoryId: 'judaica', name: 'חנוכייה מהודרת', description: 'חנוכייה ממתכת בציפוי כסוף, עיצוב קלאסי.', price: 59.9, oldPrice: 99, emoji: '🕎', badge: 'מבצע חג' },
  { id: 'p20', sku: 'MK-1020', categoryId: 'judaica', name: 'גביע קידוש מהודר', description: 'גביע קידוש עם תחתית תואמת, ציפוי ניקל.', price: 39.9, emoji: '🏆' },
  { id: 'p21', sku: 'MK-1021', categoryId: 'judaica', name: 'סט פמוטים לשבת', description: 'זוג פמוטים מעוצבים ממתכת מצופה.', price: 49.9, emoji: '🕯️' },
  { id: 'p22', sku: 'MK-1022', categoryId: 'judaica', name: 'כיסוי חלה רקום', description: 'כיסוי חלה מבד סאטן עם רקמה מהודרת.', price: 24.9, emoji: '🥖' },
  // משתלה
  { id: 'p23', sku: 'MK-1023', categoryId: 'plants', name: 'עציץ פנים ירוק', description: 'צמח פנים טבעי בעציץ דקורטיבי – מגיע מוכן.', price: 29.9, emoji: '🪴' },
  { id: 'p24', sku: 'MK-1024', categoryId: 'plants', name: 'סחלב איכותי', description: 'סחלב פורח בכלי זכוכית – מתנה מושלמת.', price: 49.9, oldPrice: 79, emoji: '🌸' },
  { id: 'p25', sku: 'MK-1025', categoryId: 'plants', name: 'אדנית תבלינים', description: 'אדנית עם 3 צמחי תבלין טריים לבחירה.', price: 34.9, emoji: '🌿' },
  // עונה
  { id: 'p26', sku: 'MK-1026', categoryId: 'seasonal', name: 'מנגל שטח מתקפל', description: 'מנגל נירוסטה קל לנשיאה, מתאים לטיולים.', price: 59.9, oldPrice: 99, emoji: '🔥', badge: 'מבצע קיץ' },
  { id: 'p27', sku: 'MK-1027', categoryId: 'seasonal', name: 'כיסא ים מתקפל', description: 'כיסא שטח קל ונוח עם משענות יד.', price: 34.9, emoji: '🏖️' },
  { id: 'p28', sku: 'MK-1028', categoryId: 'seasonal', name: 'שק שינה למטייל', description: 'שק שינה חם וקומפקטי עם תיק נשיאה.', price: 69.9, oldPrice: 109, emoji: '🛌' },
]

export const byCategory = (categoryId: string) =>
  products.filter((p) => p.categoryId === categoryId)

export const getProduct = (id: string) => products.find((p) => p.id === id)

export const getCategory = (id: string) => categories.find((c) => c.id === id)
