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
        // Constellation tokens — CSS-var backed, theme-aware (Phase 15)
        constellation: {
          edge:      'var(--color-constellation-edge)',
          edgeHeavy: 'var(--color-constellation-edge-heavy)',
          halo:      'var(--color-constellation-halo)',
        },
        hintPill: {
          bg:   'var(--color-hint-pill-bg)',
          text: 'var(--color-hint-pill-text)',
        },
        // Phase 16 — filter chips, year slider, floating card, CV CTA
        chip: {
          activeBg:      'var(--color-chip-active-bg)',
          activeText:    'var(--color-chip-active-text)',
          outlineBorder: 'var(--color-chip-outline-border)',
          outlineText:   'var(--color-chip-outline-text)',
        },
        slider: {
          track:       'var(--color-slider-track)',
          range:       'var(--color-slider-range)',
          thumb:       'var(--color-slider-thumb)',
          thumbBorder: 'var(--color-slider-thumb-border)',
        },
        card: {
          bg:      'var(--color-card-bg)',
          border:  'var(--color-card-border)',
          overlay: 'var(--color-card-overlay-bg)',
        },
        cvCta: {
          bg:      'var(--color-cv-cta-bg)',
          text:    'var(--color-cv-cta-text)',
          hoverBg: 'var(--color-cv-cta-hover-bg)',
        },
        // v4.0 canonical spec tokens — direct CSS-var aliases
        bg:        'var(--bg)',
        'bg-2':    'var(--bg-2)',
        'bg-3':    'var(--bg-3)',
        surface:   'var(--surface)',
        border:    'var(--border)',
        text:      'var(--text)',
        muted:     'var(--muted)',
        'accent-2':'var(--accent-2)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Gradients resolve via CSS vars (theme-aware) — see src/index.css
        // (:root + [data-theme="light"]). Phase 7 review WR-01 / WR-02.
        'hero-gradient': 'var(--bg-hero-gradient)',
        'brand-gradient': 'var(--bg-brand-gradient)',
        'card-gradient': 'var(--bg-card-gradient)',
        // v4.0 spec gradient
        'grad-accent': 'linear-gradient(135deg, #00E5A8 0%, #00C2FF 100%)',
      },
      boxShadow: {
        // Shadows resolve via CSS vars (theme-aware) — see src/index.css
        // (:root + [data-theme="light"]). Phase 7 review WR-03.
        brand:     'var(--shadow-brand)',
        'brand-lg':'var(--shadow-brand-lg)',
        card:      'var(--shadow-card)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out',
        'slide-up':     'slideUp 0.6s ease-out',
        pulse2:         'pulse2 2s ease-in-out infinite',
        // Constellation reveal animations (Phase 15) — use motion-safe: prefix
        'node-reveal':   'nodeReveal 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'edge-reveal':   'edgeReveal 300ms ease-out both',
        'hint-fade-out': 'hintFadeOut 600ms ease-in forwards',
        // Phase 16 — filter chip + floating card animations
        // NOTE: All Phase 16 card + chip animations MUST be applied with motion-safe: prefix
        // Example: 'motion-safe:animate-card-fade-in' never 'animate-card-fade-in'
        'card-fade-in':  'cardFadeIn 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'card-slide-up': 'cardSlideUp 250ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'card-swap-out': 'cardSwapOut 75ms ease-in both',
        'card-swap-in':  'cardSwapIn 75ms ease-out both',
        'chip-flash':    'chipFlash 100ms ease-out both',
        // Phase 19 (v3.9 POLISH-02) — SVG node ambient twinkle for the never-static-constellation requirement.
        // Per-node delay/duration randomized via inline style in SvgConstellation (deterministic per node.id hash).
        // MUST be applied with motion-safe: prefix — reduced-motion users keep static path (a11y locked).
        'svg-twinkle':   'svgTwinkle 4s ease-in-out infinite',
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
        // Constellation node reveal — scale from center (GPU-composited transform+opacity)
        nodeReveal: {
          '0%':   { opacity: '0', transform: 'scale(0.3)' },
          '70%':  { opacity: '1', transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1.0)' },
        },
        // Edge reveal — opacity-only (GPU-composited; stroke-dashoffset requires pathLength normalization)
        edgeReveal: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Hint pill fade out — used when user interacts with constellation
        hintFadeOut: {
          '0%':   { opacity: '1' },
          '80%':  { opacity: '1' },
          '100%': { opacity: '0', pointerEvents: 'none' },
        },
        // Phase 16 keyframes — GPU-composited transform+opacity only
        cardFadeIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1.0)' },
        },
        cardSlideUp: {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0%)' },
        },
        cardSwapOut: {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
        cardSwapIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        chipFlash: {
          '0%':   { opacity: '1' },
          '50%':  { opacity: '0.5', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1.0)' },
        },
        // Phase 19 (v3.9 POLISH-02) — gentle opacity twinkle for SVG-path nodes
        // so reduced-motion-OFF SVG users perceive motion (parity with WebGL ambient drift).
        // Opacity-only animation = GPU-composited, no layout thrash, no SVG transform-origin quirks.
        // Amplitude small (1.0 → 0.7) — perceptible without distraction.
        svgTwinkle: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
