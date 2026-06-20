/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0F2A33', 2: '#16404D', 3: '#3C5963' },
        teal: {
          50: '#EEF7F6', 100: '#D6EDEA', 200: '#ACDBD6', 300: '#7CC4BE',
          400: '#46A8A1', 500: '#168F87', 600: '#0D9488', 700: '#0B6E66',
          800: '#0C5650', 900: '#0C4640',
        },
        canvas: '#F6F8F8',
        line: '#E4EAEA',
        amber2: '#B45309',
        danger: '#DC2626',
        ok: '#059669',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,42,51,.05), 0 4px 16px rgba(15,42,51,.05)',
        pop: '0 8px 30px rgba(15,42,51,.14)',
      },
      borderRadius: { xl2: '1rem' },
    },
  },
  plugins: [],
}
