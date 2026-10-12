import { Link } from 'react-router-dom'
import { formatPrice } from '../config'
import { useCart } from '../cart'
import { showToast } from './Toast'
import type { Product } from '../data/products'

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  return (
    <article className="product-card">
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <Link to={`/product/${product.id}`} aria-label={product.name}>
        <div className="product-media" aria-hidden={!product.image}>
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" />
          ) : (
            product.emoji
          )}
        </div>
      </Link>
      <div className="product-body">
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="desc">{product.description}</p>
        <div className="price-row">
          <span className="price">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="old-price">{formatPrice(product.oldPrice)}</span>}
          {product.unit && <span className="unit">ל{product.unit}</span>}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            add(product.id)
            showToast('המוצר נוסף לעגלה ✓')
          }}
        >
          הוסיפו לעגלה
        </button>
      </div>
    </article>
  )
}
