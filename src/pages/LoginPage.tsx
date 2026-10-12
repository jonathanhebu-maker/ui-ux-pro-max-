import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginStr, setLoginStr] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const err = login(loginStr, password)
    if (err) {
      setError(err)
      return
    }
    navigate('/')
  }

  return (
    <section className="section">
      <div className="container auth-box">
        <h2>התחברות</h2>
        <p className="unit" style={{ marginBottom: 20 }}>
          פרטי ההתחברות נשלחו אליך ב-SMS ובמייל לאחר אישור המנהל.
        </p>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="login">טלפון / אימייל / שם משתמש</label>
            <input
              id="login"
              value={loginStr}
              onChange={(e) => setLoginStr(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="error" role="alert" style={{ marginTop: 10, color: 'var(--red-600)' }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>
            התחברות
          </button>
        </form>
        <p style={{ marginTop: 18, fontSize: '0.92rem' }}>
          עדיין לא רשומים? <Link to="/register" style={{ textDecoration: 'underline', fontWeight: 700 }}>הרשמה ללקוחות חדשים</Link>
        </p>
        <p className="unit" style={{ marginTop: 8 }}>
          שכחתם סיסמה? פנו אלינו בטלפון או בוואטסאפ והמנהל ישלח לכם אותה מחדש ב-SMS ובמייל.
        </p>
      </div>
    </section>
  )
}
