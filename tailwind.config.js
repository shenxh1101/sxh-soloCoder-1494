/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
      },
    },
    extend: {
      colors: {
        ink: {
          50: "#f5f5f7",
          100: "#e4e4ea",
          200: "#c9c9d4",
          300: "#9d9dae",
          400: "#6b6b82",
          500: "#4a4a61",
          600: "#36364a",
          700: "#27273a",
          800: "#1a1a2e",
          900: "#12121f",
        },
        rosegold: {
          50: "#fdf6f3",
          100: "#faeadf",
          200: "#f4d1bf",
          300: "#ecb296",
          400: "#e2906d",
          500: "#d97450",
          600: "#c55a3a",
          700: "#a44832",
          800: "#853d2e",
          900: "#6e3529",
        },
        champagne: {
          50: "#fbf8ed",
          100: "#f5edcf",
          200: "#edd89b",
          300: "#e4bd63",
          400: "#d4af37",
          500: "#c29a2b",
          600: "#a77a24",
          700: "#885a21",
          800: "#704821",
          900: "#603d20",
        },
      },
      fontFamily: {
        display: ["'Lora'", "serif"],
        sans: ["'Noto Sans SC'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(26, 26, 46, 0.08), 0 2px 6px -2px rgba(26, 26, 46, 0.04)",
        cardHover: "0 12px 32px -8px rgba(26, 26, 46, 0.12), 0 4px 12px -4px rgba(26, 26, 46, 0.06)",
        gold: "0 0 0 1px rgba(212, 175, 55, 0.3), 0 8px 24px -8px rgba(212, 175, 55, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(212, 175, 55, 0)" },
        },
      },
    },
  },
  plugins: [],
};
