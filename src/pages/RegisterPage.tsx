import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'נא למלא שם מלא'
    if (!/^0\d{1,2}-?\d{7}$/.test(form.phone.replace(/\s/g, ''))) next.phone = 'נא למלא טלפון ישראלי תקין'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'נא למלא אימייל תקין'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const err = register(form.name, form.phone, form.email)
    if (err) {
      setErrors({ general: err })
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <section className="section">
        <div className="container">
          <div className="success-box">
            <div className="big" aria-hidden>📨</div>
            <h2>הבקשה התקבלה!</h2>
            <p>
              המנהל יאשר את החשבון בהקדם, ושם המשתמש והסיסמה יישלחו אליך
              <b> ב-SMS ובמייל</b>. לאחר מכן תוכלו להתחבר וליהנות מהמחירים שלכם.
            </p>
            <Link to="/catalog" className="btn btn-primary">
              בינתיים – לצפייה במוצרים
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container auth-box">
        <h2>הרשמה ללקוחות חדשים</h2>
        <p className="unit" style={{ marginBottom: 20 }}>
          לאחר אישור המנהל תקבלו שם משתמש וסיסמה ב-SMS ובמייל, ותיהנו ממחירים
          מותאמים אישית.
        </p>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="name">שם מלא *</label>
            <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="phone">טלפון נייד *</label>
            <input id="phone" type="tel" dir="ltr" style={{ textAlign: 'end' }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" placeholder="050-1234567" />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="email">אימייל *</label>
            <input id="email" type="email" dir="ltr" style={{ textAlign: 'end' }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          {errors.general && (
            <p className="error" role="alert" style={{ marginTop: 10, color: 'var(--red-600)' }}>
              {errors.general}
            </p>
          )}
          <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: 20 }}>
            שליחת בקשת הרשמה
          </button>
        </form>
        <p style={{ marginTop: 18, fontSize: '0.92rem' }}>
          כבר רשומים? <Link to="/login" style={{ textDecoration: 'underline', fontWeight: 700 }}>התחברות</Link>
        </p>
      </div>
    </section>
  )
}
