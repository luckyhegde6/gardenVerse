/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#ca8a04',
          600: '#a16207',
          700: '#854d0e',
          800: '#713f12',
          900: '#422006',
        },
        forest: {
          50: '#f0fdf4',
          100: '#d9f99d',
          200: '#bef264',
          300: '#a3e635',
          400: '#65a30d',
          500: '#4d7c0f',
          600: '#3f6212',
          700: '#365314',
          800: '#1a2e05',
          900: '#0f1b02',
        },
        eco: {
          blue: '#06b6d4',
          teal: '#14b8a6',
          amber: '#f59e0b',
          rose: '#f43f5e',
          lime: '#84cc16',
        },
        soil: {
          light: '#fef3c7',
          DEFAULT: '#d4a373',
          dark: '#8b5e3c',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['System'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'grow': 'grow 0.5s ease-out',
      },
      keyframes: {
        grow: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
