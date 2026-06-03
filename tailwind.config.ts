import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D0F",
        surface: "#161519",
        "surface-up": "#1E1C22",
        border: "rgba(255,255,255,0.08)",
        pink: {
          DEFAULT: "#FF1B6B",
          soft: "#FF2E88"
        },
        fire: {
          orange: "#FF6A3D",
          gold: "#FFB13D"
        },
        text: {
          DEFAULT: "#F5F5F7",
          muted: "#9A9AA0"
        }
      },
      fontFamily: {
        display: ["Anton", "system-ui", "sans-serif"],
        body: ["Outfit", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        fire: "linear-gradient(135deg, #FF1B6B 0%, #FF6A3D 60%, #FFB13D 100%)"
      },
      keyframes: {
        "pulse-fire": {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.18)" }
        },
        glow: {
          "0%,100%": { boxShadow: "0 0 18px rgba(255,27,107,.5)" },
          "50%": { boxShadow: "0 0 30px rgba(255,27,107,.85)" }
        }
      },
      animation: {
        "pulse-fire": "pulse-fire .4s ease",
        glow: "glow 2.5s infinite"
      }
    }
  },
  plugins: []
};

export default config;
