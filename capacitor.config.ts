import type { CapacitorConfig } from '@capacitor/cli'

/**
 * הגדרות Capacitor – עוטפות את האפליקציה כאפליקציה נייטיבית
 * ל-App Store ול-Google Play. ראו README – "העלאה לחנויות".
 */
const config: CapacitorConfig = {
  appId: 'com.chesedstock.app',
  appName: 'חסד סטוק',
  webDir: 'dist',
  backgroundColor: '#faf7f0',
}

export default config
