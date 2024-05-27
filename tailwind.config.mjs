/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0D6D01",
        background: "#1c1c1c",
        border: "rgba(255, 255, 255, .06)",
        textcolor: "rgba(255, 255, 255, .5)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
