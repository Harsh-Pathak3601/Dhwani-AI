/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D1B2A',
        primary: '#1D9E75',
        danger: '#E24B4A',
        warning: '#EF9F27',
        textMain: '#E8E6E1',
      }
    },
  },
  plugins: [],
}
