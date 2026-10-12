import { site, formatPrice } from '../config'

const faqs = [
  {
    q: 'איך מזמינים מהאתר?',
    a: 'מוסיפים מוצרים לעגלה, ממלאים פרטים בעמוד השלמת ההזמנה, וההזמנה נשלחת אלינו בוואטסאפ. נציג חוזר אליכם לאישור, תשלום ותיאום משלוח או איסוף.',
  },
  {
    q: 'כמה עולה משלוח?',
    a: `דמי המשלוח הם ${formatPrice(site.shipping.deliveryFee)} לכל הארץ. בהזמנה מעל ${formatPrice(site.shipping.freeDeliveryFrom)} המשלוח חינם.`,
  },
  {
    q: 'יש מינימום הזמנה?',
    a: `למשלוח – כן, ${formatPrice(site.shipping.minOrderForDelivery)}. לאיסוף עצמי מהסניף אין שום מינימום, ואפשר לקנות גם פריט אחד.`,
  },
  {
    q: 'תוך כמה זמן ההזמנה מגיעה?',
    a: `זמן האספקה המשוער הוא ${site.shipping.eta}, בהתאם ליום ההזמנה ולאזור המגורים.`,
  },
  {
    q: 'איך משלמים?',
    a: 'התשלום מתבצע מול נציג – בטלפון, בוואטסאפ או בסניף, באשראי או במזומן. האתר אינו גובה תשלום אונליין.',
  },
  {
    q: 'אפשר להחזיר או להחליף מוצר?',
    a: 'כן. ניתן להחזיר או להחליף מוצר באריזתו המקורית בתוך 14 יום, בהתאם לתקנות הגנת הצרכן. פשוט צרו איתנו קשר ונסדר הכול.',
  },
  {
    q: 'המוצר שחיפשתי לא באתר – מה עושים?',
    a: 'המלאי בסניפים גדול בהרבה ממה שמופיע באתר. שלחו לנו הודעה בוואטסאפ עם מה שאתם מחפשים – נבדוק זמינות ונחזור אליכם.',
  },
]

export default function FaqPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="section-head">
          <div>
            <h2>שאלות נפוצות</h2>
            <p>כל מה שרציתם לדעת לפני שמזמינים</p>
          </div>
        </div>
        {faqs.map((f) => (
          <details className="faq-item" key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <div className="cta-band" style={{ marginTop: 32 }}>
          <h2>נשארה שאלה?</h2>
          <p>אנחנו זמינים בוואטסאפ ובטלפון {site.phone}</p>
          <a
            className="btn btn-accent"
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            דברו איתנו
          </a>
        </div>
      </div>
    </section>
  )
}
