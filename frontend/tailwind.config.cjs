/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A2342',
        accent: {
          DEFAULT: '#FF8C00',
          hover: '#FFA500',
        },
      },
    },
  },
  plugins: [],
}
