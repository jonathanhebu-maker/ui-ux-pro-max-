import { site, formatPrice } from '../config'

export default function BranchesPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>סניפים ומשלוחים</h2>
            <p>בואו לבקר אותנו בסניפים – או הזמינו משלוח עד הבית</p>
          </div>
        </div>

        <div className="branch-grid" style={{ marginBottom: 32 }}>
          {site.branches.map((b) => (
            <div className="branch-card" key={b.city}>
              <h3>🏬 סניף {b.city}</h3>
              <p>{b.address}</p>
              <p>שעות פתיחה: {b.hours}</p>
              <p style={{ marginTop: 10 }}>
                <a href={`tel:${site.phone.replace(/-/g, '')}`} className="btn btn-ghost btn-sm">
                  📞 {site.phone}
                </a>
              </p>
            </div>
          ))}
        </div>

        <div className="branch-card">
          <h3>🚚 מדיניות משלוחים</h3>
          <p>• דמי משלוח: {formatPrice(site.shipping.deliveryFee)} לכל הארץ.</p>
          <p>
            • מינימום הזמנה למשלוח: {formatPrice(site.shipping.minOrderForDelivery)} –
            בהזמנה קטנה יותר נשמח לראותכם בסניף.
          </p>
          <p>• משלוח חינם בהזמנה מעל {formatPrice(site.shipping.freeDeliveryFrom)}.</p>
          <p>• זמן אספקה: {site.shipping.eta}.</p>
          <p>• איסוף עצמי מהסניפים – חינם וללא מינימום הזמנה.</p>
        </div>
      </div>
    </section>
  )
}
