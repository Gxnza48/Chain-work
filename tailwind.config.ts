import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--bg) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        primary: { DEFAULT: 'rgb(var(--fg) / <alpha-value>)', foreground: 'rgb(var(--bg) / <alpha-value>)' },
        secondary: { DEFAULT: 'rgb(var(--surface-2) / <alpha-value>)', foreground: 'rgb(var(--fg) / <alpha-value>)' },
        muted: { DEFAULT: 'rgb(var(--surface-2) / <alpha-value>)', foreground: 'rgb(var(--fg-muted) / <alpha-value>)' },
        card: { DEFAULT: 'rgb(var(--surface) / <alpha-value>)', foreground: 'rgb(var(--fg) / <alpha-value>)' },
        popover: { DEFAULT: 'rgb(var(--surface) / <alpha-value>)', foreground: 'rgb(var(--fg) / <alpha-value>)' },
        destructive: { DEFAULT: 'rgb(var(--accent-rose) / <alpha-value>)', foreground: 'rgb(var(--bg) / <alpha-value>)' },
        input: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--fg-muted) / <alpha-value>)',
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--surface-2) / <alpha-value>)',
          foreground: 'rgb(var(--fg) / <alpha-value>)',
          blue: 'rgb(var(--accent-blue) / <alpha-value>)',
          violet: 'rgb(var(--accent-violet) / <alpha-value>)',
          emerald: 'rgb(var(--accent-emerald) / <alpha-value>)',
          amber: 'rgb(var(--accent-amber) / <alpha-value>)',
          rose: 'rgb(var(--accent-rose) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Geist', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / .08)',
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
