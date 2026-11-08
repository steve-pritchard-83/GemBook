/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-lora)", "Georgia", "serif"],
        display: ["var(--font-cinzel)", "Georgia", "serif"],
        sans: ["var(--font-quicksand)", "system-ui", "sans-serif"],
      },
      colors: {
        parchment: {
          50: "#fdfaf3",
          100: "#f9f1df",
          200: "#f1e2c1",
          300: "#e6cd9b",
          800: "#4a3823",
          900: "#2c2013",
        },
        night: {
          800: "#141829",
          900: "#0b0e1a",
          950: "#060811",
        },
      },
    },
  },
  plugins: [],
};
