export interface Category {
  id: string
  name: string
  emoji: string
  blurb: string
  /** תתי־קטגוריות (מהאתר הקיים) – משמשות כתגיות חיפוש */
  subs?: string[]
}

export interface Product {
  id: string
  /** מק"ט פנימי – מוצג למנהל בלבד, לא ללקוח */
  sku: string
  categoryId: string
  name: string
  description: string
  /** המחירים הם Placeholder עד קבלת דפי הקטגוריות עם המחירים האמיתיים */
  price: number
  /** מחיר קודם – להצגת "מחיר מבצע" */
  oldPrice?: number
  unit?: string
  emoji: string
  /** נתיב/כתובת לתמונה אמיתית – כשיש, מוצג במקום האייקון */
  image?: string
  badge?: string
}

/* עץ הקטגוריות האמיתי של חסד סטוק (מהאתר הקיים) */
export const categories: Category[] = [
  { id: 'havdalah', name: 'נרות הבדלה', emoji: '🕯️', blurb: 'נרות הבדלה דקורטיביים, צמה, צדיקים וסטים', subs: ['נרות הבדלה דקורטיבי', 'נרות הבדלה צמה', 'נרות הבדלה צדיקים', 'סט הבדלה', 'בשמים להבדלה', 'נרות הילולה', 'נרות זיכרון/שבת'] },
  { id: 'judaica', name: 'יודאיקה', emoji: '✡️', blurb: 'כוסות קידוש, פמוטים, מלחיות ונטלות', subs: ['כוסות קידוש', 'פמוטים', 'מלחיות', 'נטלות'] },
  { id: 'lighting-acc', name: 'אביזרים להדלקת נרות', emoji: '🔥', blurb: 'כוסיות, שמנים, פתילות, גפרורים וצינוריות', subs: ['כוסות לנרות שבת/חג', 'שמנים', 'פתילות לנרות', 'גפרורים', 'צינוריות'] },
  { id: 'hanukkah', name: 'מוצרי חנוכה', emoji: '🕎', blurb: 'חנוכיות, בתי חנוכיה, שמנים ונרות חנוכה', subs: ['חנוכיות', 'בתי חנוכיה', 'נרות חנוכה', 'ערכות שמן', 'שמנים למאור', 'כוסיות לחנוכה', 'חנוכה לילדים'] },
  { id: 'sukkot', name: 'סוכות', emoji: '🌿', blurb: 'סוכות ברזלים, סכך, בדים, תאורה וקישוטים', subs: ['סוכות ברזלים', 'קרשים ודפנות', 'סכך לסוכה', 'תאורה וחשמל לסוכה', 'ריהוט לסוכה', 'בדים לסוכה', 'קישוטים לסוכה', 'כלי עבודה'] },
  { id: 'disposables', name: 'כלים חד פעמיים', emoji: '🥤', blurb: 'צלחות, כוסות, סכו"ם, מפות ותבניות אלומיניום', subs: ['צלחות', 'כוסות', 'סכו"ם', 'שקיות', 'תבניות אלומיניום', 'היגיינה אישית', 'מפות', 'מצרכי אפייה', 'כלי איחסון'] },
  { id: 'keter', name: 'KETER – מוצרי כתר', emoji: '🪑', blurb: 'אביזרי בית, ארונות שירות, כסאות ושולחנות כתר', subs: ['אביזרי בית', 'ארונות שירות', 'כסאות', 'קופסאות אחסון', 'שולחנות'] },
  { id: 'electric', name: 'מוצרי חשמל', emoji: '💡', blurb: 'תאורה ומוצרי חשמל לבית ולמשרד', subs: ['תאורה', 'מוצרי חשמל לבית ולמשרד'] },
  { id: 'nursery', name: 'משתלת אלעד', emoji: '🪴', blurb: 'צמחים, סוקולנטים, אדניות וכל מה שהגינה צריכה', subs: ['צמחים', 'סוקולנטים', 'צמחיה מלאכותית', 'זרי פרחים', 'זרעים', 'תחזוקת גינה', 'אדניות וכלים', 'השקיה', 'אדמת שתילה'] },
  { id: 'summer', name: 'מוצרי קיץ', emoji: '🏖️', blurb: 'בריכות, גלגלי ים, משחקים ואביזרים לשטח', subs: ['גלגלי ים ומצופים', 'אביזרים לים', 'משחקים לים ולבריכה', 'אביזרים לשטח', 'בריכות', 'קוטלי יתושים'] },
  { id: 'folding', name: 'כסאות ומיטות מתקפלות', emoji: '🛋️', blurb: 'ריהוט מתקפל לבית, לאירוח ולשטח', subs: ['כסאות מתקפלות', 'מיטות מתקפלות'] },
  { id: 'stands', name: 'סטנדים לתצוגה', emoji: '🗄️', blurb: 'סטנדים ופתרונות תצוגה לחנויות' },
  { id: 'deals', name: 'מבצעים שווים', emoji: '🔥', blurb: 'המבצעים החמים של החנות' },
]

