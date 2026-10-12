import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { findUser, findUserByLogin, getDB, saveDB, subscribeDB, uid } from './db'
import { notifyAdmin, track } from './notify'
import type { User } from './types'

const SESSION_KEY = 'store-session-v1'

interface AuthValue {
  user: User | null
  login: (login: string, password: string) => string | null
  logout: () => void
  register: (name: string, phone: string, email: string) => string | null
  toggleLike: (productId: string) => void
  /** מכריח רינדור מחדש אחרי שינוי ב-DB */
  version: number
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY)
    } catch {
      return null
    }
  })
  const [version, setVersion] = useState(0)

  useEffect(() => subscribeDB(() => setVersion((v) => v + 1)), [])

  const login = useCallback((loginStr: string, password: string): string | null => {
    const u = findUserByLogin(loginStr)
    if (!u || u.password !== password) return 'שם משתמש או סיסמה שגויים'
    if (u.status === 'pending') return 'החשבון ממתין לאישור מנהל – נעדכן אותך ב-SMS ובמייל'
    if (u.status === 'blocked') return 'החשבון חסום – צרו קשר עם החנות'
    setUserId(u.id)
    try {
      localStorage.setItem(SESSION_KEY, u.id)
    } catch {
      /* דמו */
    }
    return null
  }, [])

  const logout = useCallback(() => {
    setUserId(null)
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* דמו */
    }
  }, [])

  const register = useCallback((name: string, phone: string, email: string): string | null => {
    const db = getDB()
    const cleanPhone = phone.replace(/\s/g, '')
    if (db.users.some((u) => u.phone.replace(/-/g, '') === cleanPhone.replace(/-/g, '')))
      return 'מספר הטלפון כבר רשום במערכת – נסו להתחבר או פנו אלינו'
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
      return 'כתובת האימייל כבר רשומה במערכת'
    const user: User = {
      id: uid(),
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      username: cleanPhone.replace(/-/g, ''),
      password: '',
      role: 'customer',
      status: 'pending',
      categoryId: null,
      likes: [],
      createdAt: Date.now(),
    }
    db.users.push(user)
    saveDB()
    notifyAdmin('נרשם לקוח חדש 🎉', `${user.name} (${user.phone}) ממתין לאישור ולשיוך קטגוריית לקוח.`)
    return null
  }, [])

  const toggleLike = useCallback(
    (productId: string) => {
      if (!userId) return
      const db = getDB()
      const u = db.users.find((x) => x.id === userId)
      if (!u) return
      if (u.likes.includes(productId)) {
        u.likes = u.likes.filter((p) => p !== productId)
      } else {
        u.likes.push(productId)
        track('like', userId, productId)
      }
      saveDB()
    },
    [userId],
  )

  const value = useMemo<AuthValue>(() => {
    const user = userId ? (findUser(userId) ?? null) : null
    return { user, login, logout, register, toggleLike, version }
  }, [userId, login, logout, register, toggleLike, version])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
