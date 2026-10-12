import { site } from '../config'

export default function WhatsAppFloat() {
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent('שלום, אשמח לפרטים על המוצרים בחנות')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="דברו איתנו בוואטסאפ"
      title="דברו איתנו בוואטסאפ"
    >
      💬
    </a>
  )
}
