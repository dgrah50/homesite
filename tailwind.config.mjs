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
        headingcolor: "rgba(255, 255, 255, .95)",
        subheadingcolor: "rgba(255, 255, 255, .75)",
        textcolor: "rgba(255, 255, 255, .5)",
        descriptioncolor: "rgba(255, 234, 204, .3)",
      },
      fontSize: {
        xxs: "0.6rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
