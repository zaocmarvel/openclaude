import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bro: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        aggressive: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          light: "#fca5a5",
        },
        funny: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          light: "#fcd34d",
        },
        cold: {
          DEFAULT: "#06b6d4",
          dark: "#0891b2",
          light: "#67e8f9",
        },
        heartbreak: {
          DEFAULT: "#8b5cf6",
          dark: "#7c3aed",
          light: "#c4b5fd",
        },
        respect: {
          DEFAULT: "#10b981",
          dark: "#059669",
          light: "#6ee7b7",
        },
        dark: {
          bg: "#0f0f0f",
          card: "#1a1a1a",
          border: "#2a2a2a",
          text: "#f5f5f5",
          muted: "#737373",
        },
      },
      animation: {
        "pulse-fast": "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "shake": "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        shake: {
          "10%, 90%": { transform: "translate3d(-1px, 0, 0)" },
          "20%, 80%": { transform: "translate3d(2px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-4px, 0, 0)" },
          "40%, 60%": { transform: "translate3d(4px, 0, 0)" },
        },
        slideUp: {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          from: { transform: "translateY(-100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.9)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glow: {
          from: { boxShadow: "0 0 10px #0ea5e9, 0 0 20px #0ea5e9, 0 0 30px #0ea5e9" },
          to: { boxShadow: "0 0 20px #38bdf8, 0 0 30px #38bdf8, 0 0 40px #38bdf8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.3)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.3)" },
          "70%": { transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-bro": "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)",
        "gradient-aggressive": "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        "gradient-funny": "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
        "gradient-cold": "linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)",
        "gradient-heartbreak": "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)",
        "gradient-respect": "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
      },
      boxShadow: {
        "bro": "0 0 20px rgba(14, 165, 233, 0.5)",
        "bro-lg": "0 0 40px rgba(14, 165, 233, 0.6)",
        "aggressive": "0 0 20px rgba(239, 68, 68, 0.5)",
        "funny": "0 0 20px rgba(245, 158, 11, 0.5)",
        "cold": "0 0 20px rgba(6, 182, 212, 0.5)",
        "heartbreak": "0 0 20px rgba(139, 92, 246, 0.5)",
        "respect": "0 0 20px rgba(16, 185, 129, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
