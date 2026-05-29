import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        accent: {
          blue: 'rgb(var(--accent-blue) / <alpha-value>)',
          violet: 'rgb(var(--accent-violet) / <alpha-value>)',
          emerald: 'rgb(var(--accent-emerald) / <alpha-value>)',
          amber: 'rgb(var(--accent-amber) / <alpha-value>)',
          rose: 'rgb(var(--accent-rose) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        brut: '4px 4px 0 0 rgb(var(--border))',
        'brut-sm': '2px 2px 0 0 rgb(var(--border))',
        'brut-lg': '6px 6px 0 0 rgb(var(--border))',
        'brut-blue': '4px 4px 0 0 rgb(var(--accent-blue))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-rise': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Override the built-in fast 1s spinner so every <Loader2 className="animate-spin" />
        // across the app rotates at a calmer, smoother pace.
        spin: 'spin 1.4s linear infinite',
        'spin-slow': 'spin 1.8s linear infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'fade-rise': 'fade-rise 0.4s ease-out both',
      },
    },
  },
  plugins: [animate],
};

export default config;
