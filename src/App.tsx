import { Suspense, lazy } from 'react'
import BackgroundFX from './components/BackgroundFX'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import FinalCTA from './components/FinalCTA'

const HubSection = lazy(() => import('./components/HubSection'))
const DashboardSection = lazy(() => import('./components/DashboardSection'))

const sectionFallback = (
  <div style={{ minHeight: '100vh' }} aria-hidden="true" />
)

export default function App() {
  return (
    <>
      <BackgroundFX />
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <Suspense fallback={sectionFallback}>
          <HubSection />
        </Suspense>
        <Suspense fallback={sectionFallback}>
          <DashboardSection />
        </Suspense>
        <FinalCTA />
      </main>
    </>
  )
}
