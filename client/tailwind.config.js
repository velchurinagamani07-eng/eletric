/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Syne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          50: '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#475569',
          600: '#334155',
          700: '#1E3A5F',
          800: '#172554',
          900: '#0F172A',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        brand: {
          amber: '#F5A623',
          gray: '#1A1A2E',
          blue: '#3B82F6',
          mint: '#10B981',
          red: '#EF4444',
        },
      },
      boxShadow: {
        glow: '0 18px 70px rgba(245, 158, 11, 0.18)',
      },
    },
  },
  plugins: [],
}
