/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface / background scale — values owned by CSS vars in src/index.css
        // (:root for dark, [data-theme="light"] for light). See Plan 07-01.
        ink: {
          950: 'var(--color-ink-950)',
          900: 'var(--color-ink-900)',
          800: 'var(--color-ink-800)',
          700: 'var(--color-ink-700)',
          600: 'var(--color-ink-600)',
          500: 'var(--color-ink-500)',
          400: 'var(--color-ink-400)',
        },
        // Brand — identity governed by CSS vars (theme-aware)
        brand: {
          DEFAULT: 'var(--color-brand)',
          light:   'var(--color-brand-light)',
          dark:    'var(--color-brand-dark)',
          muted:   'var(--color-brand-muted)',
        },
        // Secondary accent — identity governed by CSS vars (theme-aware)
        accent: {
          DEFAULT: 'var(--color-accent)',
          light:   'var(--color-accent-light)',
          dark:    'var(--color-accent-dark)',
          muted:   'var(--color-accent-muted)',
        },
        // Text scale — theme-aware via CSS vars
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
          inverse:   'var(--color-text-inverse)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.15), transparent), linear-gradient(180deg, #12121F 0%, #0D0D1A 100%)',
        'brand-gradient': 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04))',
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
        // NOTE: pulse2 runs infinite — MUST be applied with motion-safe: prefix
        // in all components: use 'motion-safe:animate-pulse2' never 'animate-pulse2'
        pulse2: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
