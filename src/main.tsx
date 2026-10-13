import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { CartProvider } from './cart'
import { AuthProvider } from './auth'
import App from './App'
import './styles.css'

// רישום Service Worker – הופך את האפליקציה לניתנת להתקנה (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* סביבה שלא תומכת – האפליקציה עובדת רגיל */
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
