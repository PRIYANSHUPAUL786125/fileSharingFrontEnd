/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F172A',
        surface: '#1E293B',
        border: '#334155',
        muted: '#94A3B8',
        primary: '#6366F1',
        'primary-hover': '#4F46E5',
        'primary-glow': 'rgba(99,102,241,0.25)',
        accent: '#22C55E',
        danger: '#EF4444',
        foreground: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(99,102,241,0.4)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.25)',
      },
      keyframes: {
        pulse_ring: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        fadein: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulse_ring: 'pulse_ring 1.2s ease-out infinite',
        fadein: 'fadein 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
