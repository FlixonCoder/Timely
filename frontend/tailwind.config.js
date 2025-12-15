/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // this makes the `.dark` class trigger dark: variants
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};