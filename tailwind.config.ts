import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Ensure manual dark mode toggling works
  theme: {
    extend: {
      colors: {
        cream: 'var(--cream)',
        'cream-dark': 'var(--cream-dark)',
        parchment: 'var(--parchment)',
        ink: 'var(--ink)',
        charcoal: 'var(--charcoal)',
        stone: 'var(--stone)',
        gold: 'var(--gold)',
        'gold-dim': 'var(--gold-dim)',
        brown: 'var(--brown)',
        'deep-wood': 'var(--deep-wood)',
      },
      fontFamily: {
        serif: ['var(--font-playfair-display)', 'Georgia', 'serif'], // Will set up next font
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'slow-spin': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [typography],
}
export default config
