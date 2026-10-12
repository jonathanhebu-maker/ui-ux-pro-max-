import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // נתיבים יחסיים – מאפשר להריץ את הבנייה מכל כתובת (כולל תצוגה מקדימה מתארחת)
  base: './',
  plugins: [react()],
})
