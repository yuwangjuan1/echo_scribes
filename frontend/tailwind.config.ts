import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#101012', soft: '#151518', raise: '#1b1b1f' },
        paper: { DEFAULT: '#ecebe6', dim: '#a3a19b', faint: '#6d6b66' },
        mist: { DEFAULT: '#e8e7e2', dim: '#a3a19b', faint: '#6d6b66' },
        accent: { DEFAULT: '#e85d2c', deep: '#c44a1e', soft: 'rgba(232,93,44,0.1)' },
        mint: { DEFAULT: '#46a06c', soft: 'rgba(70,160,108,0.1)' },
        rose: '#d9534f',
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'Georgia', '"Times New Roman"', 'STSong', 'SimSun', 'serif'],
        body: ['PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.33, 1, 0.68, 1) both',
        'fade-in': 'fade-in 0.6s ease both',
        'eq': 'eq-jump 1.2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2.4s ease-in-out infinite',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.33, 1, 0.68, 1) both',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'eq-jump': {
          '0%, 100%': { transform: 'scaleY(0.25)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
