/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'cinematic': {
          'bg': '#0a0a0a',
          'card': '#1a1a1a',
          'border': '#2d2d2d',
          'gold': '#d4af37',
          'champagne': '#f8e8c8',
          'accent': '#c9a961',
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #c9a961 100%)',
        'gradient-film': 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
      },
      boxShadow: {
        'cinematic': '0 20px 60px rgba(212, 175, 55, 0.15), 0 10px 30px rgba(0, 0, 0, 0.8)',
        'ava-glow': '0 0 40px rgba(212, 175, 55, 0.25), inset 0 0 20px rgba(212, 175, 55, 0.1)',
      },
    },
  },
  plugins: [],
};
