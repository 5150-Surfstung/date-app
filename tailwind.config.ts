import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ob: {
          DEFAULT: '#0C0B09',
          1: '#141210',
          2: '#1C1A16',
          3: '#28251E',
          4: '#333028',
        },
        gold: {
          DEFAULT: '#C8A24A',
          faint: 'rgba(200,162,74,0.11)',
        },
        chalk: {
          DEFAULT: '#EDE7DA',
          2: '#C4BEAF',
          3: '#766F63',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Palatino', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
