/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
  extend: {
    colors: {
      canvas: {
        blue: "#008EE2",
        blueLight: "#1DA1F2",
        grayDark: "#2D3B45",
        grayMedium: "#3A4C59",
        grayLight: "#F7F8FA",
        green: "#28A745",
        red: "#D6392C",
        border: "#E3E8EE",
      },
    },
    fontFamily: {
      lato: ['"Lato"', "sans-serif"],
    },
  },
},
  plugins: [],
};


