import { Link } from 'react-router-dom'
import { site, formatPrice } from '../config'
import { categories, products } from '../data/products'
import ProductCard from '../components/ProductCard'

export default function HomePage() {
  const deals = products.filter((p) => p.oldPrice).slice(0, 8)
  const featured = categories.slice(0, 4)

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <h1>
              מוצרים לבית <em>במחירי מפעל</em>
              <br />
              ישירות מהיבואן אליכם
            </h1>
            <p>
              חד־פעמי, נרות, כלי בית, חשמל ותאורה, יודאיקה ועוד – כל מה שהבית צריך,
              במחירים שלא תמצאו בשום מקום אחר. משלוחים לכל הארץ.
            </p>
            <div className="hero-ctas">
              <Link to="/catalog" className="btn btn-accent">
                לכל המוצרים
              </Link>
              <Link to="/branches" className="btn btn-ghost" style={{ borderColor: '#fff', color: '#fff' }}>
                איפה אנחנו?
              </Link>
            </div>
            <div className="hero-trust">
              <div>
                <strong>+1,000</strong>
                מוצרים במלאי
              </div>
              <div>
                <strong>{formatPrice(site.shipping.deliveryFee)}</strong>
                משלוח לכל הארץ
              </div>
              <div>
                <strong>{site.branches.length}</strong>
                סניפים פיזיים
              </div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden>
            {featured.map((c) => (
              <Link to={`/catalog/${c.id}`} key={c.id} className="hero-tile">
                <span>{c.emoji}</span>
                <b>{c.name}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="perks">
        <div className="container perks-inner">
          <div className="perk">
            <span>🚚</span>
            <div>
              משלוח עד הבית
              <small>{site.shipping.eta}</small>
            </div>
          </div>
          <div className="perk">
            <span>💰</span>
            <div>
              מחירי מפעל
              <small>ישירות מהיבואן, בלי פערי תיווך</small>
            </div>
          </div>
          <div className="perk">
            <span>🏬</span>
            <div>
              איסוף עצמי חינם
              <small>מהסניפים – ללא מינימום הזמנה</small>
            </div>
          </div>
          <div className="perk">
            <span>📞</span>
            <div>
              שירות אישי
              <small>בטלפון ובוואטסאפ, לפני ואחרי הקנייה</small>
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>קנו לפי קטגוריה</h2>
              <p>כל המחלקות של חנות המפעל – במקום אחד</p>
            </div>
            <Link to="/catalog" className="btn btn-ghost btn-sm">
              לכל הקטגוריות
            </Link>
          </div>
          <div className="cat-grid">
            {categories.map((c) => (
              <Link to={`/catalog/${c.id}`} key={c.id} className="cat-card">
                <span className="cat-emoji" aria-hidden>
                  {c.emoji}
                </span>
                <b>{c.name}</b>
                <p>{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <h2>המבצעים החמים 🔥</h2>
              <p>מחירים מיוחדים לזמן מוגבל – עד גמר המלאי</p>
            </div>
          </div>
          <div className="product-grid">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <h2>לא מצאתם את מה שחיפשתם?</h2>
            <p>דברו איתנו בוואטסאפ – נשמח לעזור ולבדוק זמינות במלאי</p>
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
    </>
  )
}
