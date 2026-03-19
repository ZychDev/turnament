/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#070B14',
        bg2: '#0A1428',
        bg3: '#0D1B2E',
        gold: '#C8AA6E',
        gold2: '#C89B3C',
        border: '#1A2A3E',
        dim: '#5A6880',
        lolred: '#C84040',
        lolgreen: '#3CB878',
        lolblue: '#1A9FD4',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
