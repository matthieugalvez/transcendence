/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Roboto", "cursive"],
        heading: ["Canada-big", "sans-serif"],
        tech: ["Orbitron", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}