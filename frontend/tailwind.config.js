/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2f7ce0",
          600: "#1d5fc4",
          700: "#1a4ea0",
          800: "#183f7f",
          900: "#173568",
        },
      },
    },
  },
  plugins: [],
};
