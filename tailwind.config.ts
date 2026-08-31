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
        background: "#0B0E14",
        surface: {
          DEFAULT: "#121824",
          elevated: "#1A2234",
          card: "#151C2C",
          border: "#26334D",
        },
        neon: {
          cyan: "#00F5D4",
          purple: "#9D4EDD",
          magenta: "#FF007F",
          gold: "#FFB703",
          green: "#10B981",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "bounce-subtle": "bounce-subtle 1.5s infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 245, 212, 0.3), 0 0 15px rgba(0, 245, 212, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 245, 212, 0.6), 0 0 35px rgba(0, 245, 212, 0.4)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
