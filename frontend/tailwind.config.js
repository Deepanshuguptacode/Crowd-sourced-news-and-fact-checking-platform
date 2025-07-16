/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sigmar: ['Sigmar', 'serif'], 
        kanit: ['Kanit', 'serif'],
      },colors: {
        teal: "#2E8B94",
        gold: "#D4AF37",
        charcoal: "#2D3748",
        offwhite: "#F8F9FA"
      },animation: {
      'spin-slow': 'spin 10s linear infinite',
    }
    },
  },
  plugins: [],
};

