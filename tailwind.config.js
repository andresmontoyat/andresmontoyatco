/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface / background scale (dark first — portfolio is dark-mode-first)
        ink: {
          950: '#0D0D1A',
          900: '#12121F',
          800: '#1A1A2E',
          700: '#1F1F3A',
          600: '#252545',
          500: '#2D2D5A',
        },
        // Brand accent — bold indigo/violet replaces dated neon cyan
        brand: {
          DEFAULT: '#6C63FF',
          light:   '#8B85FF',
          dark:    '#4A42E8',
          muted:   'rgba(108,99,255,0.15)',
        },
        // Secondary accent — warm coral for CTAs and highlights
        accent: {
          DEFAULT: '#FF6B6B',
          light:   '#FF8E8E',
          dark:    '#E64444',
        },
        // Text scale
        text: {
          primary:   '#F0F0FF',
          secondary: '#A0A0C0',
          muted:     '#606080',
          inverse:   '#0D0D1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,99,255,0.15), transparent), linear-gradient(180deg, #12121F 0%, #0D0D1A 100%)',
        'brand-gradient': 'linear-gradient(135deg, #6C63FF 0%, #FF6B6B 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(108,99,255,0.08), rgba(255,107,107,0.04))',
      },
      boxShadow: {
        brand:    '0 20px 40px -20px rgba(108,99,255,0.35)',
        'brand-lg': '0 25px 50px -20px rgba(108,99,255,0.55)',
        card:     '0 4px 24px rgba(13,13,26,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        pulse2: 'pulse2 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse2: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
