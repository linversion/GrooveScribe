/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cursor: {
          bg: '#181818',
          sidebar: '#1f1f1f',
          border: '#2b2b2b',
          text: '#cccccc',
          textActive: '#ffffff',
          accent: '#3794ff',
          input: '#2b2b2b'
        }
      }
    },
  },
  plugins: [],
}
