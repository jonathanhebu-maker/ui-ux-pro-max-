import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import WhatsAppFloat from './components/WhatsAppFloat'
import Toast from './components/Toast'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import BranchesPage from './pages/BranchesPage'
import FaqPage from './pages/FaqPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AccountPage from './pages/AccountPage'
import FavoritesPage from './pages/FavoritesPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminMessages from './pages/admin/AdminMessages'
import AdminSettings from './pages/admin/AdminSettings'
import { useAuth } from './auth'
import { useCart } from './cart'
import { runReminderScan } from './notify'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** מנוע התזכורות – רץ בעלייה וכל דקה */
function ReminderEngine() {
  const { user } = useAuth()
  const { count, updatedAt } = useCart()
  useEffect(() => {
    const run = () => runReminderScan(user?.id ?? null, count, updatedAt)
    run()
    const t = setInterval(run, 60000)
    return () => clearInterval(t)
  }, [user?.id, count, updatedAt])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div className={isAdmin ? 'shell admin-shell' : 'shell app-shell'}>
      <ScrollToTop />
      <ReminderEngine />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:categoryId" element={<CatalogPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <BottomNav />
      <WhatsAppFloat />
      <Toast />
    </div>
  )
}
