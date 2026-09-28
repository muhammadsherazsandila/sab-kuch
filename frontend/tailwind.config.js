/** @type {import('tailwindcss').Config} */
export default {
  // ── Dark mode via class strategy ────────────────────────────────────────────
  darkMode: ['class'],

  // ── Content paths (for purging unused styles) ───────────────────────────────
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],

  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      // ── Brand Colours ────────────────────────────────────────────────────────
      colors: {
        // Primary = orangered (#ff4500) with a full tonal palette
        primary: {
          DEFAULT: '#ff4500',
          50:  '#fff5f0',
          100: '#ffe8dc',
          200: '#ffc8b0',
          300: '#ffa07a',
          400: '#ff6b35',
          500: '#ff4500',  // ← main brand colour
          600: '#e03d00',
          700: '#b83200',
          800: '#8f2700',
          900: '#661c00',
          foreground: '#ffffff',
        },
        // Neutral grays used for backgrounds and text
        background: '#ffffff',
        foreground: '#1a1a1a',
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#6b6b6b',
        },
        border: '#e5e5e5',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1a1a1a',
        },
        // shadcn/ui design token aliases
        destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
        accent:      { DEFAULT: '#f5f5f5', foreground: '#1a1a1a' },
        popover:     { DEFAULT: '#ffffff', foreground: '#1a1a1a' },
        secondary:   { DEFAULT: '#f5f5f5', foreground: '#1a1a1a' },
        input:       '#e5e5e5',
        ring:        '#ff4500',
      },

      // ── Typography ───────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ── Border Radius ────────────────────────────────────────────────────────
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
        xl: '16px',
        '2xl': '20px',
      },

      // ── Keyframes for shadcn/ui animations ───────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'slide-in':       'slide-in-from-bottom 0.3s ease-out',
        'fade-in':        'fade-in 0.2s ease-out',
      },
    },
  },

  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('tailwindcss-animate'),
  ],
};
