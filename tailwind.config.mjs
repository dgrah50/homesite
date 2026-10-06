/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Palette shared with the splash: lime glow over near-black.
        primary: "#a4ed51",
        background: {
          DEFAULT: "#0b0d0a",
          dark: "#000000",
        },
        border: {
          DEFAULT: "rgba(232, 236, 230, 0.09)",
        },
        text: {
          primary: "#a4ed51",
          heading: "#e8ece6",
          subheading: "#c9d1c4",
          body: "#a6b39c",
          description: "#8f9a88",
        },
      },
      fontSize: {
        headline: "3rem",
        xxs: "0.6rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["CQ Mono", "monospace"],
        softglyphs: ["Softglyphs", "sans-serif"],
      },
      boxShadow: {
        header:
          "0px 8px 10px 0px rgba(0, 0, 0, 0.08), 0px 3px 16px 0px rgba(0, 0, 0, 0.08), 0px 4px 5px 0px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
