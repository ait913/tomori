import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        tomori: {
          bg: {
            light: "#FFF8EE",
            dark: "#1B1814"
          },
          surface: {
            light: "#FFFFFF",
            dark: "#2A2521"
          },
          text: {
            light: "#3A2E1F",
            dark: "#F4EADC"
          },
          muted: {
            light: "#8A7B6A",
            dark: "#A89A85"
          },
          accent: {
            50: "#FFF3DC",
            100: "#FFE3B0",
            300: "#FFC468",
            500: "#F0A030",
            700: "#B86B10"
          },
          danger: {
            500: "#D9534F"
          }
        }
      },
      boxShadow: {
        glow: "0 24px 60px rgba(240, 160, 48, 0.16)"
      },
      borderRadius: {
        "2xl": "1rem"
      },
      fontFamily: {
        sans: ["Avenir Next", "Hiragino Sans", "Yu Gothic", "sans-serif"]
      }
    }
  }
};

export default config;
