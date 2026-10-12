import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getProduct, type Product } from './data/products'

export interface CartLine {
  productId: string
  qty: number
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  /** מתי העגלה עודכנה לאחרונה – לזיהוי עגלה נטושה */
  updatedAt: number | null
  add: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  itemsDetailed: { product: Product; qty: number; total: number }[]
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'store-cart-v1'

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l): l is CartLine =>
        l && typeof l.productId === 'string' && typeof l.qty === 'number' && l.qty > 0 && !!getProduct(l.productId),
    )
  } catch {
    return []
  }
}

const UPDATED_KEY = 'store-cart-updated-v1'

function loadUpdatedAt(): number | null {
  try {
    const v = localStorage.getItem(UPDATED_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadCart)
  const [updatedAt, setUpdatedAt] = useState<number | null>(loadUpdatedAt)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* אחסון לא זמין – העגלה תחיה בזיכרון בלבד */
    }
  }, [lines])

  useEffect(() => {
    const now = Date.now()
    setUpdatedAt(now)
    try {
      localStorage.setItem(UPDATED_KEY, String(now))
    } catch {
      /* דמו */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines])

  const add = useCallback((productId: string, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId)
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l))
      }
      return [...prev, { productId, qty }]
    })
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    )
  }, [])

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(() => {
    const itemsDetailed = lines
      .map((l) => {
        const product = getProduct(l.productId)
        return product ? { product, qty: l.qty, total: product.price * l.qty } : null
      })
      .filter((x): x is { product: Product; qty: number; total: number } => x !== null)
    const subtotal = itemsDetailed.reduce((s, i) => s + i.total, 0)
    const count = itemsDetailed.reduce((s, i) => s + i.qty, 0)
    return { lines, count, subtotal, updatedAt, add, setQty, remove, clear, itemsDetailed }
  }, [lines, updatedAt, add, setQty, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
