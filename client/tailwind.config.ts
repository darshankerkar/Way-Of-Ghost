import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ghost: {
          bg: "#050507",
          panel: "#090d16",
          gold: "#38bdf8", /* Changed to neon cyan but keeping key as 'gold' for backwards-compat in class names, or simply adding it */
          cyan: "#38bdf8",
          green: "#2ecc71",
          red: "#e74c3c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
