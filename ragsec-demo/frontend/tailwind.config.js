/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#0d1117',
        primary: '#00d2ff',
        secondary: '#1e3a8a',
        accent: '#39ff14',
        critical: '#ff003c',
        border: '#1f2937',
        // Cyberpunk colors
        'cyber-black': '#0a0a0c',
        'cyber-dark': '#121216',
        'cyber-gray': '#8e8e9f',
        'cyber-cyan': '#00d2ff',
        'cyber-pink': '#ff003c',
        'cyber-yellow': '#fadf00',
        'cyber-purple': '#b026ff',
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
