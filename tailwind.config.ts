import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11110F",
        coal: "#1C1C1A",
        bone: "#F3F0EA",
        stone: "#E6E2DA",
        granite: "#6F6C66",
        mist: "#B9B5AD",
        sakura: "#F2A3C4",
        bloom: "#E0558F",
      },
      fontFamily: {
        sans: ['"Archivo Variable"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: { label: "0.14em" },
      maxWidth: { site: "1440px" },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
} satisfies Config;
