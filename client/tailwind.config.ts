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
        primary: {
          DEFAULT: '#FF6D00',
          light: '#FFAB00',
          dark: '#E65100',
        },
        cyber: {
          orange: '#FF6D00',
          amber: '#FFAB00',
          dark: '#080c12',
          glow: 'rgba(255, 109, 0, 0.4)',
        },
        danger: '#E24B4A',
        warning: '#EF9F27',
        textMain: '#E8E6E1',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        brand: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        instrument: ['"Instrument Serif"', 'Georgia', 'serif'],
        kaushan: ['"Kaushan Script"', 'cursive'],
        satisfy: ['"Satisfy"', 'cursive'],
      },
    },
  },
  plugins: [],
}
