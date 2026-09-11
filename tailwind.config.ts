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
          950: '#070F1A',
          900: '#0B1726', // Deep navy background
          800: '#102235', // Secondary navy panels
          700: '#162C40', // Slightly lighter cards
          600: '#1F3B54', // Hover / elevated panels
          500: '#294154', // Muted blue-gray borders
        },
        sea: {
          500: '#1B354C',
        },
        // Restrained maritime palette mappings
        teal: {
          DEFAULT: '#35B8A6', // Main accent: muted teal
          hover: '#2EA595',
          dim: 'rgba(53, 184, 166, 0.15)',
        },
        sky: {
          DEFAULT: '#5D9BC4', // Secondary accent: desaturated sky blue
          hover: '#4C8AB3',
          dim: 'rgba(93, 155, 196, 0.15)',
        },
        // Direct aliasing so existing components automatically use restrained tones
        cyan: {
          DEFAULT: '#35B8A6', // Muted teal instead of bright cyan
          dim: '#2A9385',
          glow: 'rgba(53, 184, 166, 0.15)',
        },
        electric: {
          DEFAULT: '#5D9BC4', // Desaturated sky blue instead of neon blue
          light: '#7AAECF',
        },
        success: {
          DEFAULT: '#6DAF91', // Muted green
          dim: 'rgba(109, 175, 145, 0.15)',
        },
        warning: {
          DEFAULT: '#D6A24A', // Muted amber
          dim: 'rgba(214, 162, 74, 0.15)',
        },
        critical: {
          DEFAULT: '#C96B6B', // Muted red
          dim: 'rgba(201, 107, 107, 0.15)',
        },
        maritime: {
          bg: '#0B1726',
          panel: '#102235',
          card: '#162C40',
          border: '#294154',
          hover: '#1F3B54',
          textPrimary: '#E8F0F5',
          textSecondary: '#91A6B8',
          teal: '#35B8A6',
          sky: '#5D9BC4',
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
