/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0D6D01",
        background: {
          DEFAULT: "#1c1c1c",
          dark: "#141414",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
        },
        text: {
          heading: "rgba(255, 255, 255, 0.95)",
          subheading: "rgba(255, 255, 255, 0.75)",
          body: "rgba(255, 255, 255, 0.5)",
          description: "rgba(255, 234, 204, 0.3)",
        },
      },
      fontSize: {
        xxs: "0.6rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        header:
          "0px 8px 10px 0px rgba(0, 0, 0, 0.08), 0px 3px 16px 0px rgba(0, 0, 0, 0.08), 0px 4px 5px 0px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
