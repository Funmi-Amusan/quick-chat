/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Add your custom colors here
        primary: '#FFB0FE',
        body: '#FFFFFF',
        grey: '#8A8CA9',
        mint: '#7ED3B2'
        // 'accent': '#F59E0B',
        // 'danger': '#EF4444',
        // // You can also add variants
        // 'primary-light': '#93C5FD',
        // 'primary-dark': '#1E40AF',
      },
    },
  },
  plugins: [],
};