/*
 * שמות המוצרים לקוחים מהקטלוג האמיתי של האתר.
 * המחירים הם Placeholder בלבד – יעודכנו מדפי הקטגוריות של האתר
 * (וכך גם התמונות פר־מוצר והמק"טים האמיתיים).
 */
export const products: Product[] = [
  // נרות הבדלה
  { id: 'p1', sku: 'MK-1001', categoryId: 'havdalah', name: 'בשמים להבדלה גדול – ציפורן', description: 'בשמים להבדלה בניחוח ציפורן, גודל גדול.', price: 14.9, emoji: '🌸' },
  { id: 'p2', sku: 'MK-1002', categoryId: 'havdalah', name: 'בשמים להבדלה קטן – ציפורן', description: 'בשמים להבדלה בניחוח ציפורן, גודל קטן.', price: 9.9, emoji: '🌸' },
  { id: 'p3', sku: 'MK-1003', categoryId: 'havdalah', name: '50 נרות חימום 3 שעות – תפזורת', description: 'נרות חימום איכותיים, כ־3 שעות בעירה, בתפזורת.', price: 12.9, emoji: '🕯️', badge: 'הכי נמכר' },
  { id: 'p4', sku: 'MK-1004', categoryId: 'havdalah', name: '50 נרות חימום – תפזורת', description: 'נרות חימום סטנדרטיים בתפזורת.', price: 9.9, emoji: '🕯️' },
  // יודאיקה
  { id: 'p5', sku: 'MK-1005', categoryId: 'judaica', name: 'זוג מלחייה קריסטל עם כיתוב "שבת קודש"', description: 'זוג מלחיות קריסטל מהודרות עם כיתוב שבת קודש.', price: 19.9, emoji: '🧂' },
  { id: 'p6', sku: 'MK-1006', categoryId: 'judaica', name: 'זוג מלחייה שטוח עם כיתוב "שבת ויום טוב"', description: 'זוג מלחיות שטוחות עם כיתוב מהודר.', price: 14.9, emoji: '🧂' },
  { id: 'p7', sku: 'MK-1007', categoryId: 'judaica', name: 'כוס קידוש מהודרת', description: 'כוס קידוש בציפוי מהודר עם תחתית.', price: 39.9, emoji: '🏆' },
  { id: 'p8', sku: 'MK-1008', categoryId: 'judaica', name: 'פמוטים לשבת', description: 'זוג פמוטים מעוצבים לשולחן השבת.', price: 49.9, emoji: '🕯️' },
  // אביזרים להדלקת נרות
  { id: 'p9', sku: 'MK-1009', categoryId: 'lighting-acc', name: 'זוג כוסיות קריסטל עם גומי', description: 'זוג כוסיות קריסטל לנרות שבת עם גומייה.', price: 12.9, emoji: '✨' },
  { id: 'p10', sku: 'MK-1010', categoryId: 'lighting-acc', name: 'זוג כוסיות מעוטרות עם רגלית סיליקון', description: 'כוסיות מעוטרות לנרות שבת עם רגלית סיליקון.', price: 16.9, emoji: '✨' },
  { id: 'p11', sku: 'MK-1011', categoryId: 'lighting-acc', name: 'גפרורים גדולים – קופסא מעוצבת "אשת חיל"', description: 'קופסת גפרורים גדולים מעוצבת עם כיתוב אשת חיל.', price: 7.9, emoji: '🔥' },
  { id: 'p12', sku: 'MK-1012', categoryId: 'lighting-acc', name: 'הצינורית – פתרון לפתילות', description: 'צינורית מקורית לפתילות – הדלקה נקייה ונוחה.', price: 8.9, emoji: '🔥', badge: 'פטנט' },
  // מוצרי חנוכה
  { id: 'p13', sku: 'MK-1013', categoryId: 'hanukkah', name: 'בית חנוכיה "הבית המהודר" – גדול', description: 'בית חנוכיה מהודר מזכוכית ומתכת, גודל גדול.', price: 299, emoji: '🕎', badge: 'מבצע חג' },
  { id: 'p14', sku: 'MK-1014', categoryId: 'hanukkah', name: 'בית חנוכיה אפיריון לנרות חנוכה', description: 'בית חנוכיה דגם אפיריון, מתאים לנרות.', price: 199, emoji: '🕎' },
  { id: 'p15', sku: 'MK-1015', categoryId: 'hanukkah', name: 'בית חנוכיה מודפס "חומות ירושלים"', description: 'בית חנוכיה מעוגל עם הדפס חומות ירושלים.', price: 249, emoji: '🕎' },
  { id: 'p16', sku: 'MK-1016', categoryId: 'hanukkah', name: 'בית חנוכיה לחנוכה ושבת', description: 'בית חנוכיה משולב לחנוכה ולנרות שבת.', price: 229, emoji: '🕎' },
  // סוכות
  { id: 'p17', sku: 'MK-1017', categoryId: 'sukkot', name: 'בד לסוכה – נוף "לשנה הבאה בירושלים"', description: 'בד מודפס לסוכה עם נוף ירושלים.', price: 149, emoji: '🌿' },
  { id: 'p18', sku: 'MK-1018', categoryId: 'sukkot', name: 'דופן עם חלון לסוכה', description: 'דופן בד איכותית לסוכה עם חלון.', price: 89, emoji: '🌿' },
  { id: 'p19', sku: 'MK-1019', categoryId: 'sukkot', name: 'אקדח סיכות אוניברסלי', description: 'אקדח סיכות לבניית הסוכה ולעבודות הבית.', price: 34.9, emoji: '🛠️' },
  { id: 'p20', sku: 'MK-1020', categoryId: 'sukkot', name: 'דשא סינטטי', description: 'דשא סינטטי איכותי לסוכה ולגינה.', price: 59, emoji: '🌱' },
  // כלים חד פעמיים
  { id: 'p21', sku: 'MK-1021', categoryId: 'disposables', name: 'גביעים ומכסים', description: 'מארז גביעים עם מכסים – להגשה ולאירוח.', price: 11.9, emoji: '🥤' },
  { id: 'p22', sku: 'MK-1022', categoryId: 'disposables', name: 'דלי מגבונים לניקוי כללי', description: 'דלי מגבונים רב־שימושי לניקוי הבית.', price: 13.9, emoji: '🧻' },
  { id: 'p23', sku: 'MK-1023', categoryId: 'disposables', name: 'תבניות אלומיניום', description: 'תבניות אלומיניום במגוון גדלים לאפייה ולבישול.', price: 9.9, emoji: '🍽️' },
  // KETER
  { id: 'p24', sku: 'MK-1024', categoryId: 'keter', name: 'ארון אחסון מבית כתר', description: 'ארון אחסון חזק ועמיד מבית KETER.', price: 399, oldPrice: 549, emoji: '🗄️', badge: 'מציאה' },
  { id: 'p25', sku: 'MK-1025', categoryId: 'keter', name: 'ארון שירות נמוך – אפור בהיר', description: 'ארון שירות קומפקטי של כתר, אפור בהיר.', price: 279, emoji: '🗄️' },
  // מוצרי חשמל
  { id: 'p26', sku: 'MK-1026', categoryId: 'electric', name: 'מנורת לילה LED', description: 'מנורת לילה עם עמעום מגע.', price: 24.9, emoji: '💡' },
  { id: 'p27', sku: 'MK-1027', categoryId: 'electric', name: 'פלטת שבת', description: 'פלטת שבת איכותית עם משטח נירוסטה.', price: 119, emoji: '♨️', badge: 'הכי נמכר' },
  // משתלת אלעד
  { id: 'p28', sku: 'MK-1028', categoryId: 'nursery', name: 'אנטוריום', description: 'צמח אנטוריום פורח בעציץ – מתנה מושלמת.', price: 49.9, emoji: '🌺' },
  { id: 'p29', sku: 'MK-1029', categoryId: 'nursery', name: 'בזיליקום', description: 'צמח תבלין בזיליקום טרי בעציץ.', price: 12.9, emoji: '🌿' },
  { id: 'p30', sku: 'MK-1030', categoryId: 'nursery', name: 'אשיננטוס מונה ליזה', description: 'צמח תלייה פורח, קל לגידול.', price: 39.9, emoji: '🪴' },
  { id: 'p31', sku: 'MK-1031', categoryId: 'nursery', name: 'במבוק מלאכותי', description: 'צמחייה מלאכותית איכותית לעיצוב הבית.', price: 69, emoji: '🎋' },
  { id: 'p32', sku: 'MK-1032', categoryId: 'nursery', name: 'אגרטל עציץ זברה – חרס', description: 'עציץ חרס מעוצב בדוגמת זברה.', price: 29.9, emoji: '🏺' },
  // מוצרי קיץ
  { id: 'p33', sku: 'MK-1033', categoryId: 'summer', name: 'בריכה מתנפחת לילדים', description: 'בריכה מתנפחת בטוחה ואיכותית לילדים.', price: 79, oldPrice: 119, emoji: '🏊', badge: 'מבצע קיץ' },
  { id: 'p34', sku: 'MK-1034', categoryId: 'summer', name: 'גלגל ים לילדים', description: 'גלגל ים צבעוני ובטיחותי לילדים.', price: 19.9, emoji: '🛟' },
  { id: 'p35', sku: 'MK-1035', categoryId: 'summer', name: 'אפוד הצלה מתנפח', description: 'אפוד הצלה מתנפח איכותי במיוחד.', price: 39.9, emoji: '🦺' },
  { id: 'p36', sku: 'MK-1036', categoryId: 'summer', name: 'בריכת עמודים', description: 'בריכת עמודים משפחתית גדולה.', price: 349, emoji: '🏊' },
  // כסאות ומיטות מתקפלות
  { id: 'p37', sku: 'MK-1037', categoryId: 'folding', name: 'כסא מתקפל', description: 'כסא מתקפל חזק ונוח לאירוח ולשטח.', price: 34.9, emoji: '🪑' },
  { id: 'p38', sku: 'MK-1038', categoryId: 'folding', name: 'מיטה מתקפלת', description: 'מיטה מתקפלת עם מזרן – לאירוח ולטיולים.', price: 149, emoji: '🛏️' },
  // סטנדים
  { id: 'p39', sku: 'MK-1039', categoryId: 'stands', name: 'סטנד תצוגה לחנות', description: 'סטנד תצוגה מודולרי לחנויות ולתערוכות.', price: 199, emoji: '🗄️' },
  // מבצעים
  { id: 'p40', sku: 'MK-1040', categoryId: 'deals', name: 'בר משקאות נייד GO BAR', description: 'בר משקאות נייד – מושלם לאירועים ולגינה.', price: 129, oldPrice: 189, emoji: '🍹', badge: 'מבצע שווה' },
]

export const byCategory = (categoryId: string) =>
  products.filter((p) => p.categoryId === categoryId)

export const getProduct = (id: string) => products.find((p) => p.id === id)

export const getCategory = (id: string) => categories.find((c) => c.id === id)
