import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { categories, products, getCategory } from '../data/products'
import ProductCard from '../components/ProductCard'

export default function CatalogPage() {
  const { categoryId } = useParams()
  const [query, setQuery] = useState('')
  const category = categoryId ? getCategory(categoryId) : undefined

  const filtered = useMemo(() => {
    const q = query.trim()
    return products.filter((p) => {
      if (category && p.categoryId !== category.id) return false
      if (!q) return true
      return p.name.includes(q) || p.description.includes(q)
    })
  }, [category, query])

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumbs" aria-label="פירורי לחם">
          <Link to="/">דף הבית</Link> / <Link to="/catalog">כל המוצרים</Link>
          {category && <> / {category.name}</>}
        </nav>
        <div className="section-head">
          <div>
            <h2>{category ? `${category.emoji} ${category.name}` : 'כל המוצרים'}</h2>
            <p>{category ? category.blurb : `${products.length} מוצרים במחירי מפעל`}</p>
            {category?.subs && (
              <p className="unit" style={{ marginTop: 6 }}>
                {category.subs.join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div className="catalog-tools">
          <div className="search-box">
            <input
              type="search"
              placeholder="חיפוש מוצר…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="חיפוש מוצר"
            />
            <span aria-hidden>🔍</span>
          </div>
          <div className="chip-row">
            <Link to="/catalog" className={`chip${!category ? ' active' : ''}`}>
              הכול
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/catalog/${c.id}`}
                className={`chip${category?.id === c.id ? ' active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden>🔎</span>
            <p>לא נמצאו מוצרים התואמים את החיפוש.</p>
            <p>נסו מילה אחרת, או דברו איתנו בוואטסאפ – אולי זה במלאי בסניף.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
