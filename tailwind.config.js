/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./shop/index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./shop/**/*.{js,ts,jsx,tsx}",
    "./product/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        dark: {
          900: "#0B0C15",
          800: "#151621",
          700: "#1E1F2E",
        },
        neon: {
          purple: "#8B5CF6",
          cyan: "#06B6D4",
          orange: "#F97316",
        },
      },
    },
  },
  plugins: [],
}
