/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oc-red': '#DC2626',
        'oc-dark': '#1E1B4B',
        'oc-accent': '#EF4444',
      }
    },
  },
  plugins: [],
}
