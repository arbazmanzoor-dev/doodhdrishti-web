/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#2F2B6E', 50: '#F3F2FA', 700: '#25225A', 900: '#1A1842' },
        purple: { DEFAULT: '#7F79B6', light: '#A9A4D4' },
        saffron: { DEFAULT: '#E88A1A', dark: '#C9730F', light: '#FCEBD6' },
        lavender: { DEFAULT: '#ECEBF7', dark: '#DCDAF0' },
        pure: { DEFAULT: '#16A34A', bg: '#DCFCE7' },
        suspicious: { DEFAULT: '#D97706', bg: '#FEF3C7' },
        adulterated: { DEFAULT: '#DC2626', bg: '#FEE2E2' },
      },
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(47, 43, 110, 0.12)',
        lift: '0 12px 32px -8px rgba(47, 43, 110, 0.22)',
      },
    },
  },
  plugins: [],
};
