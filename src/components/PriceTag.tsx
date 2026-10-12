import { formatPrice } from '../config'
import { useAuth } from '../auth'
import { discountFor, priceFor } from '../pricing'
import type { Product } from '../data/products'

/**
 * תג מחיר חכם: לאורח/לקוח ללא הנחה – מחיר רגיל (+מחיר קודם אם יש מבצע).
 * ללקוח עם הנחת קטגוריה – המחיר שלו + המחיר הרגיל מחוק + אחוז ההנחה.
 */
export default function PriceTag({ product, large = false }: { product: Product; large?: boolean }) {
  const { user } = useAuth()
  const discount = discountFor(user, product)
  const myPrice = priceFor(user, product)

  return (
    <div className="price-row">
      <span className="price" style={large ? { fontSize: '2rem' } : undefined}>
        {formatPrice(myPrice)}
      </span>
      {discount > 0 ? (
        <>
          <span className="old-price">{formatPrice(product.price)}</span>
          <span className="discount-chip">{discount}%- לחברים</span>
        </>
      ) : (
        product.oldPrice && <span className="old-price">{formatPrice(product.oldPrice)}</span>
      )}
      {product.unit && <span className="unit">ל{product.unit}</span>}
    </div>
  )
}
