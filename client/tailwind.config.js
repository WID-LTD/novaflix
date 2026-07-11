/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#090909',
          secondary: '#111111',
          card: '#181818',
        },
        accent: {
          DEFAULT: '#E50914',
          secondary: '#FF4D4F',
        },
        premium: {
          DEFAULT: '#F5A623',
          light: '#FFD700',
        },
        creator: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
        },
        success: '#00C853',
        info: '#00B8FF',
        warning: '#FFC107',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['64px', { lineHeight: '1.1', fontWeight: '700' }],
        'section': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'movie-title': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
