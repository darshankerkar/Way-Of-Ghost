import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ghost: {
          bg:    "#080406",
          panel: "#180a0c",
          gold:  "#c9a227",  /* samurai gold  */
          red:   "#c0392b",  /* blood crimson */
          green: "#4a7c59",  /* muted jade    */
        },
        ronin: {
          black:  "#080406",
          deep:   "#0f0508",
          dark:   "#180a0c",
          red:    "#8b1a1a",
          crimson:"#c0392b",
          gold:   "#c9a227",
          ash:    "#eae0d5",
        },
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        "cinzel-dec": ["Cinzel Decorative", "serif"],
        inter:  ["Inter", "sans-serif"],
        noto:   ["Noto Serif JP", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
