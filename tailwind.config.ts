import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        'muted-bg': 'var(--muted-bg)',
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'button-primary-bg': 'var(--button-primary-bg)',
        'button-primary-text': 'var(--button-primary-text)',
        'button-secondary-bg': 'var(--button-secondary-bg)',
        'button-secondary-text': 'var(--button-secondary-text)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-up': 'fadeUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem', // Default is 0.5rem, can adjust if needed
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
export default config
