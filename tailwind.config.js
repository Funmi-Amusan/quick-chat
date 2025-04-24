/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './screens/**/*.{js,ts,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FFB0FE',
        lighterPrimary: '#FFDBFF',
        body: {
          light: '#f9f9f9',
          dark: '#121212',
        },
        greyBg: {
          light: '#242934',
          dark: '#666666',
        },
        inputDark: '#1F1F1F',
        title: {
          light: '#1f2937',
          dark: '#ffff',
        },
        greyText: {
          light: '#666666',
          dark: '#AAAAAA',
        },
        inputText: {
          light: '#000000',
          dark: '#ffffff',
        },
        card: {
          light: '',
          dark: '#19191B',
        },
        grey: '#8A8CA9',
        mint: '#7ED3B2',
      },
    },
  },
  plugins: [],
};
