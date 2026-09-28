import type { Config } from 'tailwindcss'

// Token names are historical (ob/gold/chalk); values are the "Heat" palette:
// tomato-red ground, white type and accents.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ob: {
          DEFAULT: '#FF3B2F',
          1: '#E8342A',
          2: '#F2463A',
          3: 'rgba(255,255,255,0.38)',
          4: 'rgba(255,255,255,0.65)',
        },
        gold: {
          DEFAULT: '#FFFFFF',
          faint: 'rgba(255,255,255,0.16)',
        },
        chalk: {
          DEFAULT: '#FFFFFF',
          2: 'rgba(255,255,255,0.9)',
          3: 'rgba(255,255,255,0.72)',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-sora)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
