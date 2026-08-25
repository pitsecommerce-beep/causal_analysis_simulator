/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F0F6FB",
          100: "#E1ECF5",
          200: "#C0D6E9",
          300: "#8AAFD3",
          400: "#4C82B8",
          500: "#1E5A96",
          600: "#14487A",
          700: "#00305B",
          800: "#00284E",
          900: "#001F3D",
          950: "#00152B",
        },
        gold: {
          100: "#FAF7EF",
          200: "#F3EDDC",
          300: "#E9DDBF",
          400: "#D9BF86",
          500: "#C6A65C",
          600: "#B08D3F",
          700: "#9C7A2C",
          800: "#8A6A24",
          900: "#6B5219",
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
