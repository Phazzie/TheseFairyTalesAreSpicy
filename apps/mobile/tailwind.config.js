/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7c3aed',
          deep: '#1a0a2e',
          rose: '#e11d48',
          gold: '#d97706',
        },
      },
    },
  },
  plugins: [],
};
