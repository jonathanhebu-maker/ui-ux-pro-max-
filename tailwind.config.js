/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg0: '#02040A',
        bg1: '#050812',
        bg2: '#080D18',
        blue: '#23B7FF',
        electric: '#3678FF',
        purple: '#7B4DFF',
        violet: '#B245FF',
        cyan: '#20E4FF',
        muted: '#9AA7C0',
      },
    },
  },
  plugins: [],
}
