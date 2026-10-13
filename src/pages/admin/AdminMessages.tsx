import { getDB } from '../../db'

/** יומן כל ה-SMS והמיילים שנשלחו (דמו – בפרודקשן ספק אמיתי) */
export default function AdminMessages() {
  const db = getDB()
  return (
    <div>
      <div className="notice" style={{ marginBottom: 20 }}>
        דמו: כאן נרשמת כל הודעה שהמערכת "שולחת". בפרודקשן: מייל דרך Resend/SendGrid
        (חינם), וואטסאפ דרך WhatsApp Business API. מדיניות הערוצים: סיסמאות
        ואישורי הזמנה – מייל+וואטסאפ; תזכורות – מייל בלבד.
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>מתי</th>
              <th>ערוץ</th>
              <th>אל</th>
              <th>נושא</th>
              <th>תוכן</th>
            </tr>
          </thead>
          <tbody>
            {db.messages.slice(0, 100).map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.at).toLocaleString('he-IL')}</td>
                <td>{m.channel === 'whatsapp' ? '💚 וואטסאפ' : '📧 מייל'}</td>
                <td dir="ltr">{m.to}</td>
                <td>{m.subject}</td>
                <td style={{ whiteSpace: 'pre-wrap', maxWidth: 420 }}>{m.body}</td>
              </tr>
            ))}
            {db.messages.length === 0 && (
              <tr>
                <td colSpan={5} className="unit">
                  עדיין לא נשלחו הודעות.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
