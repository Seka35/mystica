/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#080010',
        'gold-light': '#F0C040',
        'gold-mid': '#C8963C',
        'gold-dark': '#8B6914',
        mystic: '#1A0A2E',
        'love-accent': '#8B1A3A',
        'work-accent': '#1A2E6B',
        'money-accent': '#6B5A1A',
        'spiritual-accent': '#4A1A6B',
        'free-accent': '#1A5A5A',
      },
      fontFamily: {
        oracle: ['Cinzel Decorative', 'serif'],
        reading: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(240, 192, 64, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(240, 192, 64, 0.8), 0 0 60px rgba(240, 192, 64, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F0C040, #C8963C, #F0C040)',
        'void-radial': 'radial-gradient(ellipse at center, #1A0A2E 0%, #080010 70%)',
        'card-bg': 'radial-gradient(ellipse at 50% 30%, #1A0A2E 0%, #080010 100%)',
      },
    },
  },
  plugins: [],
}
