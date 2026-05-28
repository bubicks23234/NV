/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00767a',
          light: '#00919a',
          dark: '#005a5d',
          50: '#e6f4f5',
        },
        accent: {
          DEFAULT: '#c9a227',
          hover: '#b8921f',
        },
        surface: {
          DEFAULT: '#fafbfc',
          card: '#ffffff',
          muted: '#f1f5f6',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(0, 90, 93, 0.12)',
        glow: '0 0 40px -8px rgba(0, 118, 122, 0.35)',
        card: '0 8px 32px -8px rgba(15, 23, 42, 0.1)',
      },
      animation: {
        'ken-burns': 'kenBurns 28s ease-in-out infinite alternate',
        float: 'float 5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
      keyframes: {
        kenBurns: {
          '0%': { transform: 'scale(1.02) translate(0, 0)' },
          '50%': { transform: 'scale(1.07) translate(-0.5%, -0.3%)' },
          '100%': { transform: 'scale(1.04) translate(0.4%, 0.2%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
