/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'flash-red': 'flashRed 0.5s ease-in-out 3',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.4s ease-out',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flashRed: {
          '0%, 100%': { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgb(239, 68, 68)' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: 'rgb(185, 28, 28)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.7' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8) translateY(-10px)', opacity: '0' },
          '70%': { transform: 'scale(1.05) translateY(2px)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
      },
      colors: {
        dark: {
          bg: '#0A0A0F',
          secondary: '#111118',
          card: '#16161F',
          elevated: '#1C1C28',
          border: '#2A2A3A',
          borderSubtle: '#1E1E2E',
          accent: '#6C63FF',
          teal: '#4ECDC4',
          danger: '#FF6B6B',
          success: '#51CF66',
          warning: '#FFD43B',
          orange: '#FF8C42',
          textPrimary: '#FFFFFF',
          textSecondary: '#A0A0B8',
          textMuted: '#5A5A7A',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [],
}
