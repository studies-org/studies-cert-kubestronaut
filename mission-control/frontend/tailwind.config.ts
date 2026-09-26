import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        bg: "#0B0F1A",
        surface: "#131826",
        surface2: "#1A2236",
        border: "#232B45",
        primary: "#326CE5",
        accent: "#FF6B35",
        success: "#00D9A3",
        warning: "#FFC857",
        danger: "#FF4757",
        ink: "#E6EAF2",
        mute: "#8892A6",
      },
    },
  },
  plugins: [],
};

export default config;
