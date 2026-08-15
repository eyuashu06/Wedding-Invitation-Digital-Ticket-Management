/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        "4.5": "1.125rem",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        script: ['"Great Vibes"', "cursive"],
      },
      colors: {
        gold: {
          50: "#fbf7ee",
          100: "#f5ecd2",
          200: "#ead8a4",
          300: "#ddbf6d",
          400: "#d4a849",
          500: "#c8912f",
          600: "#a87324",
          700: "#855620",
          800: "#6e4620",
          900: "#5e3b20",
        },
        blush: {
          50: "#fdf5f5",
          100: "#fbe8e8",
          200: "#f7d3d3",
          300: "#f0b3b3",
          400: "#e78787",
          500: "#d96363",
          600: "#c74545",
          700: "#a83333",
          800: "#8a2c2c",
          900: "#722a2a",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e6ede6",
          200: "#cedccd",
          300: "#aac3a8",
          400: "#82a57f",
          500: "#618a5e",
          600: "#4c6f49",
          700: "#3e593c",
          800: "#344833",
          900: "#2d3c2c",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
