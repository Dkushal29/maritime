import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#020D18',
          900: '#061525',
          800: '#0B1F36',
          700: '#0F2D50',
          600: '#123B67',
        },
        sea: {
          500: '#1a4a7a',
        },
        electric: {
          DEFAULT: '#1683FF',
          light: '#4da3ff',
        },
        cyan: {
          DEFAULT: '#22D3EE',
          dim: '#0e9ab0',
        },
        aqua: '#38BDF8',
        success: {
          DEFAULT: '#10B981',
          dim: '#059669',
        },
        warning: '#F59E0B',
        critical: '#EF4444',
        'purple-ai': '#8B5CF6',
        maritime: {
          darkest: '#020D18',
          bg: '#061525',
          card: '#0B1F36',
          cardBorder: 'rgba(22, 131, 255, 0.12)',
          hover: '#0F2D50',
          cyan: '#22D3EE',
          cyanGlow: 'rgba(34, 211, 238, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
