import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { useCart } from '../cart'
import { track } from '../notify'
import { showToast } from './Toast'
import PriceTag from './PriceTag'
import LikeButton from './LikeButton'
import type { Product } from '../data/products'

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const { user } = useAuth()

  return (
    <article className="product-card">
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <span className="card-like">
        <LikeButton productId={product.id} />
      </span>
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
        <PriceTag product={product} />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            add(product.id)
            track('add_to_cart', user?.id ?? null, product.id)
            showToast('המוצר נוסף לעגלה ✓')
          }}
        >
          הוסיפו לעגלה
        </button>
      </div>
    </article>
  )
}
