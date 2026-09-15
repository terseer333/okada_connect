/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        okada: {
          DEFAULT: '#16a34a', // green — ties to Nigerian identity, works in light/dark
          dark: '#15803d',
        },
      },
    },
  },
  plugins: [],
};
